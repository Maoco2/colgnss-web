import { Injectable } from '@nestjs/common';

export enum FileFormat {
  RINEX_2 = 'RINEX_2',
  RINEX_3 = 'RINEX_3',
  RINEX_4 = 'RINEX_4',
  COMPACT_RINEX = 'COMPACT_RINEX',
}

export enum CompressionFormat {
  NONE = 'none',
  HATANAKA = 'hatanaka',
  GZIP = 'gzip',
  ZIP = 'zip',
}

export enum FileCategory {
  OBSERVATION = 'O',
  NAVIGATION_GPS = 'N',
  NAVIGATION_GLONASS = 'G',
  NAVIGATION = 'navigation',
  METEOROLOGICAL = 'M',
  CLOCK = 'C',
}

export interface DetectedSystem {
  system: string;
  label: string;
}

export interface FileDetectionResult {
  format: FileFormat;
  version: string;
  category: FileCategory;
  categoryLabel: string;
  compression: CompressionFormat;
  originalName: string;
  satelliteSystem: string;
  satelliteLabel: string;
  constellations: string[];
  isCompact: boolean;
  isCompressed: boolean;
  needsDecompression: boolean;
}

@Injectable()
export class RinexFileDetectorService {
  detect(content: Buffer | string, filename: string): FileDetectionResult {
    const str = typeof content === 'string' ? content : content.toString('utf-8').substring(0, 2000);
    const lines = str.split('\n');

    const compression = this.detectCompression(filename, str);
    const isCompact = compression === CompressionFormat.HATANAKA || this.isCompactRinex(str);
    const needsDecompression = compression !== CompressionFormat.NONE;

    const headerContent = isCompact ? this.extractCompactHeader(str) : str;

    const { format, version, category, satelliteSystem, constellations } = this.detectFromHeader(headerContent, filename);

    return {
      format,
      version,
      category,
      categoryLabel: this.categoryLabel(category),
      compression,
      originalName: filename,
      satelliteSystem,
      satelliteLabel: this.systemLabel(satelliteSystem),
      constellations,
      isCompact,
      isCompressed: compression !== CompressionFormat.NONE,
      needsDecompression,
    };
  }

  isValidRinex(content: string): boolean {
    return content.includes('RINEX VERSION / TYPE') || content.includes('COMPACT RINEX FORMAT');
  }

  private detectCompression(filename: string, content: string): CompressionFormat {
    const ext = filename.toLowerCase();
    if (ext.endsWith('.gz') || ext.endsWith('.gzip')) return CompressionFormat.GZIP;
    if (ext.endsWith('.zip')) return CompressionFormat.ZIP;
    if (ext.endsWith('.crx') || ext.endsWith('.crx.gz') || content.includes('COMPACT RINEX FORMAT')) {
      return CompressionFormat.HATANAKA;
    }
    if (content.includes('COMPACT RINEX FORMAT')) return CompressionFormat.HATANAKA;
    return CompressionFormat.NONE;
  }

  private isCompactRinex(content: string): boolean {
    return content.includes('COMPACT RINEX FORMAT');
  }

  private extractCompactHeader(content: string): string {
    const lines = content.split('\n');
    const headerLines: string[] = [];
    for (const line of lines) {
      headerLines.push(line);
      if (line.includes('END OF HEADER')) break;
    }
    return headerLines.join('\n');
  }

  private detectFromHeader(content: string, filename: string): {
    format: FileFormat; version: string; category: FileCategory; satelliteSystem: string; constellations: string[];
  } {
    const lines = content.split('\n');
    let version = '';
    let category = FileCategory.OBSERVATION;
    let satelliteSystem = 'M';
    let format = FileFormat.RINEX_3;
    const constellations: string[] = [];

    for (const line of lines) {
      const label = line.substring(60).trim();

      if (label === 'RINEX VERSION / TYPE') {
        version = line.substring(0, 9).trim();
        const catChar = line.substring(20, 21).trim() || 'O';
        const sysChar = line.substring(40, 41).trim() || 'M';
        satelliteSystem = sysChar;
        category = this.mapCategoryChar(catChar);

        const verNum = parseFloat(version);
        if (verNum < 3) format = FileFormat.RINEX_2;
        else if (verNum >= 4) format = FileFormat.RINEX_4;
        else format = FileFormat.RINEX_3;
      }

      if (label === 'SYS / # / OBS TYPES') {
        const sys = line.substring(0, 3).trim();
        if (sys) {
          const sysName = this.systemLabel(sys);
          if (sysName && !constellations.includes(sysName)) {
            constellations.push(sysName);
          }
        }
      }

      if (label === 'SYS / # OF OBS') {
        const sys = line.charAt(0);
        if (/^[GRECJIS]$/.test(sys)) {
          const sysName = this.systemLabel(sys);
          if (sysName && !constellations.includes(sysName)) {
            constellations.push(sysName);
          }
        }
      }

      if (label === 'PRN / # OF OBS') {
        const prnCode = line.substring(0, 7).trim();
        if (/^[GRECJIS]/.test(prnCode)) {
          const sysName = this.systemLabel(prnCode.charAt(0));
          if (sysName && !constellations.includes(sysName)) {
            constellations.push(sysName);
          }
        }
      }
    }

    if (constellations.length === 0) {
      if (satelliteSystem === 'M') {
        constellations.push('GPS', 'GLONASS', 'Galileo', 'BeiDou');
      } else {
        const sysName = this.systemLabel(satelliteSystem);
        if (sysName) constellations.push(sysName);
      }
    }

    return { format, version, category, satelliteSystem, constellations };
  }

  private mapCategoryChar(c: string): FileCategory {
    const map: Record<string, FileCategory> = {
      'O': FileCategory.OBSERVATION, 'N': FileCategory.NAVIGATION_GPS,
      'G': FileCategory.NAVIGATION_GLONASS, 'M': FileCategory.METEOROLOGICAL,
      'C': FileCategory.CLOCK,
    };
    return map[c] || FileCategory.OBSERVATION;
  }

  private categoryLabel(cat: FileCategory): string {
    const labels: Record<FileCategory, string> = {
      [FileCategory.OBSERVATION]: 'Observación',
      [FileCategory.NAVIGATION_GPS]: 'Navegación GPS',
      [FileCategory.NAVIGATION_GLONASS]: 'Navegación GLONASS',
      [FileCategory.NAVIGATION]: 'Navegación',
      [FileCategory.METEOROLOGICAL]: 'Meteorológico',
      [FileCategory.CLOCK]: 'Reloj',
    };
    return labels[cat];
  }

  private systemLabel(sys: string): string {
    const map: Record<string, string> = {
      G: 'GPS', R: 'GLONASS', E: 'Galileo', C: 'BeiDou',
      J: 'QZSS', I: 'IRNSS', S: 'SBAS', M: 'Mixto',
    };
    return map[sys] || `Sistema ${sys}`;
  }
}
