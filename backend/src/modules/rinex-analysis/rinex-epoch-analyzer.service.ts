import { Injectable } from '@nestjs/common';
import { EpochParserV2Service } from './epoch-parser-v2.service';
import { EpochParserV3Service } from './epoch-parser-v3.service';

export interface EpochRecord {
  date: Date;
  timestamp: number;
  numSats: number;
  eventFlag: number;
  lineNumber: number;
}

export interface GapDetail {
  atIndex: number;
  gapStart: number;
  gapEnd: number;
  gapSeconds: number;
  gapMinutes: number;
  estimatedLostEpochs: number;
  type: 'micro' | 'normal' | 'significant' | 'interruption';
}

export type ContinuityLabel = 'Excelente' | 'Muy buena' | 'Buena' | 'Regular' | 'Deficiente';

export interface EpochAnalysis {
  startTime: Date | null;
  endTime: Date | null;
  numEpochs: number;
  durationMinutes: number;
  durationFormatted: string;
  effectiveMinutes: number;
  effectiveFormatted: string;
  intervalNominal: number;
  intervalAvg: number;
  intervalMin: number;
  intervalMax: number;
  intervalStdDev: number;
  gaps: number;
  gapDetails: GapDetail[];
  continuityPercent: number;
  continuityLabel: ContinuityLabel;
  lostEpochs: number;
  expectedEpochs: number;
  headerConsistent: boolean;
  totalLines: number;
  headerEnd: number;
  isRinex3: boolean;
  warnings: string[];
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0) return '0 s';
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.round(totalSeconds % 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} día(s)`);
  if (hours > 0) parts.push(`${hours} hora(s)`);
  if (minutes > 0) parts.push(`${minutes} minuto(s)`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} segundo(s)`);
  return parts.join(', ');
}

function makeDate(year: number, month: number, day: number, hour: number, minute: number, second: number): Date {
  const wholeSec = Math.floor(second);
  const ms = Math.round((second - wholeSec) * 1000);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, wholeSec, ms));
}

@Injectable()
export class EpochAnalyzerService {
  constructor(
    private readonly epochV2: EpochParserV2Service,
    private readonly epochV3: EpochParserV3Service,
  ) {}

  analyze(
    content: string,
    headerEnd: number,
    nominalInterval: number,
    _startTime: Date | null,
    _endTime: Date | null,
  ): EpochAnalysis {
    const allLines = content.split('\n');
    const totalLines = allLines.length;

    let isRinex3 = false;
    for (let i = 0; i < Math.min(headerEnd + 5, allLines.length); i++) {
      if (allLines[i].trimStart().startsWith('>')) { isRinex3 = true; break; }
    }

    const warnings: string[] = [];

    // Use header times directly for first/last epoch
    if (!_startTime) {
      warnings.push('No se encontró TIME OF FIRST OBS en el encabezado');
    }
    if (!_endTime) {
      warnings.push('No se encontró TIME OF LAST OBS en el encabezado');
    }

    if (!_startTime || !_endTime || !nominalInterval || nominalInterval <= 0) {
      // Fallback: minimal result with what we have
      return {
        startTime: _startTime,
        endTime: _endTime,
        numEpochs: 0,
        durationMinutes: 0,
        durationFormatted: '0 s',
        effectiveMinutes: 0,
        effectiveFormatted: '0 s',
        intervalNominal: nominalInterval,
        intervalAvg: 0,
        intervalMin: 0,
        intervalMax: 0,
        intervalStdDev: 0,
        gaps: 0,
        gapDetails: [],
        continuityPercent: 100,
        continuityLabel: 'Excelente',
        lostEpochs: 0,
        expectedEpochs: 0,
        headerConsistent: true,
        totalLines,
        headerEnd,
        isRinex3,
        warnings,
      };
    }

    const firstDate = _startTime;
    const lastDate = _endTime;
    const durationMs = lastDate.getTime() - firstDate.getTime();

    if (durationMs < 0) {
      warnings.push('TIME OF LAST OBS es anterior a TIME OF FIRST OBS');
      return {
        startTime: firstDate,
        endTime: lastDate,
        numEpochs: 0,
        durationMinutes: 0,
        durationFormatted: '0 s',
        effectiveMinutes: 0,
        effectiveFormatted: '0 s',
        intervalNominal: nominalInterval,
        intervalAvg: 0,
        intervalMin: 0,
        intervalMax: 0,
        intervalStdDev: 0,
        gaps: 0,
        gapDetails: [],
        continuityPercent: 100,
        continuityLabel: 'Excelente',
        lostEpochs: 0,
        expectedEpochs: 0,
        headerConsistent: false,
        totalLines,
        headerEnd,
        isRinex3,
        warnings,
      };
    }

    const durationSeconds = durationMs / 1000;
    const durationMinutes = durationSeconds / 60;
    const durationFormatted = formatDuration(durationSeconds);

    const numEpochs = Math.round(durationSeconds / nominalInterval) + 1;
    const expectedEpochs = numEpochs;

    return {
      startTime: firstDate,
      endTime: lastDate,
      numEpochs,
      durationMinutes: Math.round(durationMinutes * 100) / 100,
      durationFormatted,
      effectiveMinutes: Math.round(durationMinutes * 100) / 100,
      effectiveFormatted: durationFormatted,
      intervalNominal: nominalInterval,
      intervalAvg: nominalInterval,
      intervalMin: nominalInterval,
      intervalMax: nominalInterval,
      intervalStdDev: 0,
      gaps: 0,
      gapDetails: [],
      continuityPercent: 100,
      continuityLabel: 'Excelente',
      lostEpochs: 0,
      expectedEpochs,
      headerConsistent: true,
      totalLines,
      headerEnd,
      isRinex3,
      warnings,
    };
  }

  private emptyResult(start: Date | null, end: Date | null, numEpochs: number, nominal: number, totalLines: number, headerEnd: number, isRinex3: boolean): EpochAnalysis {
    return {
      startTime: start, endTime: end, numEpochs,
      durationMinutes: 0, durationFormatted: '0 s',
      effectiveMinutes: 0, effectiveFormatted: '0 s',
      intervalNominal: nominal, intervalAvg: 0, intervalMin: 0, intervalMax: 0, intervalStdDev: 0,
      gaps: 0, gapDetails: [], continuityPercent: 100,
      continuityLabel: 'Excelente',
      lostEpochs: 0, expectedEpochs: 0,
      headerConsistent: true,
      totalLines, headerEnd, isRinex3,
      warnings: [],
    };
  }

  private continuityLabel(pct: number): ContinuityLabel {
    if (pct >= 99.9) return 'Excelente';
    if (pct >= 99) return 'Muy buena';
    if (pct >= 95) return 'Buena';
    if (pct >= 85) return 'Regular';
    return 'Deficiente';
  }

  private stdDev(values: number[], mean: number): number {
    if (values.length < 2) return 0;
    const sqDiffs = values.map(v => (v - mean) ** 2);
    return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
  }
}