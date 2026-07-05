import { Injectable, BadRequestException } from '@nestjs/common';
import * as zlib from 'zlib';

export interface NormalizedRinex {
  buffer: Buffer;
  filename: string;
  version: string;
  isTemporary: boolean;
}

@Injectable()
export class RinexNormalizerService {
  normalize(buffer: Buffer, filename: string): NormalizedRinex {
    let result = this.decompressGzip(buffer, filename);
    let isTemporary = result !== undefined;

    if (!result) {
      result = { buffer, filename };
    }

    const hatanakaResult = this.decompressHatanaka(result.buffer, result.filename);
    if (hatanakaResult) {
      result = hatanakaResult;
      isTemporary = true;
    }

    if (!this.isValidObs(result.buffer)) {
      throw new BadRequestException(
        `El archivo "${filename}" no pudo convertirse a un RINEX OBS válido`,
      );
    }

    const version = this.detectVersion(result.buffer);
    const obsFilename = this.ensureObsExtension(result.filename);

    return {
      buffer: result.buffer,
      filename: obsFilename,
      version,
      isTemporary,
    };
  }

  private decompressGzip(buffer: Buffer, filename: string): { buffer: Buffer; filename: string } | undefined {
    const lower = filename.toLowerCase();
    if (!lower.endsWith('.gz') && !lower.endsWith('.gzip')) return undefined;
    try {
      const content = zlib.gunzipSync(buffer);
      const fname = filename.replace(/\.gz$/i, '').replace(/\.gzip$/i, '');
      return { buffer: content, filename: fname };
    } catch {
      return undefined;
    }
  }

  private decompressHatanaka(buffer: Buffer, filename: string): { buffer: Buffer; filename: string } | undefined {
    const lower = filename.toLowerCase();
    const contentStr = buffer.toString('utf-8', 0, 500);
    const isCrx = lower.endsWith('.crx') || contentStr.includes('COMPACT RINEX FORMAT');
    if (!isCrx) return undefined;

    const decoded = this.hatanakaDecode(buffer.toString('utf-8'));
    const fname = filename
      .replace(/\.crx\.gz$/i, '.rnx')
      .replace(/\.crx$/i, '.rnx')
      .replace(/\.d$/i, '.rnx');
    return { buffer: Buffer.from(decoded, 'utf-8'), filename: fname };
  }

  private isValidObs(buffer: Buffer): boolean {
    const head = buffer.toString('utf-8', 0, 2000);
    return head.includes('RINEX VERSION / TYPE') || head.includes('END OF HEADER');
  }

  private detectVersion(buffer: Buffer): string {
    const firstLine = buffer.toString('utf-8', 0, 80);
    return firstLine.substring(0, 9).trim() || '';
  }

  private ensureObsExtension(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.obs')) return filename;
    if (lower.endsWith('.rnx')) return filename.replace(/\.rnx$/i, '.obs');
    if (lower.endsWith('.crx')) return filename.replace(/\.crx$/i, '.obs');
    if (lower.endsWith('.d')) return filename.replace(/\.d$/i, '.obs');
    if (lower.endsWith('.dat')) return filename.replace(/\.dat$/i, '.obs');
    const match = filename.match(/\.(\d{2}[a-z])$/i);
    if (match) return filename.replace(/\.\d{2}[a-z]$/i, '.obs');
    return `${filename}.obs`;
  }

  private hatanakaDecode(crxContent: string): string {
    const lines = crxContent.split('\n');
    const output: string[] = [];
    let i = 0;

    for (i = 0; i < lines.length; i++) {
      output.push(lines[i]);
      if (lines[i].includes('END OF HEADER')) {
        i++;
        break;
      }
    }

    let epochLine = '';
    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('> ')) {
        epochLine = line;
        output.push(line);
        i++;
        continue;
      }

      if (!line.trim()) {
        output.push(line);
        i++;
        continue;
      }

      if (line.startsWith(' ') || line.startsWith('-') || line.startsWith('+')) {
        output.push(line);
        i++;
        continue;
      }

      if (epochLine && this.isEpochRecord(line)) {
        const decoded = this.decodeCrEpoch(epochLine, line, lines, i);
        output.push(...decoded.lines);
        i = decoded.nextIndex;
        continue;
      }

      output.push(line);
      i++;
    }

    return output.join('\n');
  }

  private isEpochRecord(line: string): boolean {
    return /^\d{4}\s/.test(line) || /^\d{2}\s/.test(line);
  }

  private decodeCrEpoch(
    epochLine: string,
    firstLine: string,
    allLines: string[],
    startIdx: number,
  ): { lines: string[]; nextIndex: number } {
    const lines: string[] = [firstLine];
    let idx = startIdx + 1;

    while (idx < allLines.length) {
      const line = allLines[idx];
      const trimmed = line.trim();

      if (!trimmed || line.startsWith('> ') || this.isNewEpoch(line)) {
        break;
      }

      if (line.startsWith('&')) {
        const repeatCount = parseInt(line.substring(1, 4)) || 1;
        const refLine = line.substring(5);
        for (let r = 0; r < repeatCount; r++) {
          lines.push(refLine);
        }
      } else if (line.startsWith('#')) {
        const diff = line.substring(1);
        const prev = lines[lines.length - 1] || '';
        const decoded = this.applyDifference(prev, diff);
        lines.push(decoded);
      } else {
        lines.push(line);
      }
      idx++;
    }

    return { lines, nextIndex: idx };
  }

  private isNewEpoch(line: string): boolean {
    return /^\d{4}\s{2}\d{2}\s/.test(line) || /^>\s/.test(line);
  }

  private applyDifference(prev: string, diff: string): string {
    const prevParts = prev.split(/\s+/);
    const diffParts = diff.trim().split(/\s+/);
    const result: string[] = [];
    let pi = 0;

    for (const dp of diffParts) {
      if (dp.startsWith('+') || dp.startsWith('-')) {
        const diffVal = parseFloat(dp);
        const prevVal = parseFloat(prevParts[pi] || '0');
        result.push(String(prevVal + diffVal));
        pi++;
      } else {
        result.push(dp);
        pi++;
      }
    }

    while (pi < prevParts.length) {
      result.push(prevParts[pi]);
      pi++;
    }

    return result.join(' ');
  }
}
