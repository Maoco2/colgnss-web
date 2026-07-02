import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import * as https from 'https';
import { Calculation } from '../calculations/calculation.entity';
import { User } from '../users/user.entity';
import { Station } from '../stations/station.entity';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectRepository(Calculation)
    private calculationRepository: Repository<Calculation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
  ) {}

  async generatePdfReport(calculationId: string, userId: string): Promise<Buffer> {
    const calculation = await this.calculationRepository.findOne({ where: { id: calculationId } });
    if (!calculation) throw new NotFoundException('Calculation not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const station1 = calculation.station1Id
      ? await this.stationRepository.findOne({ where: { id: calculation.station1Id } })
      : null;
    const station2 = calculation.station2Id
      ? await this.stationRepository.findOne({ where: { id: calculation.station2Id } })
      : null;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    await this.buildPdf(doc, calculation, user, station1, station2);
    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });
  }

  private async buildPdf(
    doc: PDFKit.PDFDocument,
    calculation: Calculation,
    user: User,
    station1: Station | null,
    station2: Station | null,
  ) {
    const primaryColor = '#1a5276';
    const secondaryColor = '#27ae60';

    // ── Page 1: Text content ──
    doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold')
      .text('ColGNSS', 50, 30);
    doc.fontSize(12).font('Helvetica')
      .text('Informe Técnico de Tiempo de Rastreo GNSS', 50, 65);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 50, 85);

    doc.fillColor('#333').fontSize(10).font('Helvetica');
    let y = 140;

    doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
      .text('Datos del Usuario', 50, y);
    y += 25;
    doc.fillColor('#333').fontSize(10).font('Helvetica')
      .text(`Nombre: ${user.fullName}`, 50, y)
      .text(`Email: ${user.email}`, 50, y + 15);

    y += 50;
    doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
      .text('Punto Seleccionado', 50, y);
    y += 25;
    doc.fillColor('#333').fontSize(10).font('Helvetica')
      .text(`Latitud: ${calculation.latitude.toFixed(6)}°`, 50, y)
      .text(`Longitud: ${calculation.longitude.toFixed(6)}°`, 50, y + 15)
      .text(`Red: ${calculation.networkType}`, 50, y + 30);

    y += 60;
    doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
      .text('Estaciones de Referencia', 50, y);
    y += 25;
    doc.fillColor('#333').fontSize(10).font('Helvetica')
      .text(`Estación 1: ${station1?.code || calculation.station1Code || calculation.station1Name || 'N/A'}`, 50, y)
      .text(`Distancia 1: ${calculation.distance1.toFixed(2)} km`, 50, y + 15);
    if (calculation.station2Name) {
      doc.text(`Estación 2: ${station2?.code || calculation.station2Code || calculation.station2Name}`, 50, y + 30)
        .text(`Distancia 2: ${calculation.distance2?.toFixed(2) || 'N/A'} km`, 50, y + 45);
    }

    y += 80;
    doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
      .text('Resultados del Cálculo', 50, y);
    y += 25;
    doc.fontSize(16).font('Helvetica-Bold').fillColor(secondaryColor)
      .text(`Tiempo Mínimo de Rastreo: ${calculation.trackingTime} minutos`, 50, y);
    y += 30;
    doc.fillColor('#333').fontSize(10).font('Helvetica')
      .text(`Método: ${calculation.method}`, 50, y)
      .text(`Frecuencia: ${calculation.isDualFrequency ? 'Dual (L1/L2)' : 'Simple (L1)'}`, 50, y + 15)
      .text(`Fecha del cálculo: ${new Date(calculation.createdAt).toLocaleString('es-CO')}`, 50, y + 30);

    if (calculation.observations) {
      y += 60;
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#e74c3c')
        .text('Observaciones:', 50, y);
      y += 20;
      doc.fontSize(9).font('Helvetica').fillColor('#333')
        .text(calculation.observations, 50, y, { width: 500 });
    }

    if (calculation.comparisonData) {
      y += 80;
      doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
        .text('Comparación de Redes', 50, y);
      y += 30;

      const comparison = calculation.comparisonData as any[];
      if (Array.isArray(comparison)) {
        doc.rect(50, y, 500, 20).fill('#f0f0f0');
        doc.fillColor('#333').fontSize(8).font('Helvetica-Bold');
        doc.text('Red', 55, y + 5);
        doc.text('Estación', 120, y + 5);
        doc.text('Distancia (km)', 240, y + 5);
        doc.text('Tiempo (min)', 350, y + 5);
        doc.text('Recomendada', 440, y + 5);

        y += 25;
        comparison.forEach((item: any, index: number) => {
          if (index % 2 === 0) doc.rect(50, y, 500, 20).fill('#fafafa');
          doc.fillColor('#333').fontSize(8).font('Helvetica');
          doc.text(item.networkType, 55, y + 5);
          doc.text(item.station || '', 120, y + 5);
          doc.text((item.distance || 0).toString(), 240, y + 5);
          doc.text((item.trackingTime || 0).toString(), 350, y + 5);
          doc.text(item.isRecommended ? '✓' : '', 440, y + 5);
          y += 22;
        });
      }
    }

    const fY = doc.page.height - 50 - 26;
    doc.rect(50, fY, 495, 26).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica')
      .text('ColGNSS - Plataforma de Planificación GNSS', 55, fY + 4)
      .text('Página 1', doc.page.width - 100, fY + 4, { width: 80, align: 'right' });

    doc.addPage();
    await this.drawMap(doc, calculation, station1, station2, 50);

    doc.rect(50, fY, 495, 26).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica')
      .text('ColGNSS - Plataforma de Planificación GNSS', 55, fY + 4)
      .text('Página 2', doc.page.width - 100, fY + 4, { width: 80, align: 'right' });
  }

  private async drawMap(
    doc: PDFKit.PDFDocument,
    calculation: Calculation,
    station1: Station | null,
    station2: Station | null,
    startY: number,
  ): Promise<number> {
    const ctx: CanvasCtx = { doc, calculation, station1, station2, startY };
    const points: MapPoint[] = [
      { lat: calculation.latitude, lon: calculation.longitude, label: 'Punto', color: '#e74c3c', number: null },
    ];
    if (station1) {
      points.push({ lat: station1.latitude, lon: station1.longitude, label: station1.code || station1.name || calculation.station1Code || calculation.station1Name || 'Est. 1', color: '#1a5276', number: 1 });
    }
    if (station2) {
      points.push({ lat: station2.latitude, lon: station2.longitude, label: station2.code || station2.name || calculation.station2Code || calculation.station2Name || 'Est. 2', color: '#27ae60', number: 2 });
    }

    try {
      return await this.tryDrawTiledMap(ctx, points);
    } catch (e) {
      this.logger.error(`Tile map failed: ${(e as Error).message}`);
      return this.drawSchematicFallback(ctx, points);
    }
  }

  private async tryDrawTiledMap(ctx: CanvasCtx, points: MapPoint[]): Promise<number> {
    const { doc, startY } = ctx;

    const mapDims = { width: 500, height: 300 };
    const padding = 0.25;
    const tilePx = 256;
    const mapX = 50;
    const mapY = startY + 22;

    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    for (const pt of points) {
      if (pt.lat < minLat) minLat = pt.lat;
      if (pt.lat > maxLat) maxLat = pt.lat;
      if (pt.lon < minLon) minLon = pt.lon;
      if (pt.lon > maxLon) maxLon = pt.lon;
    }

    const lonRange = (maxLon - minLon) || 0.01;
    const latRange = (maxLat - minLat) || 0.01;
    const degreePerPxX = lonRange * (1 + padding) / mapDims.width;
    const degreePerPxY = latRange * (1 + padding) / mapDims.height;
    const zoomX = Math.floor(Math.log2(360 / (degreePerPxX * 256)));
    const zoomY = Math.floor(Math.log2(360 / (degreePerPxY * 256)));
    let zoom = Math.min(zoomX, zoomY);
    if (zoom < 1) zoom = 1;
    if (zoom > 18) zoom = 18;

    const centerLon = (minLon + maxLon) / 2;
    const centerLat = (minLat + maxLat) / 2;
    const n = Math.pow(2, zoom);

    const worldCenterX = (centerLon + 180) / 360 * n;
    const sinLat = Math.sin(centerLat * Math.PI / 180);
    const worldCenterY = (1 - Math.log((1 + sinLat) / (1 - sinLat)) / (2 * Math.PI)) / 2 * n;

    const originWorldX = worldCenterX - mapDims.width / (2 * tilePx);
    const originWorldY = worldCenterY - mapDims.height / (2 * tilePx);

    const startTileX = Math.floor(originWorldX);
    const startTileY = Math.floor(originWorldY);
    const tileOffX = (originWorldX - startTileX) * tilePx;
    const tileOffY = (originWorldY - startTileY) * tilePx;

    const tilesWide = Math.ceil((mapDims.width + tileOffX) / tilePx) + 1;
    const tilesHigh = Math.ceil((mapDims.height + tileOffY) / tilePx) + 1;

    doc.save();
    doc.rect(mapX, mapY, mapDims.width, mapDims.height).clip();

    let drawnTiles = 0;
    for (let dx = 0; dx < tilesWide; dx++) {
      for (let dy = 0; dy < tilesHigh; dy++) {
        const tx = startTileX + dx;
        const ty = startTileY + dy;
        const buf = await this.fetchTile(zoom, tx, ty);
        const px = mapX - tileOffX + dx * tilePx;
        const py = mapY - tileOffY + dy * tilePx;
        if (py + tilePx < mapY || py > mapY + mapDims.height) continue;
        doc.image(buf, px, py, { width: tilePx, height: tilePx });
        drawnTiles++;
      }
    }

    doc.restore();

    doc.rect(mapX, mapY, mapDims.width, mapDims.height).stroke('#333');

    for (const pt of points) {
      const worldX = (pt.lon + 180) / 360 * n;
      const sinLatPt = Math.sin(pt.lat * Math.PI / 180);
      const worldY = (1 - Math.log((1 + sinLatPt) / (1 - sinLatPt)) / (2 * Math.PI)) / 2 * n;
      const pDocX = mapX + (worldX - originWorldX) * tilePx;
      const pDocY = mapY + (worldY - originWorldY) * tilePx;

      if (pDocX < mapX || pDocX > mapX + mapDims.width || pDocY < mapY || pDocY > mapY + mapDims.height) continue;

      doc.circle(pDocX, pDocY, 6).fill(pt.color);
      doc.circle(pDocX, pDocY, 6).stroke('#ffffff');

      if (pt.number !== null) {
        doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold')
          .text(String(pt.number), pDocX - 2.5, pDocY - 3, { width: 5, align: 'center' });
      }
    }

    if (points.length >= 2) {
      const w1x = (points[1].lon + 180) / 360 * n;
      const s1 = Math.sin(points[1].lat * Math.PI / 180);
      const w1y = (1 - Math.log((1 + s1) / (1 - s1)) / (2 * Math.PI)) / 2 * n;
      const fDocX = mapX + (w1x - originWorldX) * tilePx;
      const fDocY = mapY + (w1y - originWorldY) * tilePx;
      const tDocX = mapX + (worldCenterX - originWorldX) * tilePx;
      const tDocY = mapY + (worldCenterY - originWorldY) * tilePx;
      doc.save();
      doc.moveTo(fDocX, fDocY).lineTo(tDocX, tDocY).dash(2, { space: 2 }).stroke('#1a5276');
      doc.restore();
    }
    if (points.length >= 3) {
      const w2x = (points[2].lon + 180) / 360 * n;
      const s2 = Math.sin(points[2].lat * Math.PI / 180);
      const w2y = (1 - Math.log((1 + s2) / (1 - s2)) / (2 * Math.PI)) / 2 * n;
      const fDocX = mapX + (w2x - originWorldX) * tilePx;
      const fDocY = mapY + (w2y - originWorldY) * tilePx;
      const tDocX = mapX + (worldCenterX - originWorldX) * tilePx;
      const tDocY = mapY + (worldCenterY - originWorldY) * tilePx;
      doc.save();
      doc.moveTo(fDocX, fDocY).lineTo(tDocX, tDocY).dash(2, { space: 2 }).stroke('#27ae60');
      doc.restore();
    }

    doc.fontSize(8).font('Helvetica').fillColor('#666')
      .text(`© OpenStreetMap contributors`, mapX, mapY + mapDims.height + 4, { width: mapDims.width, align: 'center' });

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a5276')
      .text('Esquema de determinación', 50, startY);

    return mapY + mapDims.height + 20;
  }

  private drawSchematicFallback(ctx: CanvasCtx, points: MapPoint[]): number {
    const { doc, calculation, startY } = ctx;
    const primaryColor = '#1a5276';

    doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
      .text('Esquema de determinación', 50, startY);
    let y = startY + 30;

    const fx = 70;
    const fy = y;
    const fw = 460;
    const fh = 210;

    doc.rect(fx, fy, fw, fh).stroke('#cccccc');

    const cx = fx + fw / 2;
    const cy = fy + fh / 2;

    const s1x = cx - 150;
    const s1y = cy - 60;
    const s2x = cx + 150;
    const s2y = cy + 60;

    doc.save();
    doc.moveTo(s1x, s1y).lineTo(cx, cy).dash(3, { space: 3 }).stroke('#1a5276');
    doc.restore();

    const station2 = ctx.station2;
    if (station2) {
      doc.save();
      doc.moveTo(s2x, s2y).lineTo(cx, cy).dash(3, { space: 3 }).stroke('#27ae60');
      doc.restore();
    }

    doc.circle(cx, cy, 7).fill('#e74c3c');

    doc.circle(s1x, s1y, 6).fill('#1a5276');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
      .text('1', s1x - 3, s1y - 4, { width: 6, align: 'center' });

    if (station2) {
      doc.circle(s2x, s2y, 6).fill('#27ae60');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
        .text('2', s2x - 3, s2y - 4, { width: 6, align: 'center' });
    }

    doc.fillColor('#333').fontSize(8).font('Helvetica-Bold')
      .text('Punto seleccionado', cx + 15, cy - 10);
    doc.fontSize(7).font('Helvetica')
      .text(`${calculation.latitude.toFixed(5)}°`, cx + 15, cy + 2);
    if (calculation.longitude < 0) {
      doc.text(`${Math.abs(calculation.longitude).toFixed(5)}°W`, cx + 15, cy + 11);
    } else {
      doc.text(`${calculation.longitude.toFixed(5)}°E`, cx + 15, cy + 11);
    }

    const s1 = ctx.station1;
    doc.fillColor('#1a5276').fontSize(8).font('Helvetica-Bold')
      .text(s1?.code || calculation.station1Code || calculation.station1Name || s1?.name || 'Estación 1', s1x - 50, s1y - 35, { width: 100 });
    doc.fillColor('#1a5276').fontSize(7).font('Helvetica')
      .text(`${calculation.distance1.toFixed(2)} km`, s1x - 50, s1y - 25, { width: 100 });

    if (station2) {
      doc.fillColor('#27ae60').fontSize(8).font('Helvetica-Bold')
        .text(station2?.code || calculation.station2Code || calculation.station2Name || station2?.name || 'Estación 2', s2x + 12, s2y - 8, { width: 100 });
      doc.fillColor('#27ae60').fontSize(7).font('Helvetica')
        .text(`${calculation.distance2?.toFixed(2) || ''} km`, s2x + 12, s2y + 2, { width: 100 });
    }

    y += fh + 25;

    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text('Leyenda:', fx, y);
    y += 18;

    doc.circle(fx + 5, y + 3, 4).fill('#e74c3c');
    doc.fillColor('#333').fontSize(8).font('Helvetica')
      .text('Punto seleccionado', fx + 15, y);
    y += 16;

    doc.circle(fx + 5, y + 3, 3.5).fill('#1a5276');
    doc.fillColor('#333').fontSize(8).font('Helvetica')
      .text(`1: ${s1?.code || calculation.station1Code || calculation.station1Name || s1?.name || 'Estación 1'}`, fx + 15, y);
    y += 16;

    if (station2) {
      doc.circle(fx + 5, y + 3, 3.5).fill('#27ae60');
      doc.fillColor('#333').fontSize(8).font('Helvetica')
        .text(`2: ${station2?.code || calculation.station2Code || calculation.station2Name || station2?.name || 'Estación 2'}`, fx + 15, y);
    }

    return y + 30;
  }

  private fetchTile(zoom: number, x: number, y: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const url = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
      https.get(url, { headers: { 'User-Agent': 'ColGNSS/1.0' } }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Tile fetch failed: ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', reject);
    });
  }

  private latLonToTile(lat: number, lon: number, zoom: number): { x: number; y: number } {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lon + 180) / 360 * n);
    const y2 = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return { x, y: y2 };
  }

  private latLonToPixel(
    lat: number, lon: number, zoom: number,
    originTile: { x: number; y: number }, tileSize: number,
  ): { x: number; y: number } {
    const n = Math.pow(2, zoom);
    const worldX = (lon + 180) / 360 * n;
    const sinLat = Math.sin(lat * Math.PI / 180);
    const worldY = (1 - Math.log((1 + sinLat) / (1 - sinLat)) / (2 * Math.PI)) / 2 * n;
    return {
      x: (worldX - originTile.x) * tileSize,
      y: (worldY - originTile.y) * tileSize,
    };
  }
}

interface MapPoint {
  lat: number;
  lon: number;
  label: string;
  color: string;
  number: number | null;
}

interface CanvasCtx {
  doc: PDFKit.PDFDocument;
  calculation: Calculation;
  station1: Station | null;
  station2: Station | null;
  startY: number;
}
