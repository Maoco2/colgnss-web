import { Injectable } from '@nestjs/common';

export interface QualityBreakdown {
  criterion: string;
  weight: number;
  score: number;
  maxScore: number;
}

export interface QualityResult {
  score: number;
  maxScore: number;
  label: string;
  breakdown: QualityBreakdown[];
}

@Injectable()
export class QualityAnalyzerService {
  calculate(params: {
    headerComplete: boolean;
    complies: boolean;
    observedMinutes: number;
    requiredMinutes: number;
    intervalConsistent: boolean;
    intervalStdDev: number;
    numSatellitesAvg: number;
    constellations: number;
    epochContinuity: boolean;
    continuityPercent: number;
    hasReceiverInfo: boolean;
    hasAntennaInfo: boolean;
    coordsConsistent: boolean;
    numObservables: number;
  }): QualityResult {
    const breakdown: QualityBreakdown[] = [];
    let totalScore = 0;
    const maxScore = 100;

    // 1. Header completeness (20 pts)
    const headerScore = params.headerComplete ? 20 : 5;
    breakdown.push({ criterion: 'Integridad del encabezado', weight: 20, score: headerScore, maxScore: 20 });
    totalScore += headerScore;

    // 2. Time compliance (20 pts)
    let timeScore: number;
    if (params.requiredMinutes <= 0) {
      timeScore = 10;
    } else {
      const ratio = params.observedMinutes / params.requiredMinutes;
      if (ratio >= 1.5) timeScore = 20;
      else if (ratio >= 1.0) timeScore = 17;
      else if (ratio >= 0.75) timeScore = 10;
      else timeScore = 0;
    }
    breakdown.push({ criterion: 'Cumplimiento tiempo mínimo', weight: 20, score: timeScore, maxScore: 20 });
    totalScore += timeScore;

    // 3. Interval quality (15 pts)
    let intervalScore: number;
    if (params.intervalConsistent && params.intervalStdDev < 0.5) intervalScore = 15;
    else if (params.intervalConsistent && params.intervalStdDev < 2) intervalScore = 12;
    else if (params.intervalConsistent) intervalScore = 8;
    else intervalScore = 3;
    breakdown.push({ criterion: 'Calidad del intervalo', weight: 15, score: intervalScore, maxScore: 15 });
    totalScore += intervalScore;

    // 4. Constellations (15 pts)
    const constScore = Math.min(15, (params.constellations / 5) * 15);
    breakdown.push({ criterion: 'Constelaciones utilizadas', weight: 15, score: Math.round(constScore), maxScore: 15 });
    totalScore += Math.round(constScore);

    // 5. Continuity (15 pts)
    let contScore: number;
    if (params.continuityPercent >= 99) contScore = 15;
    else if (params.continuityPercent >= 95) contScore = 12;
    else if (params.continuityPercent >= 85) contScore = 8;
    else if (params.continuityPercent >= 70) contScore = 4;
    else contScore = 0;
    breakdown.push({ criterion: 'Continuidad de épocas', weight: 15, score: contScore, maxScore: 15 });
    totalScore += contScore;

    // 6. Receiver info (5 pts)
    const recScore = params.hasReceiverInfo ? 5 : 0;
    breakdown.push({ criterion: 'Información del receptor', weight: 5, score: recScore, maxScore: 5 });
    totalScore += recScore;

    // 7. Antenna info (5 pts)
    const antScore = params.hasAntennaInfo ? 5 : 0;
    breakdown.push({ criterion: 'Información de la antena', weight: 5, score: antScore, maxScore: 5 });
    totalScore += antScore;

    // 8. Observables (5 pts)
    const obsScore = Math.min(5, (params.numObservables / 10) * 5);
    breakdown.push({ criterion: 'Observables detectados', weight: 5, score: Math.round(obsScore), maxScore: 5 });
    totalScore += Math.round(obsScore);

    const finalScore = Math.round(totalScore);

    let label: string;
    if (finalScore >= 90) label = 'Excelente';
    else if (finalScore >= 80) label = 'Muy bueno';
    else if (finalScore >= 70) label = 'Bueno';
    else if (finalScore >= 60) label = 'Aceptable';
    else label = 'Requiere revisión';

    return { score: finalScore, maxScore, label, breakdown };
  }
}
