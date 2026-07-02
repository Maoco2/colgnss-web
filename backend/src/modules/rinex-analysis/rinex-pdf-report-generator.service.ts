import { Injectable } from '@nestjs/common';

const PDFDocument = require('pdfkit');

export interface PdfData {
  id: string;
  complies: boolean;
  qualityIndex: number;
  qualityLabel: string;
  qualityBreakdown?: { criterion: string; weight: number; score: number; maxScore: number }[];
  rinexVersion: string;
  fileType: string;
  receiverBrand: string;
  receiverModel: string;
  receiverSerial: string;
  receiverFirmware: string;
  receiverCatalogInfo?: string;
  antennaModel: string;
  antennaType: string;
  antennaSerial: string;
  antennaHeight: number;
  antennaCatalogInfo?: string;
  markerName: string;
  markerNumber: string;
  markerType: string;
  latitude: number;
  longitude: number;
  height: number;
  coordSystem: string;
  startTime: Date;
  endTime: Date;
  observedDuration: number;
  intervalNominal: number;
  intervalAvg: number;
  intervalMin: number;
  intervalMax: number;
  intervalStdDev: number;
  numEpochs: number;
  continuityPercent: number;
  gaps: number;
  constellations: string[];
  numSatellitesAvg: number;
  maxSatellites: number;
  station1Name: string;
  station1Code: string;
  station2Name: string;
  station2Code: string;
  distance1: number;
  distance2: number;
  usedDistance: number;
  usedStationName: string;
  requiredTime: number;
  technicalConcept: string;
  recommendations: string;
  networkType: string;
  isDualFrequency: boolean;
  method: string;
  createdAt: Date;
}

@Injectable()
export class PdfReportGeneratorService {
  async generate(data: PdfData): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    this.drawHeader(doc, data);
    this.drawExecutiveSummary(doc, data);
    this.drawEquipmentInfo(doc, data);
    this.drawTimeAnalysis(doc, data);
    this.drawStationsInfo(doc, data);
    this.drawTechnicalConcept(doc, data);

    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  private drawHeader(doc: any, data: PdfData) {
    doc.fontSize(20).font('Helvetica-Bold').text('ColGNSS', { continued: false });
    doc.fontSize(10).font('Helvetica').fillColor('#666')
      .text(`Informe de Análisis RINEX - ${(data.id || '').substring(0, 8)}`, { align: 'right' });
    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke('#27ae60');
    doc.moveDown(0.5);
  }

  private drawExecutiveSummary(doc: any, data: PdfData) {
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a5276').text('Resumen Ejecutivo', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(20).font('Helvetica-Bold')
      .fillColor(data.complies ? '#27ae60' : '#e74c3c')
      .text(data.complies ? '✓ CUMPLE' : '✗ NO CUMPLE', { align: 'center' });
    doc.moveDown(0.5);

    const addField = (label: string, value: any) => {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#333').text(`${label}: `, { continued: true });
      doc.font('Helvetica').fillColor('#555').text(`${value || 'N/A'}`);
    };

    doc.fontSize(10).font('Helvetica').fillColor('#333');
    addField('Índice de calidad', `${data.qualityIndex}/100 - ${data.qualityLabel}`);
    addField('Versión RINEX', data.rinexVersion);
    addField('Tiempo observado', `${Math.round(data.observedDuration)} min`);
    addField('Tiempo requerido', `${data.requiredTime} min`);
    addField('Distancia utilizada', `${data.usedDistance?.toFixed(3)} km`);
    addField('Estación utilizada', data.usedStationName);
    addField('Método', data.method);
    addField('Fecha del análisis', data.createdAt ? new Date(data.createdAt).toLocaleDateString('es-CO') : 'N/A');
    doc.moveDown(1);
  }

  private drawEquipmentInfo(doc: any, data: PdfData) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a5276').text('Información del Equipo');
    doc.moveDown(0.5);

    const addField = (label: string, value: any) => {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#333').text(`${label}: `, { continued: true });
      doc.font('Helvetica').fillColor('#555').text(`${value || 'N/A'}`);
    };

    addField('Receptor', `${data.receiverBrand} ${data.receiverModel} (serial: ${data.receiverSerial || 'N/A'})`);
    addField('Firmware', data.receiverFirmware);
    if (data.receiverCatalogInfo) {
      addField('Información del catálogo', data.receiverCatalogInfo);
    }
    addField('Antena', `${data.antennaModel} (tipo: ${data.antennaType || 'N/A'}, serial: ${data.antennaSerial || 'N/A'})`);
    addField('Altura de antena', data.antennaHeight ? `${data.antennaHeight} m` : 'N/A');
    if (data.antennaCatalogInfo) {
      addField('Información del catálogo', data.antennaCatalogInfo);
    }
    doc.moveDown(1);
  }

  private drawTimeAnalysis(doc: any, data: PdfData) {
    if (doc.y > 500) doc.addPage();
    this.drawHeader(doc, data);

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a5276').text('Análisis Temporal');
    doc.moveDown(0.5);

    const addField = (label: string, value: any) => {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#333').text(`${label}: `, { continued: true });
      doc.font('Helvetica').fillColor('#555').text(`${value || 'N/A'}`);
    };

    addField('Inicio', data.startTime ? new Date(data.startTime).toLocaleString('es-CO') : 'N/A');
    addField('Fin', data.endTime ? new Date(data.endTime).toLocaleString('es-CO') : 'N/A');
    addField('Duración observada', `${data.observedDuration?.toFixed(1)} min`);
    addField('Intervalo nominal', `${data.intervalNominal} s`);
    addField('Intervalo promedio', `${data.intervalAvg?.toFixed(2)} s`);
    addField('Intervalo mínimo', `${data.intervalMin?.toFixed(2)} s`);
    addField('Intervalo máximo', `${data.intervalMax?.toFixed(2)} s`);
    addField('Desviación estándar', `${data.intervalStdDev?.toFixed(2)} s`);
    addField('Épocas', data.numEpochs);
    addField('Continuidad', `${data.continuityPercent?.toFixed(1)}%`);
    addField('Interrupciones', data.gaps);
    addField('Satélites promedio', data.numSatellitesAvg);
    addField('Máximo satélites simultáneos', data.maxSatellites);
    addField('Constelaciones', data.constellations?.join(', '));
    doc.moveDown(1);
  }

  private drawStationsInfo(doc: any, data: PdfData) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a5276').text('Estaciones Utilizadas');
    doc.moveDown(0.5);

    const tableTop = doc.y;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#333');
    doc.text('Estación', 50, tableTop, { width: 150 });
    doc.text('Código', 200, tableTop, { width: 60 });
    doc.text('Distancia (km)', 260, tableTop, { width: 80 });
    doc.text('Utilizada', 340, tableTop, { width: 60 });
    doc.moveDown(0.5);

    doc.font('Helvetica').fillColor('#555');
    if (data.station1Name) {
      this.addTableRow(doc, data.station1Name, data.station1Code, data.distance1?.toFixed(3), 'Sí');
    }
    if (data.station2Name) {
      this.addTableRow(doc, data.station2Name, data.station2Code, data.distance2?.toFixed(3), 'No');
    }
    doc.moveDown(1);
  }

  private addTableRow(doc: any, name: string, code: string, dist: string, used: string) {
    const y = doc.y;
    doc.text(name || '', 50, y, { width: 150 });
    doc.text(code || '', 200, y, { width: 60 });
    doc.text(dist || '', 260, y, { width: 80 });
    doc.text(used || '', 340, y, { width: 60 });
    doc.moveDown(0.5);
  }

  private drawTechnicalConcept(doc: any, data: PdfData) {
    if (data.technicalConcept) {
      if (doc.y > 400) doc.addPage();
      this.drawHeader(doc, data);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a5276').text('Concepto Técnico');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#333');
      doc.text(data.technicalConcept, { align: 'justify' });
      doc.moveDown(1);
    }

    if (data.recommendations) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a5276').text('Recomendaciones');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#333');
      const recs = data.recommendations.split('\n');
      recs.forEach((r: string) => {
        if (r.trim()) doc.text(`• ${r.trim()}`, { indent: 10, align: 'justify' });
      });
    }
  }
}
