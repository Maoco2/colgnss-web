import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { getDistance } from 'geolib';
import { Station, StationType } from './station.entity';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { FilterStationDto } from './dto/filter-station.dto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class StationsService implements OnModuleInit {
  private readonly logger = new Logger(StationsService.name);

  constructor(
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
  ) {}

  async onModuleInit() {
    const passiveCount = await this.stationRepository.count({ where: { type: StationType.PASSIVE } });
    if (passiveCount >= 10000) return;

    if (passiveCount > 0) {
      this.logger.log(`Clearing ${passiveCount} incomplete passive stations before re-seed`);
      await this.stationRepository.delete({ type: StationType.PASSIVE });
    }

    const gpkgPaths = [
      path.resolve(__dirname, '../../../../RedPasivaGNSSCeM.gpkg'),
      path.resolve(process.cwd(), 'RedPasivaGNSSCeM.gpkg'),
    ];
    const gpkgPath = gpkgPaths.find(p => fs.existsSync(p));
    if (!gpkgPath) {
      this.logger.warn('RedPasivaGNSSCeM.gpkg not found, skipping passive seed');
      return;
    }

    this.seedPassiveStations(gpkgPath).catch(err =>
      this.logger.error(`Passive seed failed: ${err.message}`)
    );
  }

  private async seedPassiveStations(gpkgPath: string) {
    const start = Date.now();

    let rows: any[][];
    try {
      const initSqlJs = require('sql.js');
      const SQL = await initSqlJs();
      const buf = fs.readFileSync(gpkgPath);
      const db = new SQL.Database(buf);
      const result = db.exec('SELECT Nomenc, Lat, Long, AltElips, NomDpto, NomMpio, Tipo_Mat, Obs FROM VertGeod ORDER BY OBJECTID');
      db.close();

      if (!result.length || !result[0].values.length) {
        this.logger.warn('No data in VertGeod table');
        return;
      }
      rows = result[0].values;
    } catch (e) {
      this.logger.error(`Error reading GeoPackage: ${e.message}`);
      return;
    }

    const BATCH_SIZE = 200;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE).map((r: any[]) => ({
        code: String(r[0] || 'UNKNOWN'),
        name: `${String(r[5] || 'Unknown')} - ${String(r[0] || '')}`,
        type: StationType.PASSIVE,
        department: String(r[4] || 'Unknown'),
        municipality: String(r[5] || 'Unknown'),
        latitude: r[1],
        longitude: r[2],
        height: r[3] || null,
        materialType: String(r[6] || '').trim() || undefined,
        observations: String(r[7] || '').trim() || undefined,
        geom: { type: 'Point', coordinates: [r[2], r[1]] },
        status: 'active',
      }));

      try {
        await this.stationRepository.insert(batch);
        imported += batch.length;
      } catch (e) {
        this.logger.warn(`Batch ${i / BATCH_SIZE} failed (${batch.length} rows), trying individual inserts`);
        errors += batch.length;
        for (const record of batch) {
          try {
            await this.stationRepository.insert(record);
            imported++;
            errors--;
          } catch (e2) {
            this.logger.warn(`Skipping ${record.code}: ${e2.message}`);
          }
        }
      }

      if (i % 1000 === 0 && i > 0) {
        this.logger.log(`Seeded ${imported}/${rows.length} passive stations`);
      }
    }

    this.logger.log(`Seeded ${imported} passive stations in ${Date.now() - start}ms (${errors} errors)`);
  }

  async create(dto: CreateStationDto): Promise<Station> {
    const station = this.stationRepository.create({
      ...dto,
      geom: { type: 'Point', coordinates: [dto.longitude, dto.latitude] },
    });
    return this.stationRepository.save(station);
  }

  async findAll(filters: FilterStationDto) {
    const baseWhere: any = {};
    if (filters.type) baseWhere.type = filters.type;
    if (filters.department) baseWhere.department = filters.department;
    if (filters.municipality) baseWhere.municipality = filters.municipality;
    if (filters.status) baseWhere.status = filters.status;

    let where: any = baseWhere;
    if (filters.search) {
      const term = Like(`%${filters.search}%`);
      where = [
        { ...baseWhere, name: term },
        { ...baseWhere, code: term },
        { ...baseWhere, municipality: term },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const [data, total] = await this.stationRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Station> {
    const station = await this.stationRepository.findOne({ where: { id } });
    if (!station) throw new NotFoundException('Station not found');
    return station;
  }

  async update(id: string, dto: UpdateStationDto): Promise<Station> {
    const station = await this.findById(id);
    if (dto.latitude !== undefined || dto.longitude !== undefined) {
      (station as any).geom = {
        type: 'Point',
        coordinates: [dto.longitude || station.longitude, dto.latitude || station.latitude],
      };
    }
    Object.assign(station, dto);
    return this.stationRepository.save(station);
  }

  async remove(id: string): Promise<void> {
    const result = await this.stationRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Station not found');
  }

  async findNearest(latitude: number, longitude: number, type?: string, limit = 2) {
    const where: any = {};
    if (type && type !== 'mixed') where.type = type;

    const stations = await this.stationRepository.find({ where });

    const withDistance = stations.map(s => ({
      ...s,
      _distance: getDistance(
        { latitude, longitude },
        { latitude: s.latitude, longitude: s.longitude },
      ),
    }));

    withDistance.sort((a, b) => a._distance - b._distance);
    return withDistance.slice(0, limit);
  }

  async findWithinRadius(latitude: number, longitude: number, radiusKm: number, type?: StationType) {
    const where: any = {};
    if (type) where.type = type;

    const stations = await this.stationRepository.find({ where });

    return stations.filter(s => {
      const dist = getDistance(
        { latitude, longitude },
        { latitude: s.latitude, longitude: s.longitude },
      );
      return dist <= radiusKm * 1000;
    });
  }

  async getDepartments(): Promise<string[]> {
    const stations = await this.stationRepository.find({ select: ['department'] });
    return [...new Set(stations.map(s => s.department))].sort();
  }

  async getStatistics() {
    const total = await this.stationRepository.count();
    const active = await this.stationRepository.count({ where: { type: StationType.ACTIVE } });
    const passive = await this.stationRepository.count({ where: { type: StationType.PASSIVE } });
    return { total, active, passive };
  }
}
