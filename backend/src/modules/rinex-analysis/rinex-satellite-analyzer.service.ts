import { Injectable } from '@nestjs/common';

export interface SatelliteStats {
  prn: string;
  observations: number;
  epochs: number;
  availability: number;
}

export interface SatelliteAnalysis {
  totalEpochs: number;
  uniqueSatellites: number;
  averageSimultaneous: number;
  maximumSimultaneous: number;
  minimumSimultaneous: number;
  standardDeviation: number;
  totalObservations: number;
  observationsByConstellation: Record<string, number>;
  satellitesByConstellation: Record<string, number>;
  satellites: SatelliteStats[];
}

const SYS_TO_CONST: Record<string, string> = {
  G: 'GPS', R: 'GLONASS', E: 'GALILEO', C: 'BEIDOU',
  J: 'QZSS', I: 'IRNSS', S: 'SBAS',
};

const ALL_CONST = ['GPS', 'GLONASS', 'GALILEO', 'BEIDOU', 'SBAS', 'QZSS', 'IRNSS'];

@Injectable()
export class SatelliteAnalyzerService {
  analyze(content: string, headerEnd: number): SatelliteAnalysis {
    const lines = content.split('\n');
    const epochValues: number[] = [];
    const uniquePrns = new Set<string>();
    const satObs = new Map<string, number>();
    const satEpochs = new Map<string, number>();

    let totalObservations = 0;

    for (let i = headerEnd + 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('> ')) {
        const { numSat, prnList } = this.parseV3Epoch(line);
        if (numSat <= 0) continue;

        epochValues.push(numSat);
        totalObservations += numSat;

        for (const prn of prnList) {
          uniquePrns.add(prn);
          satEpochs.set(prn, (satEpochs.get(prn) || 0) + 1);
        }

        const counted = this.countV3Obs(i + 1, lines, prnList, satObs);
        i += counted > 0 ? counted : Math.max(prnList.length, 1);
        continue;
      }

      if (this.isRinex2Epoch(line)) {
        const { numSat, prnList } = this.parseV2Epoch(line, lines, i);
        if (numSat <= 0) continue;

        epochValues.push(numSat);
        totalObservations += numSat;

        for (const prn of prnList) {
          uniquePrns.add(prn);
          satEpochs.set(prn, (satEpochs.get(prn) || 0) + 1);
        }

        const consumed = this.countV2Obs(i + 1, lines, prnList, satObs);
        i += consumed;
        continue;
      }
    }

    // Build statistics
    const totalEpochs = epochValues.length;
    const sum = epochValues.reduce((a, b) => a + b, 0);
    const avg = totalEpochs > 0 ? sum / totalEpochs : 0;
    const max = totalEpochs > 0 ? Math.max(...epochValues) : 0;
    const min = totalEpochs > 0 ? Math.min(...epochValues) : 0;

    const variance = totalEpochs > 1
      ? epochValues.reduce((acc, v) => acc + (v - avg) ** 2, 0) / (totalEpochs - 1)
      : 0;
    const stdDev = Math.sqrt(variance);

    const obsByConst: Record<string, number> = {};
    const satsByConst: Record<string, Set<string>> = {};
    for (const c of ALL_CONST) {
      obsByConst[c] = 0;
      satsByConst[c] = new Set();
    }

    for (const [prn, obsCount] of satObs) {
      const cn = SYS_TO_CONST[prn.charAt(0)];
      if (cn) {
        obsByConst[cn] = (obsByConst[cn] || 0) + obsCount;
        satsByConst[cn].add(prn);
      }
    }

    const satellites: SatelliteStats[] = [];
    for (const [prn, observations] of satObs) {
      const epochs = satEpochs.get(prn) || 0;
      satellites.push({
        prn,
        observations,
        epochs,
        availability: totalEpochs > 0 ? Math.round((epochs / totalEpochs) * 1000) / 10 : 0,
      });
    }
    satellites.sort((a, b) => a.prn.localeCompare(b.prn));

    const satsByConstResult: Record<string, number> = {};
    for (const c of ALL_CONST) {
      satsByConstResult[c] = satsByConst[c].size;
    }

    return {
      totalEpochs,
      uniqueSatellites: uniquePrns.size,
      averageSimultaneous: Math.round(avg * 10) / 10,
      maximumSimultaneous: max,
      minimumSimultaneous: min,
      standardDeviation: Math.round(stdDev * 10) / 10,
      totalObservations,
      observationsByConstellation: obsByConst,
      satellitesByConstellation: satsByConstResult,
      satellites,
    };
  }

  private parseV3Epoch(line: string): { numSat: number; prnList: string[] } {
    const parts = line.substring(2).trim().split(/\s+/).filter(Boolean);
    if (parts.length < 8) return { numSat: 0, prnList: [] };
    const numSat = parseInt(parts[7]) || 0;
    const prnList: string[] = [];
    for (let si = 8; si < parts.length; si++) {
      const prn = parts[si];
      if (/^[GRECJIS]\d{2}$/.test(prn)) {
        prnList.push(prn);
      }
    }
    return { numSat, prnList };
  }

  private parseV2Epoch(line: string, lines: string[], idx: number): { numSat: number; prnList: string[] } {
    const parts = line.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 7) return { numSat: 0, prnList: [] };

    let numSat = 0;
    let prnField = '';
    if (parts.length >= 8 && /^[0-6]$/.test(parts[6])) {
      prnField = parts[7];
      const m = parts[7].match(/^(\d{1,3})/);
      numSat = m ? parseInt(m[1], 10) || 0 : parseInt(parts[7]) || 0;
    } else {
      prnField = parts[6];
      const m = parts[6].match(/^(\d{1,3})/);
      numSat = m ? parseInt(m[1], 10) || 0 : parseInt(parts[6]) || 0;
    }

    // Collect all PRN list lines (epoch + continuation lines)
    let fullPrnStr = prnField.replace(/^\d{1,3}/, '');
    for (let j = idx + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      if (/^[GRECJIS]\d{2}/.test(next) && next.length <= 80 && !/\s/.test(next)) {
        fullPrnStr += next;
      } else {
        break;
      }
    }

    const prnList: string[] = [];
    for (let j = 0; j + 3 <= fullPrnStr.length; j += 3) {
      const prn = fullPrnStr.substring(j, j + 3);
      if (/^[GRECJIS]\d{2}$/.test(prn)) {
        prnList.push(prn);
      }
    }

    return { numSat, prnList };
  }

  private countV3Obs(startIdx: number, lines: string[], prnList: string[], satObs: Map<string, number>): number {
    let counted = 0;
    for (let j = startIdx; j < lines.length; j++) {
      const next = lines[j];
      if (next.startsWith('> ') || this.isRinex2Epoch(next)) break;
      const prn = next.substring(0, 3).trim();
      if (/^[GRECJIS]\d{2}$/.test(prn) && prnList.includes(prn)) {
        satObs.set(prn, (satObs.get(prn) || 0) + 1);
        counted++;
      }
    }
    // Fallback: if no observation lines matched PRN list, count one per PRN
    if (counted === 0 && prnList.length > 0) {
      for (const prn of prnList) {
        satObs.set(prn, (satObs.get(prn) || 0) + 1);
        counted++;
      }
    }
    return counted;
  }

  private countV2Obs(startIdx: number, lines: string[], prnList: string[], satObs: Map<string, number>): number {
    const collected: string[] = [];
    const prnSet = new Set(prnList);

    for (let j = startIdx; j < lines.length; j++) {
      const next = lines[j];
      if (this.isRinex2Epoch(next) || next.startsWith('> ')) break;

      const trimmed = next.trim();
      // Skip continuation lines (PRN codes with no observation data)
      if (/^[GRECJIS]\d{2}[GRECJIS]/.test(trimmed) && trimmed.length <= 80 && !/\s/.test(trimmed)) {
        continue;
      }

      const prn = this.extractV2ObsPrn(next);
      if (prn) {
        collected.push(prn);
      } else {
        // Maybe a continuation of previous obs line (no PRN) → skip
        continue;
      }
    }

    // Match collected PRNs against PRN list order
    let matched = 0;
    if (collected.length > 0) {
      for (let k = 0; k < collected.length && k < prnList.length; k++) {
        const prn = prnList[k];
        satObs.set(prn, (satObs.get(prn) || 0) + 1);
        matched++;
      }
    }

    // Fallback: use PRN list directly
    if (matched === 0 && prnList.length > 0) {
      for (const prn of prnList) {
        satObs.set(prn, (satObs.get(prn) || 0) + 1);
        matched++;
      }
    }

    return Math.max(matched, 1);
  }

  private isRinex2Epoch(line: string): boolean {
    return /^\s*\d{4}\s+\d{2}/.test(line) &&
      !line.includes('RINEX') && !line.includes('END') && !line.includes('COMMENT');
  }

  private extractV2ObsPrn(line: string): string | null {
    const tokens = line.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return null;
    const last = tokens[tokens.length - 1];
    if (/^[GRECJIS]\d{2}$/.test(last)) return last;
    return null;
  }
}
