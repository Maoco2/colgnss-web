import { Injectable } from '@nestjs/common';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
}

export interface FileValidation {
  valid: boolean;
  issues: ValidationIssue[];
  score: number;
  summary: string;
}

@Injectable()
export class FileValidatorService {
  validate(params: {
    hasVersion: boolean;
    hasMarkerName: boolean;
    hasObsTypes: boolean;
    hasStartTime: boolean;
    hasEndTime: boolean;
    hasReceiver: boolean;
    hasAntenna: boolean;
    hasCoords: boolean;
    numEpochs: number;
    numObservations: number;
    gaps: number;
    continuityPercent: number;
    intervalNominal: number;
    constellations: string[];
  }): FileValidation {
    const issues: ValidationIssue[] = [];
    let score = 100;

    if (!params.hasVersion) {
      issues.push({ severity: 'error', category: 'Header', message: 'No se detectó la versión RINEX' });
      score -= 15;
    }
    if (!params.hasMarkerName) {
      issues.push({ severity: 'warning', category: 'Header', message: 'Falta el nombre del marcador' });
      score -= 5;
    }
    if (!params.hasObsTypes) {
      issues.push({ severity: 'error', category: 'Observaciones', message: 'No se detectaron tipos de observación' });
      score -= 10;
    }
    if (!params.hasStartTime) {
      issues.push({ severity: 'warning', category: 'Tiempo', message: 'Fecha de inicio no disponible' });
      score -= 5;
    }
    if (!params.hasEndTime) {
      issues.push({ severity: 'info', category: 'Tiempo', message: 'Fecha de fin no disponible en el header' });
      score -= 3;
    }
    if (!params.hasReceiver) {
      issues.push({ severity: 'warning', category: 'Equipo', message: 'No se identificó el receptor' });
      score -= 5;
    }
    if (!params.hasAntenna) {
      issues.push({ severity: 'warning', category: 'Equipo', message: 'No se identificó la antena' });
      score -= 5;
    }
    if (!params.hasCoords) {
      issues.push({ severity: 'warning', category: 'Coordenadas', message: 'Coordenadas aproximadas no disponibles' });
      score -= 5;
    }
    if (params.numEpochs === 0) {
      issues.push({ severity: 'error', category: 'Épocas', message: 'No se encontraron épocas en el archivo' });
      score -= 15;
    }
    if (params.gaps > 0) {
      issues.push({ severity: params.gaps > 5 ? 'error' : 'warning', category: 'Continuidad', message: `${params.gaps} interrupción(es) detectada(s)` });
      score -= Math.min(15, params.gaps * 3);
    }
    if (params.continuityPercent < 95) {
      issues.push({ severity: params.continuityPercent < 85 ? 'error' : 'warning', category: 'Continuidad', message: `Continuidad baja: ${params.continuityPercent}%` });
    }
    if (params.intervalNominal <= 0) {
      issues.push({ severity: 'info', category: 'Intervalo', message: 'Intervalo nominal no especificado en el header' });
      score -= 3;
    }
    if (params.constellations.length === 0) {
      issues.push({ severity: 'warning', category: 'Constelaciones', message: 'No se detectaron constelaciones' });
      score -= 5;
    }
    if (params.constellations.length === 1) {
      issues.push({ severity: 'info', category: 'Constelaciones', message: 'Solo se detectó una constelación' });
    }
    if (params.numObservations === 0) {
      issues.push({ severity: 'error', category: 'Observaciones', message: 'No se encontraron observaciones' });
      score -= 15;
    }

    score = Math.max(0, Math.min(100, score));

    let summary: string;
    if (score >= 90) summary = 'Archivo en excelente estado, completo y sin problemas significativos';
    else if (score >= 75) summary = 'Archivo en buen estado con algunas observaciones menores';
    else if (score >= 50) summary = 'Archivo con problemas que requieren revisión';
    else summary = 'Archivo incompleto o con errores críticos';

    return {
      valid: score >= 50,
      issues,
      score,
      summary,
    };
  }
}
