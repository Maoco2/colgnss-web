import { Injectable } from '@nestjs/common';
import { CalculationsService } from '../calculations/calculations.service';

export interface TrackingTimeResult {
  requiredTime: number;
  complies: boolean;
  observedMinutes: number;
  usedDistanceKm: number;
  technicalConcept: string;
  recommendations: string;
  method: string;
}

@Injectable()
export class TrackingTimeValidatorService {
  constructor(private readonly calculationsService: CalculationsService) {}

  validate(
    observedMinutes: number,
    usedDistanceKm: number,
    isDualFrequency: boolean,
    networkType: string,
    station1Name?: string,
    station2Name?: string,
  ): TrackingTimeResult {
    const requiredTime = this.calculationsService.calculateTrackingTime(
      usedDistanceKm,
      isDualFrequency,
    );

    const observed = Math.round(observedMinutes);
    const complies = observed >= requiredTime;

    const netLabel = networkType === 'active' ? 'Red Activa GNSS'
      : networkType === 'passive' ? 'Red Pasiva GNSS' : 'Red Mixta GNSS';

    const method = `Res. 643/2018 - ${netLabel}${isDualFrequency ? '' : ' - Monofrecuencia'}`;

    const concept = this.generateConcept(
      observed, requiredTime, complies, usedDistanceKm,
      station1Name, station2Name, networkType,
    );

    const recommendations = this.generateRecommendations(
      complies, observed, requiredTime,
    );

    return { requiredTime, complies, observedMinutes: observed, usedDistanceKm, technicalConcept: concept, recommendations, method };
  }

  private generateConcept(
    observedMinutes: number, requiredTime: number, complies: boolean,
    usedDistance: number, station1Name?: string, station2Name?: string,
    networkType?: string,
  ): string {
    const obsStr = this.minutesToHuman(observedMinutes);
    const reqStr = this.minutesToHuman(requiredTime);

    let concept = `El archivo RINEX analizado presenta un tiempo efectivo de observación de ${obsStr}. `;
    concept += `Conforme al criterio técnico implementado por ColGNSS, `;
    concept += `la distancia utilizada fue ${this.formatKm(usedDistance)} km. `;
    concept += `El tiempo mínimo requerido fue de ${reqStr}. `;
    concept += `El tiempo observado fue de ${obsStr}. `;

    if (complies) {
      concept += `\n\nPor lo tanto, el levantamiento CUMPLE con el tiempo mínimo requerido conforme a la metodología implementada para la Resolución 643 de 2018 del IGAC.`;
      const excess = observedMinutes - requiredTime;
      if (excess > 0) {
        concept += ` Se excedió el tiempo mínimo en ${this.minutesToHuman(excess)}.`;
      }
    } else {
      const falta = requiredTime - observedMinutes;
      concept += `\n\nPor lo tanto, el levantamiento NO CUMPLE con el tiempo mínimo requerido. `;
      concept += `Faltaron ${this.minutesToHuman(falta)} de observación para cumplir el requisito.`;
    }

    return concept;
  }

  private generateRecommendations(
    complies: boolean, observedMinutes: number, requiredTime: number,
  ): string {
    const recs: string[] = [];

    if (!complies) {
      recs.push('Incrementar el tiempo de ocupación para cumplir con el tiempo mínimo requerido según la Resolución 643 de 2018 del IGAC.');
      const falta = requiredTime - observedMinutes;
      recs.push(`Se recomienda extender la sesión al menos ${this.minutesToHuman(falta)} adicionales.`);
    }

    if (recs.length === 0) {
      recs.push('No se requieren recomendaciones adicionales. El levantamiento cumple con los requisitos técnicos.');
    }

    return recs.join('\n\n');
  }

  private minutesToHuman(minutes: number): string {
    if (minutes < 1) return 'menos de 1 minuto';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h > 0 && m > 0) return `${h} hora${h > 1 ? 's' : ''} y ${m} minuto${m > 1 ? 's' : ''}`;
    if (h > 0) return `${h} hora${h > 1 ? 's' : ''}`;
    return `${m} minuto${m > 1 ? 's' : ''}`;
  }

  private formatKm(km: number): string {
    return (Math.round(km * 1000) / 1000).toFixed(3);
  }
}
