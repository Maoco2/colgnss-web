import { Injectable } from '@nestjs/common';

export interface ObservableInfo {
  code: string;
  frequency: string;
  trackingMode: string;
  description: string;
}

export interface ObservableTable {
  system: string;
  observables: ObservableInfo[];
  count: number;
}

const OBSERVABLE_CATALOG: Record<string, { frequency: string; trackingMode: string; description: string }> = {
  // GPS (G)
  'G_C1C': { frequency: 'L1', trackingMode: 'C/A', description: 'Código C/A en L1' },
  'G_C1P': { frequency: 'L1', trackingMode: 'P', description: 'Código P en L1' },
  'G_C1W': { frequency: 'L1', trackingMode: 'P(Y)', description: 'Código P(Y) en L1' },
  'G_C1X': { frequency: 'L1', trackingMode: 'P(Y)', description: 'Código P(Y) extendido en L1' },
  'G_L1C': { frequency: 'L1', trackingMode: 'C/A', description: 'Fase portadora L1 C/A' },
  'G_L1P': { frequency: 'L1', trackingMode: 'P', description: 'Fase portadora L1 P' },
  'G_L1W': { frequency: 'L1', trackingMode: 'P(Y)', description: 'Fase portadora L1 P(Y)' },
  'G_D1C': { frequency: 'L1', trackingMode: 'C/A', description: 'Doppler L1 C/A' },
  'G_S1C': { frequency: 'L1', trackingMode: 'C/A', description: 'SNR L1 C/A' },
  'G_C2L': { frequency: 'L2', trackingMode: 'L2C(M)', description: 'Código L2C (moderado) en L2' },
  'G_C2M': { frequency: 'L2', trackingMode: 'L2C(L)', description: 'Código L2C (largo) en L2' },
  'G_C2P': { frequency: 'L2', trackingMode: 'P', description: 'Código P en L2' },
  'G_C2W': { frequency: 'L2', trackingMode: 'P(Y)', description: 'Código P(Y) en L2' },
  'G_C2X': { frequency: 'L2', trackingMode: 'P(Y)', description: 'Código P(Y) extendido en L2' },
  'G_L2L': { frequency: 'L2', trackingMode: 'L2C(M)', description: 'Fase portadora L2C (moderado)' },
  'G_L2M': { frequency: 'L2', trackingMode: 'L2C(L)', description: 'Fase portadora L2C (largo)' },
  'G_L2P': { frequency: 'L2', trackingMode: 'P', description: 'Fase portadora L2 P' },
  'G_L2W': { frequency: 'L2', trackingMode: 'P(Y)', description: 'Fase portadora L2 P(Y)' },
  'G_D2L': { frequency: 'L2', trackingMode: 'L2C(M)', description: 'Doppler L2C (moderado)' },
  'G_S2L': { frequency: 'L2', trackingMode: 'L2C(M)', description: 'SNR L2C (moderado)' },
  'G_C5I': { frequency: 'L5', trackingMode: 'I5', description: 'Código I5 en L5' },
  'G_C5Q': { frequency: 'L5', trackingMode: 'Q5', description: 'Código Q5 en L5' },
  'G_C5X': { frequency: 'L5', trackingMode: 'I+Q5', description: 'Código I+Q5 en L5' },
  'G_L5I': { frequency: 'L5', trackingMode: 'I5', description: 'Fase portadora L5 I' },
  'G_L5Q': { frequency: 'L5', trackingMode: 'Q5', description: 'Fase portadora L5 Q' },
  'G_L5X': { frequency: 'L5', trackingMode: 'I+Q5', description: 'Fase portadora L5 I+Q' },
  'G_D5I': { frequency: 'L5', trackingMode: 'I5', description: 'Doppler L5 I' },
  'G_S5I': { frequency: 'L5', trackingMode: 'I5', description: 'SNR L5 I' },
  // GLONASS (R)
  'R_C1C': { frequency: 'L1', trackingMode: 'C/A', description: 'Código C/A en L1' },
  'R_C1P': { frequency: 'L1', trackingMode: 'P', description: 'Código P en L1' },
  'R_L1C': { frequency: 'L1', trackingMode: 'C/A', description: 'Fase portadora L1 C/A' },
  'R_L1P': { frequency: 'L1', trackingMode: 'P', description: 'Fase portadora L1 P' },
  'R_D1C': { frequency: 'L1', trackingMode: 'C/A', description: 'Doppler L1 C/A' },
  'R_S1C': { frequency: 'L1', trackingMode: 'C/A', description: 'SNR L1 C/A' },
  'R_C2C': { frequency: 'L2', trackingMode: 'C/A', description: 'Código C/A en L2' },
  'R_C2P': { frequency: 'L2', trackingMode: 'P', description: 'Código P en L2' },
  'R_L2C': { frequency: 'L2', trackingMode: 'C/A', description: 'Fase portadora L2 C/A' },
  'R_L2P': { frequency: 'L2', trackingMode: 'P', description: 'Fase portadora L2 P' },
  'R_C3I': { frequency: 'L3', trackingMode: 'I', description: 'Código en L3 (CDMA)' },
  'R_C3Q': { frequency: 'L3', trackingMode: 'Q', description: 'Código en L3 (CDMA)' },
  'R_L3I': { frequency: 'L3', trackingMode: 'I', description: 'Fase portadora L3' },
  // Galileo (E)
  'E_C1A': { frequency: 'E1', trackingMode: 'A', description: 'Código piloto E1A (PRS)' },
  'E_C1B': { frequency: 'E1', trackingMode: 'B', description: 'Código I/NAV E1B' },
  'E_C1C': { frequency: 'E1', trackingMode: 'C', description: 'Código C/NAV E1C' },
  'E_C1X': { frequency: 'E1', trackingMode: 'B+C', description: 'Código combinado E1B+E1C' },
  'E_L1B': { frequency: 'E1', trackingMode: 'B', description: 'Fase portadora E1B' },
  'E_L1C': { frequency: 'E1', trackingMode: 'C', description: 'Fase portadora E1C' },
  'E_L1X': { frequency: 'E1', trackingMode: 'B+C', description: 'Fase portadora E1B+E1C' },
  'E_C5I': { frequency: 'E5a', trackingMode: 'I', description: 'Código F/NAV E5aI' },
  'E_C5Q': { frequency: 'E5a', trackingMode: 'Q', description: 'Código F/NAV E5aQ' },
  'E_C5X': { frequency: 'E5a', trackingMode: 'I+Q', description: 'Código E5aI+E5aQ' },
  'E_L5I': { frequency: 'E5a', trackingMode: 'I', description: 'Fase portadora E5aI' },
  'E_L5Q': { frequency: 'E5a', trackingMode: 'Q', description: 'Fase portadora E5aQ' },
  'E_L5X': { frequency: 'E5a', trackingMode: 'I+Q', description: 'Fase portadora E5aI+E5aQ' },
  'E_C7I': { frequency: 'E5b', trackingMode: 'I', description: 'Código I/NAV E5bI' },
  'E_C7Q': { frequency: 'E5b', trackingMode: 'Q', description: 'Código I/NAV E5bQ' },
  'E_C7X': { frequency: 'E5b', trackingMode: 'I+Q', description: 'Código E5bI+E5bQ' },
  'E_L7I': { frequency: 'E5b', trackingMode: 'I', description: 'Fase portadora E5bI' },
  'E_L7Q': { frequency: 'E5b', trackingMode: 'Q', description: 'Fase portadora E5bQ' },
  'E_L7X': { frequency: 'E5b', trackingMode: 'I+Q', description: 'Fase portadora E5bI+E5bQ' },
  'E_C8I': { frequency: 'E6', trackingMode: 'I', description: 'Código E6I (PRS)' },
  'E_C8Q': { frequency: 'E6', trackingMode: 'Q', description: 'Código E6Q' },
  'E_L8I': { frequency: 'E6', trackingMode: 'I', description: 'Fase portadora E6I' },
  // BeiDou (C)
  'C_C2I': { frequency: 'B1', trackingMode: 'I', description: 'Código B1I' },
  'C_C2Q': { frequency: 'B1', trackingMode: 'Q', description: 'Código B1Q' },
  'C_L2I': { frequency: 'B1', trackingMode: 'I', description: 'Fase portadora B1I' },
  'C_C6I': { frequency: 'B3', trackingMode: 'I', description: 'Código B3I' },
  'C_C6Q': { frequency: 'B3', trackingMode: 'Q', description: 'Código B3Q' },
  'C_L6I': { frequency: 'B3', trackingMode: 'I', description: 'Fase portadora B3I' },
  'C_C7I': { frequency: 'B2', trackingMode: 'I', description: 'Código B2I' },
  'C_C7Q': { frequency: 'B2', trackingMode: 'Q', description: 'Código B2Q' },
  'C_L7I': { frequency: 'B2', trackingMode: 'I', description: 'Fase portadora B2I' },
  // QZSS (J)
  'J_C1C': { frequency: 'L1', trackingMode: 'C/A', description: 'Código C/A en L1' },
  'J_C2L': { frequency: 'L2', trackingMode: 'L2C', description: 'Código L2C en L2' },
  'J_L1C': { frequency: 'L1', trackingMode: 'C/A', description: 'Fase portadora L1 C/A' },
  'J_C5Q': { frequency: 'L5', trackingMode: 'Q', description: 'Código Q en L5' },
  // IRNSS (I)
  'I_C5A': { frequency: 'L5', trackingMode: 'A', description: 'Código SPS en L5' },
  'I_C5B': { frequency: 'L5', trackingMode: 'B', description: 'Código B en L5' },
  'I_L5A': { frequency: 'L5', trackingMode: 'A', description: 'Fase portadora L5' },
  // SBAS (S)
  'S_C1C': { frequency: 'L1', trackingMode: 'C/A', description: 'Código C/A en L1' },
  'S_L1C': { frequency: 'L1', trackingMode: 'C/A', description: 'Fase portadora L1 C/A' },
  'S_C5I': { frequency: 'L5', trackingMode: 'I', description: 'Código I en L5' },
  'S_C5Q': { frequency: 'L5', trackingMode: 'Q', description: 'Código Q en L5' },
};

const SYS_PREFIX: Record<string, string> = {
  G: 'G_', R: 'R_', E: 'E_', C: 'C_', J: 'J_', I: 'I_', S: 'S_',
};

const SYSName_MAP: Record<string, string> = {
  G: 'GPS', R: 'GLONASS', E: 'Galileo', C: 'BeiDou', J: 'QZSS', I: 'IRNSS', S: 'SBAS',
};

@Injectable()
export class RinexObservationParserService {
  parseObservableTables(obsTypes: Record<string, string[]>, version: string): ObservableTable[] {
    const tables: ObservableTable[] = [];

    for (const [sys, types] of Object.entries(obsTypes)) {
      const systemName = SYSName_MAP[sys] || sys;
      const prefix = SYS_PREFIX[sys] || `${sys}_`;
      const observables = types.map(code => {
        const key = `${prefix}${code}`;
        const cat = OBSERVABLE_CATALOG[key];
        if (cat) {
          return { code, ...cat };
        }
        return {
          code,
          frequency: this.guessFrequency(code),
          trackingMode: this.guessTrackingMode(code),
          description: this.guessDescription(code),
        };
      });

      tables.push({ system: systemName, observables, count: types.length });
    }

    return tables;
  }

  determineFrequency(obsTypes: Record<string, string[]>): string {
    const all = Object.values(obsTypes).flat().join(' ');
    const hasL5 = /\b[CL]5[ABCXZI]\b/.test(all);
    const hasE5 = /\b[CE]5[ABCXZI]\b/.test(all);
    const hasL2 = /\b[CL]2[LPCDSMWXZI]\b/.test(all) || /\bP2\b/.test(all);
    const hasL1 = /\b[CL]1[CDPWSMXZI]\b/.test(all) || /\bP1\b/.test(all);
    if (hasL5 || hasE5) return 'Multifrecuencia';
    if (hasL2) return 'Doble frecuencia';
    if (hasL1) return 'Monofrecuencia';
    return 'No determinado';
  }

  getObservableCountBySystem(obsTypes: Record<string, string[]>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [sys, types] of Object.entries(obsTypes)) {
      result[SYSName_MAP[sys] || sys] = types.length;
    }
    return result;
  }

  private guessFrequency(code: string): string {
    const digit = code.match(/\d/)?.[0];
    const freqMap: Record<string, string> = {
      '1': 'L1/E1/B1', '2': 'L2/B1', '5': 'L5/E5a/B2', '6': 'B3', '7': 'E5b/B2', '8': 'E6',
    };
    return digit ? (freqMap[digit] || `Frecuencia ${digit}`) : 'Desconocida';
  }

  private guessTrackingMode(code: string): string {
    const last = code.slice(-1);
    const modeMap: Record<string, string> = {
      C: 'C/A', P: 'P', W: 'P(Y)', X: 'I+Q', Y: 'M', Z: 'M+',
      A: 'A', B: 'B', I: 'I', Q: 'Q', L: 'L2C(M)', M: 'L2C(L)',
    };
    return modeMap[last] || last;
  }

  private guessDescription(code: string): string {
    const type = code[0];
    const freq = code.slice(1);
    switch (type) {
      case 'C': return `Código en frecuencia ${freq}`;
      case 'L': return `Fase portadora en frecuencia ${freq}`;
      case 'D': return `Doppler en frecuencia ${freq}`;
      case 'S': return `SNR en frecuencia ${freq}`;
      default: return `Observable ${code}`;
    }
  }
}
