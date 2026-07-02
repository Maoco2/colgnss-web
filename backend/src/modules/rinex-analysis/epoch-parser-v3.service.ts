import { Injectable } from '@nestjs/common';

export interface ParsedEpochV3 {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  epochFlag: number;
  numSats: number;
  systems: string[];
  raw: string;
}

export interface EpochV3Block {
  epoch: ParsedEpochV3;
  obsLines: string[];
}

@Injectable()
export class EpochParserV3Service {
  parse(
    lines: string[],
    startIdx: number
  ): { block: EpochV3Block | null; nextIdx: number } {
    let idx = startIdx;

    while (idx < lines.length) {
      const line = lines[idx];

      if (!line.trim()) {
        idx++;
        continue;
      }

      const epoch = this.tryParse(line);

      if (!epoch) {
        idx++;
        continue;
      }

      const obsLines: string[] = [];
      let obsIdx = idx + 1;

      while (obsIdx < lines.length) {
        const obsLine = lines[obsIdx];

        if (!obsLine.trim()) {
          obsIdx++;
          continue;
        }

        if (obsLine.trimStart().startsWith('>')) {
          break;
        }

        obsLines.push(obsLine);
        obsIdx++;
      }

      return {
        block: {
          epoch,
          obsLines
        },
        nextIdx: obsIdx
      };
    }

    return {
      block: null,
      nextIdx: lines.length
    };
  }

  parseSingle(line: string): ParsedEpochV3 | null {
    return this.tryParse(line);
  }

  private tryParse(line: string): ParsedEpochV3 | null {
    const clean = line.trimStart();

    if (!clean.startsWith('>')) {
      return null;
    }

    const parts = clean
      .substring(1)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length < 8) {
      return null;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    const hour = Number(parts[3]);
    const minute = Number(parts[4]);
    const second = Number(parts[5]);

    const epochFlag = Number(parts[6]) || 0;
    const numSats = Number(parts[7]) || 0;

    if (
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      Number.isNaN(day) ||
      Number.isNaN(hour) ||
      Number.isNaN(minute) ||
      Number.isNaN(second)
    ) {
      return null;
    }

    if (year < 1980 || year > 2100) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    if (hour < 0 || hour > 23) return null;
    if (minute < 0 || minute > 59) return null;
    if (second < 0 || second >= 61) return null;

    const systems: string[] = [];

    for (let i = 8; i < parts.length; i++) {
      const s = parts[i].trim();
      if (s && !systems.includes(s)) {
        systems.push(s);
      }
    }

    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      epochFlag,
      numSats,
      systems,
      raw: clean
    };
  }
}
