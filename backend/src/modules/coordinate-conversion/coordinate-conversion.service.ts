import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IgacSqliteService } from './igac-sqlite.service';
import { CoordinateTransformerService } from './coordinate-transformer.service';
import { ConversionHistory } from './conversion-history.entity';

@Injectable()
export class CoordinateConversionService {
  private readonly logger = new Logger(CoordinateConversionService.name);

  constructor(
    @InjectRepository(ConversionHistory)
    private historyRepo: Repository<ConversionHistory>,
    private readonly igac: IgacSqliteService,
    private readonly transformer: CoordinateTransformerService,
  ) {}

  getReferenceSystems() {
    this.ensureLoaded();
    return this.igac.getReferenceSystems().map(s => ({ id: s.PK_SISTEMA, name: s.NOMBRE, ellipsoidId: s.FK_ELIPSOIDE }));
  }

  getCoordinateTypes(systemId: number) {
    this.ensureLoaded();
    return this.igac.getCoordinateTypes(systemId);
  }

  getGaussZones(systemId: number) {
    this.ensureLoaded();
    return this.igac.getGaussKrugerZones(systemId);
  }

  getDepartments() {
    this.ensureLoaded();
    return this.igac.getDepartments().map(d => ({ id: d.PK_DEPARTAMENTO, name: d.NOMBRE }));
  }

  getMunicipalities(departmentId: number) {
    this.ensureLoaded();
    return this.igac.getMunicipalities(departmentId).map(m => ({ id: m.PK_MUNICIPIOS, name: m.NOMBRE }));
  }

  getOrigins(systemId: number, municipalityPk?: number) {
    this.ensureLoaded();
    return this.igac.getLocalOrigins(systemId, municipalityPk).map(o => ({
      id: o.PK_ORIGENES_CART,
      name: o.NOMBRE,
      latitude: o.LATITUD,
      longitude: o.LONGITUD,
      falseNorth: o.NORTE,
      falseEast: o.ESTE,
      planeHeight: o.PLANO_PROY,
      description: o.DESCRIP,
      official: !!o.OFICIAL,
    }));
  }

  async convertPoint(userId: string, dto: any) {
    this.ensureLoaded();
    const start = Date.now();

    let sourceOrigin: any = null;
    if (dto.sourceCoordType === 'origen_nacional') {
      sourceOrigin = this.igac.getOrigenNacionalZone(dto.sourceSystemId);
      if (!sourceOrigin) throw new BadRequestException('Origen Nacional not available for this system');
    } else if (dto.sourceOriginId && dto.sourceCoordType === 'gauss_kruger') {
      const zones = this.igac.getGaussKrugerZones(dto.sourceSystemId);
      sourceOrigin = zones.find(z => z.PK_ORIGENES_GAUSS === dto.sourceOriginId);
      if (!sourceOrigin) throw new BadRequestException('Invalid source Gauss-Kruger zone');
    } else if (dto.sourceOriginId && dto.sourceCoordType === 'local_cartesian') {
      const origins = this.igac.getLocalOrigins(dto.sourceSystemId);
      sourceOrigin = origins.find(o => o.PK_ORIGENES_CART === dto.sourceOriginId);
      if (!sourceOrigin) throw new BadRequestException('Invalid source local origin');
    }

    let targetOrigin: any = null;
    if (dto.targetCoordType === 'origen_nacional') {
      targetOrigin = this.igac.getOrigenNacionalZone(dto.targetSystemId);
      if (!targetOrigin) throw new BadRequestException('Origen Nacional not available for this system');
    } else if (dto.targetOriginId && dto.targetCoordType === 'gauss_kruger') {
      const zones = this.igac.getGaussKrugerZones(dto.targetSystemId);
      targetOrigin = zones.find(z => z.PK_ORIGENES_GAUSS === dto.targetOriginId);
      if (!targetOrigin) throw new BadRequestException('Invalid target Gauss-Kruger zone');
    } else if (dto.targetOriginId && dto.targetCoordType === 'local_cartesian') {
      const origins = this.igac.getLocalOrigins(dto.targetSystemId);
      targetOrigin = origins.find(o => o.PK_ORIGENES_CART === dto.targetOriginId);
      if (!targetOrigin) throw new BadRequestException('Invalid target local origin');
    }

    const values: any = {};
    if (dto.lat !== undefined) values.lat = dto.lat;
    if (dto.lon !== undefined) values.lon = dto.lon;
    if (dto.h !== undefined) values.h = dto.h;
    if (dto.x !== undefined) values.x = dto.x;
    if (dto.y !== undefined) values.y = dto.y;
    if (dto.z !== undefined) values.z = dto.z;
    if (dto.north !== undefined) values.north = dto.north;
    if (dto.east !== undefined) values.east = dto.east;

    this.validateCoordinateValues(dto.sourceCoordType, values);

    const srcSys = this.igac.getReferenceSystems().find(s => s.PK_SISTEMA === dto.sourceSystemId);
    const tgtSys = this.igac.getReferenceSystems().find(s => s.PK_SISTEMA === dto.targetSystemId);

    const { result, intermediate, convergence, scale } = this.transformer.convert({
      sourceSystemId: dto.sourceSystemId,
      sourceCoordType: dto.sourceCoordType,
      sourceOrigin,
      targetSystemId: dto.targetSystemId,
      targetCoordType: dto.targetCoordType,
      targetOrigin,
      values,
    });

    const elapsed = Date.now() - start;

    const history = this.historyRepo.create({
      userId,
      sourceSystemId: dto.sourceSystemId,
      sourceSystemName: srcSys?.NOMBRE || '',
      sourceCoordType: dto.sourceCoordType,
      sourceOriginId: dto.sourceOriginId || null,
      sourceOriginName: sourceOrigin?.NOMBRE || null,
      targetSystemId: dto.targetSystemId,
      targetSystemName: tgtSys?.NOMBRE || '',
      targetCoordType: dto.targetCoordType,
      targetOriginId: dto.targetOriginId || null,
      targetOriginName: targetOrigin?.NOMBRE || null,
      originalCoords: values,
      convertedCoords: result,
      processingTimeMs: elapsed,
    });
    await this.historyRepo.save(history);

    return {
      id: history.id,
      source: { system: srcSys?.NOMBRE, type: dto.sourceCoordType, origin: sourceOrigin?.NOMBRE || null, coords: values },
      target: { system: tgtSys?.NOMBRE, type: dto.targetCoordType, origin: targetOrigin?.NOMBRE || null, coords: result },
      intermediate: { lat: intermediate.lat, lon: intermediate.lon, h: intermediate.h },
      convergence,
      scale: scale ? Math.round(scale * 1e9) / 1e9 : undefined,
      processingTimeMs: elapsed,
    };
  }

  async batchConvert(userId: string, dto: any, file: any) {
    this.ensureLoaded();

    let records: any[];
    const ext = file.originalname.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      records = this.parseCsv(file.buffer);
    } else if (ext === 'xlsx') {
      records = this.parseXlsx(file.buffer);
    } else if (ext === 'txt') {
      records = this.parseTxt(file.buffer);
    } else {
      throw new BadRequestException('Unsupported file format. Use CSV, XLSX, or TXT.');
    }

    if (records.length === 0) throw new BadRequestException('File is empty');
    if (records.length > 10000) throw new BadRequestException('Maximum 10,000 records per file');

    const start = Date.now();
    let successCount = 0;
    let errorCount = 0;
    const results: any[] = [];

    let sourceOrigin: any = null;
    if (dto.sourceCoordType === 'origen_nacional') {
      sourceOrigin = this.igac.getOrigenNacionalZone(dto.sourceSystemId);
    } else if (dto.sourceOriginId && dto.sourceCoordType === 'gauss_kruger') {
      const zones = this.igac.getGaussKrugerZones(dto.sourceSystemId);
      sourceOrigin = zones.find(z => z.PK_ORIGENES_GAUSS === dto.sourceOriginId);
    } else if (dto.sourceOriginId && dto.sourceCoordType === 'local_cartesian') {
      const origins = this.igac.getLocalOrigins(dto.sourceSystemId);
      sourceOrigin = origins.find(o => o.PK_ORIGENES_CART === dto.sourceOriginId);
    }

    let targetOrigin: any = null;
    if (dto.targetCoordType === 'origen_nacional') {
      targetOrigin = this.igac.getOrigenNacionalZone(dto.targetSystemId);
    } else if (dto.targetOriginId && dto.targetCoordType === 'gauss_kruger') {
      const zones = this.igac.getGaussKrugerZones(dto.targetSystemId);
      targetOrigin = zones.find(z => z.PK_ORIGENES_GAUSS === dto.targetOriginId);
    } else if (dto.targetOriginId && dto.targetCoordType === 'local_cartesian') {
      const origins = this.igac.getLocalOrigins(dto.targetSystemId);
      targetOrigin = origins.find(o => o.PK_ORIGENES_CART === dto.targetOriginId);
    }

    const columnMapping = dto.columnMapping ? JSON.parse(dto.columnMapping) : {};

    for (const record of records) {
      try {
        const values = this.mapRecord(record, columnMapping, dto.sourceCoordType);
        this.validateCoordinateValues(dto.sourceCoordType, values);

        const { result } = this.transformer.convert({
          sourceSystemId: dto.sourceSystemId,
          sourceCoordType: dto.sourceCoordType,
          sourceOrigin,
          targetSystemId: dto.targetSystemId,
          targetCoordType: dto.targetCoordType,
          targetOrigin,
          values,
        });

        results.push({ ...record, converted: result, error: null });
        successCount++;
      } catch (err: any) {
        results.push({ ...record, converted: null, error: err.message });
        errorCount++;
      }
    }

    const elapsed = Date.now() - start;

    const history = this.historyRepo.create({
      userId,
      sourceSystemId: dto.sourceSystemId,
      sourceSystemName: this.igac.getReferenceSystems().find(s => s.PK_SISTEMA === dto.sourceSystemId)?.NOMBRE || '',
      sourceCoordType: dto.sourceCoordType,
      sourceOriginId: dto.sourceOriginId || null,
      sourceOriginName: sourceOrigin?.NOMBRE || null,
      targetSystemId: dto.targetSystemId,
      targetSystemName: this.igac.getReferenceSystems().find(s => s.PK_SISTEMA === dto.targetSystemId)?.NOMBRE || '',
      targetCoordType: dto.targetCoordType,
      targetOriginId: dto.targetOriginId || null,
      targetOriginName: targetOrigin?.NOMBRE || null,
      originalCoords: { totalRecords: records.length },
      convertedCoords: {},
      processingTimeMs: elapsed,
      fileName: file.originalname,
      totalRecords: records.length,
      successCount,
      errorCount,
    });
    await this.historyRepo.save(history);

    return {
      historyId: history.id,
      totalRecords: records.length,
      successCount,
      errorCount,
      processingTimeMs: elapsed,
      results,
    };
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.historyRepo.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private ensureLoaded() {
    if (!this.igac.isLoaded()) throw new BadRequestException('Igac.s3db database not loaded. Coordinate conversion unavailable.');
  }

  private validateCoordinateValues(type: string, values: any) {
    if (type === 'geographic') {
      if (values.lat === undefined || values.lon === undefined) throw new BadRequestException('Latitude and longitude are required');
      if (values.lat < -90 || values.lat > 90) throw new BadRequestException('Latitude must be between -90 and 90');
      if (values.lon < -180 || values.lon > 180) throw new BadRequestException('Longitude must be between -180 and 180');
    } else if (type === 'geocentric_xyz') {
      if (values.x === undefined || values.y === undefined || values.z === undefined)
        throw new BadRequestException('X, Y, and Z coordinates are required');
    } else if (type === 'gauss_kruger' || type === 'origen_nacional' || type === 'local_cartesian') {
      if (values.north === undefined || values.east === undefined)
        throw new BadRequestException('North and East coordinates are required');
    }
  }

  private parseCsv(buffer: Buffer | string): any[] {
    const text = typeof buffer === 'string' ? buffer : buffer.toString('utf-8');
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = this.parseCsvLine(lines[0]);
    return lines.slice(1).map(line => {
      const vals = this.parseCsvLine(line);
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = vals[i]; });
      return obj;
    }).filter(r => Object.values(r).some(v => v !== undefined));
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  }

  private parseXlsx(buffer: Buffer): any[] {
    try {
      const XLSX = require('xlsx');
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      return rows as any[];
    } catch {
      throw new BadRequestException('Failed to parse Excel file. Ensure it is a valid .xlsx file.');
    }
  }

  private parseTxt(buffer: Buffer): any[] {
    const text = buffer.toString('utf-8');
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const separators = ['\t', ';', ','];
    const first = lines[0];
    const sep = separators.find(s => first.includes(s)) || ',';
    if (!first.includes(sep)) {
      return lines.map((line, i) => ({ line: i + 1, value: line }));
    }
    return this.parseCsv(text);
  }

  private mapRecord(record: any, mapping: any, coordType: string): any {
    const values: any = {};
    if (coordType === 'geographic') {
      values.lat = parseFloat(record[mapping.latCol || 'lat'] ?? record.lat ?? record.latitude ?? record.Latitud);
      values.lon = parseFloat(record[mapping.lonCol || 'lon'] ?? record.lon ?? record.lng ?? record.longitude ?? record.Longitud);
      values.h = parseFloat(record[mapping.hCol || 'h'] ?? record.h ?? record.height ?? record.Altura);
    } else if (coordType === 'geocentric_xyz') {
      values.x = parseFloat(record[mapping.xCol || 'x'] ?? record.x ?? record.X);
      values.y = parseFloat(record[mapping.yCol || 'y'] ?? record.y ?? record.Y);
      values.z = parseFloat(record[mapping.zCol || 'z'] ?? record.z ?? record.Z);
    } else {
      values.north = parseFloat(record[mapping.northCol || 'north'] ?? record.north ?? record.Norte ?? record.N);
      values.east = parseFloat(record[mapping.eastCol || 'east'] ?? record.east ?? record.Este ?? record.E);
    }
    if (isNaN(values.north) && isNaN(values.lat)) throw new Error('Could not map coordinate columns. Please check column mapping.');
    return values;
  }
}
