import { Injectable } from '@nestjs/common';

export interface ConstellationObsStats {
  system: string;
  numSatellites: number;
  totalObservations: number;
  frequencies: string[];
  observables: string[];
  status: 'completo' | 'parcial' | 'mínimo';
}

export interface ObservationAnalysis {
  byConstellation: ConstellationObsStats[];
  totalObservations: number;
  totalSatellites: number;
  totalEpochs: number;
  frequencyDetected: string;
  warnings: string[];
}

const SYSTEM_LABEL: Record<string, string> = {
  G: 'GPS', R: 'GLONASS', E: 'Galileo', C: 'BeiDou', J: 'QZSS', I: 'IRNSS', S: 'SBAS',
};

const FREQ_BANDS: Record<string, string[]> = {
  '1': ['L1', 'E1', 'B1'],
  '2': ['L2', 'B1'],
  '5': ['L5', 'E5a', 'B2'],
  '6': ['B3'],
  '7': ['E5b', 'B2'],
  '8': ['E6'],
};

@Injectable()
export class ObservationAnalyzerService {
  analyze(
    obsTypes: Record<string, string[]>,
    numEpochs: number,
  ): ObservationAnalysis {
    const byConstellation: ConstellationObsStats[] = [];
    let totalObservations = 0;
    let totalSatellites = 0;
    const allFreqs = new Set<string>();
    const warnings: string[] = [];

    for (const [sys, types] of Object.entries(obsTypes)) {
      const systemName = SYSTEM_LABEL[sys] || sys;
      const freqs = this.extractFrequencies(types);
      freqs.forEach(f => allFreqs.add(f));

      const uniqueFreqs = [...new Set(freqs)];
      const numObsPerEpoch = types.length;

      let status: ConstellationObsStats['status'] = 'mínimo';
      if (uniqueFreqs.length >= 3) status = 'completo';
      else if (uniqueFreqs.length >= 2) status = 'parcial';

      const estimatedSats = Math.max(4, Math.round(types.length / 3));

      byConstellation.push({
        system: systemName,
        numSatellites: estimatedSats,
        totalObservations: numObsPerEpoch * numEpochs,
        frequencies: uniqueFreqs,
        observables: types,
        status,
      });

      totalObservations += numObsPerEpoch * numEpochs;
      totalSatellites += estimatedSats;
    }

    const frequencyDetected = this.detectFrequencyLabel([...allFreqs]);

    if (byConstellation.length === 0) {
      warnings.push('No se detectaron observables por constelación');
    }
    if (byConstellation.length === 1) {
      warnings.push('Archivo monoconstelación — se recomienda multifrecuencia para mejor precisión');
    }
    if (allFreqs.size < 2) {
      warnings.push('Detección monofrecuencia — se recomienda doble frecuencia para corrección ionosférica');
    }

    return {
      byConstellation,
      totalObservations,
      totalSatellites,
      totalEpochs: numEpochs,
      frequencyDetected,
      warnings,
    };
  }

  private extractFrequencies(types: string[]): string[] {
    const freqs: string[] = [];
    for (const t of types) {
      const digit = t.match(/\d/)?.[0];
      if (digit && FREQ_BANDS[digit]) {
        freqs.push(...FREQ_BANDS[digit]);
      }
    }
    return freqs;
  }

  private detectFrequencyLabel(freqs: string[]): string {
    if (freqs.length >= 3) return 'Multifrecuencia';
    if (freqs.length >= 2) return 'Doble frecuencia';
    if (freqs.length >= 1) return 'Monofrecuencia';
    return 'No determinado';
  }
}
