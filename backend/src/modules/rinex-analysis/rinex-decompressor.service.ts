import { Injectable, BadRequestException } from '@nestjs/common';
import * as zlib from 'zlib';
const AdmZip = require('adm-zip');

export interface DecompressedFile {
  fileName: string;
  content: Buffer;
  originalName: string;
}

export interface ZipContents {
  files: { fileName: string; size: number; isObservable: boolean }[];
}

@Injectable()
export class RinexDecompressorService {
  decompressGzip(buffer: Buffer, originalName: string): DecompressedFile {
    const content = zlib.gunzipSync(buffer);
    const fileName = originalName.replace(/\.gz$/i, '').replace(/\.gzip$/i, '');
    return { fileName, content, originalName };
  }

  decompressZip(buffer: Buffer, originalName: string): DecompressedFile[] {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries() as any[];
    const rinexEntries = entries.filter((e: any) =>
      !e.isDirectory &&
      this.isRinexFile(e.entryName),
    );

    return rinexEntries.map((e: any) => ({
      fileName: e.entryName,
      content: e.getData(),
      originalName,
    }));
  }

  listZipContents(buffer: Buffer): ZipContents {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries() as any[];
    const files = entries
      .filter((e: any) => !e.isDirectory)
      .map((e: any) => ({
        fileName: e.entryName,
        size: e.header.size,
        isObservable: this.isObservableFile(e.entryName),
      }));
    return { files };
  }

  extractZipFile(buffer: Buffer, fileName: string): DecompressedFile {
    const zip = new AdmZip(buffer);
    const entry = zip.getEntry(fileName);
    if (!entry) {
      throw new BadRequestException(`Archivo ${fileName} no encontrado en el ZIP`);
    }
    return {
      fileName: entry.entryName,
      content: entry.getData(),
      originalName: fileName,
    };
  }

  decompressHatanaka(buffer: Buffer, originalName: string): DecompressedFile {
    const content = this.hatanakaDecode(buffer.toString('utf-8'));
    const fileName = originalName.replace(/\.crx$/i, '.rnx').replace(/\.crx\.gz$/i, '.rnx');
    return { fileName, content: Buffer.from(content, 'utf-8'), originalName };
  }

  detectCompression(buffer: Buffer, filename: string): 'gzip' | 'zip' | 'hatanaka' | 'none' {
    const ext = filename.toLowerCase();
    if (ext.endsWith('.gz') || ext.endsWith('.gzip')) return 'gzip';
    if (ext.endsWith('.zip')) return 'zip';
    if (ext.endsWith('.crx')) return 'hatanaka';
    const content = buffer.toString('utf-8', 0, 500);
    if (content.includes('COMPACT RINEX FORMAT')) return 'hatanaka';
    return 'none';
  }

  private isRinexFile(name: string): boolean {
    return this.isObservableFile(name) || /\.(rnx|nav|gps|glo|eph)$/i.test(name);
  }

  private isObservableFile(name: string): boolean {
    const lower = name.toLowerCase();
    if (lower.endsWith('.obs') || lower.endsWith('.rnx') || lower.endsWith('.crx') || lower.endsWith('.dat')) return true;
    if (/\.\d{2}[a-z]$/i.test(lower) || /\.\d{2}[a-z]\.gz$/i.test(lower)) return true;
    return false;
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

  private decodeCrEpoch(epochLine: string, firstLine: string, allLines: string[], startIdx: number): { lines: string[]; nextIndex: number } {
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
