import { Injectable } from '@nestjs/common';

export interface ParsedEpochV2 {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  epochFlag: number;
  numSats: number;
  prns: string[];
  raw: string;
}

@Injectable()
export class EpochParserV2Service {

  parse(
    lines: string[],
    startIdx: number
  ): { epoch: ParsedEpochV2 | null; nextIdx: number } {

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

      let obsIdx = idx + 1;

      while (obsIdx < lines.length) {

        const obsLine = lines[obsIdx];

        if (!obsLine.trim()) {
          obsIdx++;
          continue;
        }

        if (this.tryParse(obsLine)) {
          break;
        }

        obsIdx++;

      }

      return {
        epoch,
        nextIdx: obsIdx
      };

    }

    return {
      epoch: null,
      nextIdx: lines.length
    };

  }

  parseSingle(line: string): ParsedEpochV2 | null {
    return this.tryParse(line);
  }

  private tryParse(line: string): ParsedEpochV2 | null {

    const clean = line.trimStart();

    if (
      clean.includes('RINEX') ||
      clean.includes('END OF HEADER') ||
      clean.includes('COMMENT')
    ) {
      return null;
    }

    if (clean.startsWith(">")) {
      return null;
    }

    const parts = clean.split(/\s+/).filter(Boolean);

    if (parts.length < 7) {
      return null;
    }

    // Reject observation lines: in a real RINEX 2 epoch line, parts[6] is either:
    //   1) A single digit 0-6 (epoch flag)
    //   2) Digits + letters, e.g. "12G01..." (numSats prefix when flag is omitted)
    //   3) Plain 1-3 digit numSats when both flag and PRN list are absent
    // Observation lines have parts[6] as a decimal value like "52.000" or "0.000".
    const sixth = parts[6];
    const isEpochFlag = /^[0-6]$/.test(sixth);
    const isPrnPrefix = /^\d{1,3}[A-Z]/.test(sixth);
    const isNumSatsOnly = /^[1-9]\d{0,2}$/.test(sixth);
    if (!isEpochFlag && !isPrnPrefix && !isNumSatsOnly) {
      return null;
    }

    const year = this.parseYear(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    const hour = Number(parts[3]);
    const minute = Number(parts[4]);
    const second = Number(parts[5]);
    const epochFlag = Number(parts[6]) || 0;

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

    let numSats = 0;
    const prns: string[] = [];

    // Extract numSats and PRN list from parts[7] (when epoch flag is present)
    // or from parts[6] (when epoch flag is omitted / defaults to 0).
    // The PRN field starts with the satellite count as leading digits.
    const prnField = parts.length >= 8 ? parts[7] : (parts.length >= 7 ? parts[6] : '');
    if (prnField) {
      const leadingDigits = prnField.match(/^(\d{1,3})/);
      if (leadingDigits) {
        numSats = parseInt(leadingDigits[1], 10) || 0;
        // PRN list: after the leading number, each PRN is 3 chars (e.g. "G01G02...")
        const prnStr = prnField.substring(leadingDigits[1].length);
        for (let i = 0; i + 3 <= prnStr.length; i += 3) {
          const prn = prnStr.substring(i, i + 3).trim();
          if (prn.length > 0) prns.push(prn);
        }
      }
    }

    if (numSats <= 0 && clean.length >= 32) {
      const satField = clean.substring(29, 32).trim();
      if (satField) numSats = Number(satField);
    }

    if (Number.isNaN(numSats) || numSats < 0) numSats = 0;

    return {

      year,
      month,
      day,
      hour,
      minute,
      second,
      epochFlag,
      numSats,
      prns,
      raw: clean

    };

  }

  private parseYear(value: string): number {

    const y = Number(value);

    if (Number.isNaN(y)) {
      return y;
    }

    if (y < 80) {
      return 2000 + y;
    }

    if (y < 100) {
      return 1900 + y;
    }

    return y;

  }

}