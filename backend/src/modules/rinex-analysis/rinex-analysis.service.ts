import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { RinexAnalysis } from './rinex-analysis.entity';
import { TemporaryFileManagerService } from './temporary-file-manager.service';
import { RinexFileDetectorService, CompressionFormat } from './rinex-file-detector.service';
import { RinexDecompressorService } from './rinex-decompressor.service';
import { RinexNormalizerService } from './rinex-normalizer.service';
import { RinexHeaderParserService } from './rinex-header-parser.service';
import { RinexObservationParserService } from './rinex-observation-parser.service';
import { EpochAnalyzerService } from './rinex-epoch-analyzer.service';
import { SatelliteAnalyzerService } from './rinex-satellite-analyzer.service';
import { QualityAnalyzerService } from './rinex-quality-analyzer.service';
import { CoordinateTransformerService } from './rinex-coordinate-transformer.service';
import { StationLocatorService } from './rinex-station-locator.service';
import { TrackingTimeValidatorService } from './rinex-tracking-time-validator.service';
import { PdfReportGeneratorService } from './rinex-pdf-report-generator.service';
import { SseService } from './rinex-sse.service';
import { ReceiverCatalogService } from './rinex-receiver-catalog.service';
import { AntennaCatalogService } from './rinex-antenna-catalog.service';
import { FileValidatorService } from './rinex-file-validator.service';
import { ObservationAnalyzerService } from './rinex-observation-analyzer.service';
import { AnalyzeDto, NetworkType } from './dto/analyze.dto';

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 s';
  const totalSec = Math.round(minutes * 60);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} día(s)`);
  if (h > 0) parts.push(`${h} hora(s)`);
  if (m > 0) parts.push(`${m} minuto(s)`);
  if (s > 0 || parts.length === 0) parts.push(`${s} segundo(s)`);
  return parts.join(', ');
}

@Injectable()
export class RinexAnalysisService {
  constructor(
    @InjectRepository(RinexAnalysis)
    private readonly analysisRepo: Repository<RinexAnalysis>,
    private readonly tempFileManager: TemporaryFileManagerService,
    private readonly fileDetector: RinexFileDetectorService,
    private readonly decompressor: RinexDecompressorService,
    private readonly normalizer: RinexNormalizerService,
    private readonly headerParser: RinexHeaderParserService,
    private readonly observationParser: RinexObservationParserService,
    private readonly epochAnalyzer: EpochAnalyzerService,
    private readonly satelliteAnalyzer: SatelliteAnalyzerService,
    private readonly qualityAnalyzer: QualityAnalyzerService,
    private readonly coordTransformer: CoordinateTransformerService,
    private readonly stationLocator: StationLocatorService,
    private readonly trackingValidator: TrackingTimeValidatorService,
    private readonly pdfReport: PdfReportGeneratorService,
    private readonly sse: SseService,
    private readonly receiverCatalog: ReceiverCatalogService,
    private readonly antennaCatalog: AntennaCatalogService,
    private readonly fileValidator: FileValidatorService,
    private readonly obsAnalyzer: ObservationAnalyzerService,
  ) {}

  async uploadFile(userId: string, file: Express.Multer.File): Promise<any> {
    const sessionId = this.generateSessionId(userId);

    const detection = this.fileDetector.detect(file.buffer, file.originalname);

    if (detection.compression === CompressionFormat.ZIP) {
      this.tempFileManager.saveFile(sessionId, file);
      const contents = this.decompressor.listZipContents(file.buffer);
      return {
        sessionId,
        detection,
        zipContents: contents,
        needsFileSelection: true,
      };
    }

    // Normalize any format (OBS, GZIP, CRINEX) to standard OBS
    const normalized = this.normalizer.normalize(file.buffer, file.originalname);
    this.tempFileManager.saveBuffer(sessionId, normalized.buffer, normalized.filename);

    const textContent = normalized.buffer.toString('utf-8');
    const headerLines = this.extractHeaderLines(textContent);

    return {
      sessionId,
      detection,
      headerPreview: {
        version: detection.version,
        fileType: detection.categoryLabel,
        satelliteSystem: detection.satelliteLabel,
        constellations: detection.constellations,
        lines: headerLines,
        totalLines: textContent.split('\n').length,
        fileSize: file.size,
      },
    };
  }

  async selectZipFile(sessionId: string, fileName: string): Promise<any> {
    const file = this.tempFileManager.readFile(sessionId);
    if (!file) throw new BadRequestException('Sesión temporal no encontrada');

    const extracted = this.decompressor.extractZipFile(file, fileName);
    // Normalize extracted content (may be CRINEX inside ZIP)
    const normalized = this.normalizer.normalize(extracted.content, extracted.fileName);
    this.tempFileManager.saveBuffer(sessionId, normalized.buffer, normalized.filename);

    const textContent = normalized.buffer.toString('utf-8');
    const detection = this.fileDetector.detect(normalized.buffer, normalized.filename);

    return { sessionId, detection, headerPreview: { lines: this.extractHeaderLines(textContent), totalLines: textContent.split('\n').length } };
  }

  async analyze(
    userId: string,
    sessionId: string,
    dto: AnalyzeDto,
  ): Promise<{ analysis: RinexAnalysis; summary: any }> {
    const startTime = Date.now();

    this.sse.createSession(sessionId);
    this.sse.sendProgress(sessionId, { step: 'init', percent: 0, message: 'Iniciando análisis...' });

    if (!this.tempFileManager.sessionExists(sessionId)) {
      throw new NotFoundException('Sesión temporal no encontrada o expirada');
    }

    let contentBuffer = this.tempFileManager.readFile(sessionId);
    if (!contentBuffer) {
      throw new BadRequestException('No se pudo leer el archivo temporal');
    }

    // Ensure buffer is normalized OBS before analysis
    const origName = this.tempFileManager.getFilePath(sessionId)?.split(/[/\\]/).pop() || 'input.obs';
    const normalized = this.normalizer.normalize(contentBuffer, origName);
    if (normalized.isTemporary) {
      this.tempFileManager.saveBuffer(sessionId, normalized.buffer, normalized.filename);
      contentBuffer = normalized.buffer;
    }
    const content = contentBuffer.toString('utf-8');

    this.sse.sendProgress(sessionId, { step: 'parse_header', percent: 10, message: 'Interpretando encabezado...' });

    const header = this.headerParser.parse(content);

    if (this.sse.isCancelled(sessionId)) {
      this.tempFileManager.deleteSession(sessionId);
      throw new BadRequestException('Análisis cancelado');
    }

    const lines = content.split('\n');
    const headerEnd = lines.findIndex(l => l.includes('END OF HEADER'));

    this.sse.sendProgress(sessionId, { step: 'parse_epochs', percent: 25, message: 'Analizando épocas...' });

    const epochResult = this.epochAnalyzer.analyze(
      content, headerEnd, header.interval,
      header.startTime, header.endTime,
    );

    if (this.sse.isCancelled(sessionId)) {
      this.tempFileManager.deleteSession(sessionId);
      throw new BadRequestException('Análisis cancelado');
    }

    this.sse.sendProgress(sessionId, { step: 'satellites', percent: 40, message: 'Analizando satélites...' });

    const satResult = this.satelliteAnalyzer.analyze(content, headerEnd);

    if (this.sse.isCancelled(sessionId)) {
      this.tempFileManager.deleteSession(sessionId);
      throw new BadRequestException('Análisis cancelado');
    }

    this.sse.sendProgress(sessionId, { step: 'observables', percent: 50, message: 'Interpretando observables...' });

    const obsTables = this.observationParser.parseObservableTables(header.obsTypes, header.version);
    const frequency = this.observationParser.determineFrequency(header.obsTypes);

    if (this.sse.isCancelled(sessionId)) {
      this.tempFileManager.deleteSession(sessionId);
      throw new BadRequestException('Análisis cancelado');
    }

    this.sse.sendProgress(sessionId, { step: 'coordinate_transform', percent: 60, message: 'Transformando coordenadas...' });

    let lat = 0, lon = 0, h = 0;
    if (header.approxX && header.approxY && header.approxZ) {
      const geo = this.coordTransformer.xyzToGeographic(
        header.approxX, header.approxY, header.approxZ,
      );
      lat = geo.lat;
      lon = geo.lon;
      h = geo.height;
    }

    if (this.sse.isCancelled(sessionId)) {
      this.tempFileManager.deleteSession(sessionId);
      throw new BadRequestException('Análisis cancelado');
    }

    this.sse.sendProgress(sessionId, { step: 'stations', percent: 70, message: 'Localizando estaciones cercanas...' });

    const stationResult = await this.stationLocator.locate(
      lat || 0, lon || 0, dto.networkType,
    );

    if (this.sse.isCancelled(sessionId)) {
      this.tempFileManager.deleteSession(sessionId);
      throw new BadRequestException('Análisis cancelado');
    }

    this.sse.sendProgress(sessionId, { step: 'tracking_time', percent: 80, message: 'Validando tiempo de rastreo...' });

    const isDualFreq = dto.isDualFrequency !== false;
    const trackingResult = this.trackingValidator.validate(
      epochResult.effectiveMinutes,
      stationResult.usedDistanceKm,
      isDualFreq,
      dto.networkType,
      stationResult.station1?.name,
      stationResult.station2?.name,
    );

    if (this.sse.isCancelled(sessionId)) {
      this.tempFileManager.deleteSession(sessionId);
      throw new BadRequestException('Análisis cancelado');
    }

    this.sse.sendProgress(sessionId, { step: 'quality', percent: 85, message: 'Calculando índice de calidad...' });

    const qualityResult = this.qualityAnalyzer.calculate({
      headerComplete: !!(header.version && header.startTime),
      complies: trackingResult.complies,
      observedMinutes: trackingResult.observedMinutes,
      requiredMinutes: trackingResult.requiredTime,
      intervalConsistent: epochResult.gaps === 0,
      intervalStdDev: epochResult.intervalStdDev,
      numSatellitesAvg: satResult.averageSimultaneous,
      constellations: header.constellations.length,
      epochContinuity: epochResult.gaps === 0,
      continuityPercent: epochResult.continuityPercent,
      hasReceiverInfo: !!header.receiverBrand,
      hasAntennaInfo: !!header.antennaModel,
      coordsConsistent: !!(header.approxX && header.approxY && header.approxZ),
      numObservables: Object.values(header.obsTypes).flat().length,
    });

    if (this.sse.isCancelled(sessionId)) {
      this.tempFileManager.deleteSession(sessionId);
      throw new BadRequestException('Análisis cancelado');
    }

    this.sse.sendProgress(sessionId, { step: 'validation', percent: 90, message: 'Validando archivo...' });

    const validationResult = this.fileValidator.validate({
      hasVersion: !!header.version,
      hasMarkerName: !!header.markerName,
      hasObsTypes: Object.keys(header.obsTypes).length > 0,
      hasStartTime: !!header.startTime,
      hasEndTime: !!header.endTime,
      hasReceiver: !!header.receiverModel,
      hasAntenna: !!header.antennaModel,
      hasCoords: !!(header.approxX && header.approxY && header.approxZ),
      numEpochs: epochResult.numEpochs,
      numObservations: satResult.totalObservations,
      gaps: epochResult.gaps,
      continuityPercent: epochResult.continuityPercent,
      intervalNominal: header.interval,
      constellations: header.constellations,
    });

    if (this.sse.isCancelled(sessionId)) {
      this.tempFileManager.deleteSession(sessionId);
      throw new BadRequestException('Análisis cancelado');
    }

    this.sse.sendProgress(sessionId, { step: 'observation_analysis', percent: 93, message: 'Analizando observaciones...' });

    const obsAnalysisResult = this.obsAnalyzer.analyze(
      header.obsTypes,
      epochResult.numEpochs,
    );

    if (this.sse.isCancelled(sessionId)) {
      this.tempFileManager.deleteSession(sessionId);
      throw new BadRequestException('Análisis cancelado');
    }

    this.sse.sendProgress(sessionId, { step: 'save', percent: 95, message: 'Guardando resultados...' });

    // Receiver/antenna catalog lookup (use exact catalog model when found)
    const recInfo = this.receiverCatalog.identify(header.receiverModel);
    const antInfo = this.antennaCatalog.identify(header.antennaModel, header.antennaType);
    const exactReceiverModel = recInfo.info ? recInfo.info.model : header.receiverModel;
    const exactAntennaModel = antInfo.info ? antInfo.info.model : header.antennaModel;
    const exactReceiverBrand = recInfo.info ? recInfo.info.brand : recInfo.brand;
    const exactAntennaBrand = antInfo.info ? antInfo.info.brand : header.antennaModel;
    const receiverCatalogStr = recInfo.info
      ? `Marca: ${recInfo.info.brand}, Modelo: ${recInfo.info.model}, Familia: ${recInfo.info.family}, Tipo: ${recInfo.info.type}, Año: ${recInfo.info.year}, Consteleaciones: ${recInfo.info.maxConstellations}`
      : null;
    const antennaCatalogStr = antInfo.info
      ? `Marca: ${antInfo.info.brand}, Modelo: ${antInfo.info.model}, Radomo: ${antInfo.info.radome}, Tipo: ${antInfo.info.type}, Aplicación: ${antInfo.info.application}`
      : null;

    const analysisData: DeepPartial<RinexAnalysis> = {
      userId,
      rinexVersion: header.version,
      fileType: header.fileType,
      satelliteSystem: header.satelliteSystem,
      markerName: header.markerName,
      markerNumber: header.markerNumber,
      markerType: header.markerType,
      observer: header.observer,
      receiverBrand: exactReceiverBrand,
      receiverModel: exactReceiverModel,
      receiverSerial: header.receiverSerial,
      receiverFirmware: header.receiverFirmware,
      antennaModel: exactAntennaBrand,
      antennaType: exactAntennaModel,
      antennaSerial: header.antennaSerial,
      antennaHeight: header.antennaHeight,
      antennaDeltaN: header.antennaDeltaN,
      antennaDeltaE: header.antennaDeltaE,
      antennaDeltaH: header.antennaDeltaH,
      approxX: header.approxX,
      approxY: header.approxY,
      approxZ: header.approxZ,
      latitude: lat,
      longitude: lon,
      height: h,
      coordSystem: 'MAGNA-SIRGAS (GRS80)',
      startTime: epochResult.startTime || undefined,
      endTime: epochResult.endTime || undefined,
      observedDuration: epochResult.durationMinutes,
      effectiveDuration: epochResult.effectiveMinutes,
      intervalNominal: epochResult.intervalNominal,
      intervalAvg: epochResult.intervalAvg,
      intervalMin: epochResult.intervalMin,
      intervalMax: epochResult.intervalMax,
      intervalStdDev: epochResult.intervalStdDev,
      numEpochs: epochResult.numEpochs,
      continuityPercent: epochResult.continuityPercent,
      gaps: epochResult.gaps,
      lostEpochs: epochResult.lostEpochs,
      constellations: header.constellations,
      numSatellitesAvg: satResult.averageSimultaneous,
      maxSatellites: satResult.maximumSimultaneous,
      minSatellites: satResult.minimumSimultaneous,
      standardDevSatellites: satResult.standardDeviation,
      uniqueSatellites: satResult.uniqueSatellites,
      observables: header.obsTypes,
      totalObservations: satResult.totalObservations,
      satelliteDetails: JSON.stringify({
        satellites: satResult.satellites,
        observationsByConstellation: satResult.observationsByConstellation,
        satellitesByConstellation: satResult.satellitesByConstellation,
      }),
      station1Id: stationResult.station1?.id || undefined,
      station1Name: stationResult.station1?.name || undefined,
      station1Code: stationResult.station1?.code || undefined,
      station2Id: stationResult.station2?.id || undefined,
      station2Name: stationResult.station2?.name || undefined,
      station2Code: stationResult.station2?.code || undefined,
      distance1: stationResult.station1?.distanceKm || 0,
      distance2: stationResult.station2?.distanceKm || 0,
      usedDistance: stationResult.usedDistanceKm,
      usedStationId: stationResult.usedStation?.id || undefined,
      usedStationName: stationResult.usedStation?.name || undefined,
      requiredTime: trackingResult.requiredTime,
      complies: trackingResult.complies,
      qualityIndex: qualityResult.score,
      qualityLabel: qualityResult.label,
      qualityBreakdown: JSON.stringify(qualityResult.breakdown),
      technicalConcept: trackingResult.technicalConcept,
      recommendations: trackingResult.recommendations,
      networkType: dto.networkType,
      isDualFrequency: isDualFreq,
      method: trackingResult.method,
      processingTimeMs: Date.now() - startTime,
      epochsAnalyzed: epochResult.numEpochs,
      receiverCatalogInfo: receiverCatalogStr ?? undefined,
      antennaCatalogInfo: antennaCatalogStr ?? undefined,
      frequencyDetected: frequency,
      signalUnit: header.signalUnit,
      leapSeconds: header.leapSeconds,
      glonassSlot: Object.keys(header.glonassSlot).length > 0 ? JSON.stringify(header.glonassSlot) : undefined,
      comments: header.comments.length > 0 ? header.comments.join('\n') : undefined,
      continuityLabel: epochResult.continuityLabel,
      validationScore: validationResult.score,
      headerConsistent: epochResult.headerConsistent,
      validationIssues: JSON.stringify(validationResult.issues),
      expectedEpochs: epochResult.expectedEpochs,
      totalFileLines: epochResult.totalLines,
    };

    const analysis = this.analysisRepo.create(analysisData);
    const saved = await this.analysisRepo.save(analysis);

    this.tempFileManager.deleteSession(sessionId);
    this.sse.completeSession(sessionId);

    return {
      analysis: {
        ...(saved as any),
        durationFormatted: formatDuration(saved.observedDuration),
        effectiveFormatted: formatDuration(saved.effectiveDuration || saved.observedDuration),
      } as any,
      summary: {
        id: saved.id,
        complies: saved.complies,
        qualityIndex: saved.qualityIndex,
        qualityLabel: saved.qualityLabel,
        observedMinutes: Math.round(saved.effectiveDuration || saved.observedDuration),
        requiredTime: saved.requiredTime,
        usedDistance: saved.usedDistance,
        usedStationName: saved.usedStationName,
        networkType: saved.networkType,
        receiverBrand: saved.receiverBrand,
        receiverModel: saved.receiverModel,
        antennaModel: saved.antennaModel,
        constellations: saved.constellations,
        frequency: saved.frequencyDetected,
        rinexVersion: saved.rinexVersion,
        numEpochs: saved.numEpochs,
        continuityPercent: saved.continuityPercent,
        gaps: saved.gaps,
        numSatellitesAvg: saved.numSatellitesAvg,
        maxSatellites: saved.maxSatellites,
        minSatellites: saved.minSatellites,
        uniqueSatellites: saved.uniqueSatellites,
        intervalAvg: saved.intervalAvg,
        continuityLabel: saved.continuityLabel,
        validationScore: saved.validationScore,
      },
    };
  }

  async getAnalysis(id: string, userId: string): Promise<RinexAnalysis> {
    const analysis = await this.analysisRepo.findOne({ where: { id, userId } });
    if (!analysis) throw new NotFoundException('Análisis no encontrado');
    return analysis;
  }

  async getHistory(userId: string, page = 1, limit = 20): Promise<{ data: RinexAnalysis[]; total: number; page: number; limit: number; totalPages: number }> {
    const [data, total] = await this.analysisRepo.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async deleteAnalysis(id: string, userId: string): Promise<void> {
    const result = await this.analysisRepo.delete({ id, userId });
    if (result.affected === 0) throw new NotFoundException('Análisis no encontrado');
  }

  async deleteTempSession(sessionId: string): Promise<void> {
    this.tempFileManager.deleteSession(sessionId);
  }

  async getAnalysisForReport(id: string, userId: string): Promise<RinexAnalysis> {
    return this.getAnalysis(id, userId);
  }

  async generatePdfReport(id: string, userId: string): Promise<Buffer> {
    const analysis = await this.getAnalysisForReport(id, userId);
    return this.pdfReport.generate({
      id: analysis.id,
      complies: analysis.complies,
      qualityIndex: analysis.qualityIndex,
      qualityLabel: analysis.qualityLabel,
      rinexVersion: analysis.rinexVersion,
      fileType: analysis.fileType,
      receiverBrand: analysis.receiverBrand,
      receiverModel: analysis.receiverModel,
      receiverSerial: analysis.receiverSerial,
      receiverFirmware: analysis.receiverFirmware,
      receiverCatalogInfo: analysis.receiverCatalogInfo,
      antennaModel: analysis.antennaModel,
      antennaType: analysis.antennaType,
      antennaSerial: analysis.antennaSerial,
      antennaHeight: analysis.antennaHeight,
      antennaCatalogInfo: analysis.antennaCatalogInfo,
      markerName: analysis.markerName,
      markerNumber: analysis.markerNumber,
      markerType: analysis.markerType,
      latitude: analysis.latitude,
      longitude: analysis.longitude,
      height: analysis.height,
      coordSystem: analysis.coordSystem,
      startTime: analysis.startTime,
      endTime: analysis.endTime,
      observedDuration: analysis.observedDuration,
      intervalNominal: analysis.intervalNominal,
      intervalAvg: analysis.intervalAvg,
      intervalMin: analysis.intervalMin,
      intervalMax: analysis.intervalMax,
      intervalStdDev: analysis.intervalStdDev,
      numEpochs: analysis.numEpochs,
      continuityPercent: analysis.continuityPercent,
      gaps: analysis.gaps,
      constellations: analysis.constellations,
      numSatellitesAvg: analysis.numSatellitesAvg,
      maxSatellites: analysis.maxSatellites,
      station1Name: analysis.station1Name,
      station1Code: analysis.station1Code,
      station2Name: analysis.station2Name,
      station2Code: analysis.station2Code,
      distance1: analysis.distance1,
      distance2: analysis.distance2,
      usedDistance: analysis.usedDistance,
      usedStationName: analysis.usedStationName,
      requiredTime: analysis.requiredTime,
      technicalConcept: analysis.technicalConcept,
      recommendations: analysis.recommendations,
      networkType: analysis.networkType,
      isDualFrequency: analysis.isDualFrequency,
      method: analysis.method,
      createdAt: analysis.createdAt,
    });
  }

  private extractHeaderLines(content: string): number {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('END OF HEADER')) return i + 1;
    }
    return 0;
  }

  private generateSessionId(userId: string): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 6);
    return `rinex_${userId.substring(0, 8)}_${ts}_${rand}`;
  }
}
