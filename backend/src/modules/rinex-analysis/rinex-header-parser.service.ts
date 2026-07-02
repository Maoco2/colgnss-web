import { Injectable } from '@nestjs/common';

export interface RinexHeader {
  version: string;
  fileType: string;
  satelliteSystem: string;
  program: string;
  agency: string;
  creationDate: string;
  markerName: string;
  markerNumber: string;
  markerType: string;
  observer: string;
  receiverBrand: string;
  receiverModel: string;
  receiverSerial: string;
  receiverFirmware: string;
  antennaModel: string;
  antennaType: string;
  antennaSerial: string;
  antennaHeight: number;
  antennaDeltaN: number;
  antennaDeltaE: number;
  antennaDeltaH: number;
  approxX: number;
  approxY: number;
  approxZ: number;
  startTime: Date | null;
  endTime: Date | null;
  interval: number;
  obsTypes: Record<string, string[]>;
  numObsTypes: Record<string, number>;
  constellations: string[];
  signalUnit: string;
  leapSeconds: number;
  glonassSlot: Record<string, number>;
  glonassCodePhaseBias: string[];
  phaseShift: string[];
  sysPhaseShift: string[];
  scaleFactor: Record<string, number>;
  comments: string[];
  isRinex4: boolean;
  epochCount: number;
}

const RECEIVER_BRANDS: Record<string, string> = {
  trimble: 'Trimble', leica: 'Leica Geosystems', topcon: 'Topcon', chcnav: 'CHCNAV',
  hitarget: 'HiTarget', septentrio: 'Septentrio', novatel: 'NovAtel', ashtech: 'Ashtech',
  'spectra precision': 'Spectra Precision', hemisphere: 'Hemisphere', geomax: 'GeoMax',
  south: 'South', sokkia: 'Sokkia', javad: 'Javad', comnav: 'ComNav', emlid: 'Emlid',
  stonex: 'Stonex', 'trimble navigation': 'Trimble', 'leica geosystems': 'Leica Geosystems',
};

@Injectable()
export class RinexHeaderParserService {
  parse(content: string): RinexHeader {
    const lines = content.split('\n');
    const header: RinexHeader = this.emptyHeader();
    let headerEnd = lines.length;
    let isRinex4 = false;

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = raw.replace(/\r$/, '');
      const label = line.substring(60).trim();

      if (label === 'END OF HEADER') {
        headerEnd = i;
        break;
      }

      switch (label) {
        case 'RINEX VERSION / TYPE':
          header.version = line.substring(0, 9).trim();
          header.fileType = line.substring(20, 21).trim();
          header.satelliteSystem = line.substring(40, 41).trim() || 'M';
          isRinex4 = parseFloat(header.version) >= 4;
          header.isRinex4 = isRinex4;
          break;
        case 'PGM / RUN BY / DATE':
          header.program = line.substring(0, 20).trim();
          header.agency = line.substring(20, 40).trim();
          header.creationDate = line.substring(40, 60).trim();
          break;
        case 'MARKER NAME':
          header.markerName = line.substring(0, 60).trim();
          break;
        case 'MARKER NUMBER':
          header.markerNumber = line.substring(0, 20).trim();
          break;
        case 'MARKER TYPE':
          header.markerType = line.substring(0, 20).trim();
          break;
        case 'OBSERVER / AGENCY':
          header.observer = line.substring(0, 20).trim();
          header.agency = header.agency || line.substring(20, 40).trim();
          break;
        case 'REC # / TYPE / VERS':
          // Columns 0-20: REC # (serial), 20-40: TYPE (brand+model), 40-60: VERS (firmware)
          header.receiverSerial = line.substring(0, 20).trim();
          header.receiverModel = line.substring(20, 40).trim();
          header.receiverBrand = this.identifyBrand(header.receiverModel);
          header.receiverFirmware = line.substring(40, 60).trim();
          break;
        case 'ANT # / TYPE':
          // Columns 0-20: ANT # (serial), 20-40: TYPE (brand+model)
          header.antennaSerial = line.substring(0, 20).trim();
          header.antennaModel = line.substring(20, 40).trim();
          header.antennaType = line.substring(20, 40).trim();
          break;
        case 'ANTENNA: DELTA H/E/N':
          header.antennaHeight = parseFloat(line.substring(0, 14)) || 0;
          header.antennaDeltaE = parseFloat(line.substring(14, 28)) || 0;
          header.antennaDeltaN = parseFloat(line.substring(28, 42)) || 0;
          header.antennaDeltaH = parseFloat(line.substring(42, 56)) || 0;
          break;
        case 'APPROX POSITION XYZ':
          header.approxX = parseFloat(line.substring(0, 14)) || 0;
          header.approxY = parseFloat(line.substring(14, 28)) || 0;
          header.approxZ = parseFloat(line.substring(28, 42)) || 0;
          break;
        case 'TIME OF FIRST OBS':
          header.startTime = this.parseRinexTime(line);
          break;
        case 'TIME OF LAST OBS':
          header.endTime = this.parseRinexTime(line);
          break;
        case 'INTERVAL':
          header.interval = parseFloat(line.substring(0, 10)) || 0;
          break;
        case 'SYS / # / OBS TYPES':
          if (isRinex4 || parseFloat(header.version) >= 3) {
            const sys = line.substring(0, 3).trim();
            const count = parseInt(line.substring(3, 6)) || 0;
            const types = line.substring(7, 60).trim().split(/\s+/).filter(Boolean);
            if (sys && count > 0) {
              header.obsTypes[sys] = [...(header.obsTypes[sys] || []), ...types];
              header.numObsTypes[sys] = (header.numObsTypes[sys] || 0) + count;
              const sysName = this.sysLabel(sys);
              if (sysName && !header.constellations.includes(sysName)) {
                header.constellations.push(sysName);
              }
            }
          }
          break;
        case '# / TYPES OF OBSERV':
          if (!isRinex4 && parseFloat(header.version) < 3) {
            const count = parseInt(line.substring(0, 6)) || 0;
            const types = line.substring(6, 60).trim().split(/\s+/).filter(Boolean);
            if (count > 0) {
              header.obsTypes['M'] = [...(header.obsTypes['M'] || []), ...types];
            }
          }
          break;
        case 'SYS / # OF OBS':
          // RINEX 3.x: col 0 = letra del sistema (G, R, E, C, ...)
          {
            const sys = line.charAt(0);
            if (/^[GRECJIS]$/.test(sys)) {
              const sysLabel = this.sysLabel(sys);
              if (sysLabel && !header.constellations.includes(sysLabel)) {
                header.constellations.push(sysLabel);
              }
            }
          }
          break;
        case 'PRN / # OF OBS':
          // Detect constellations from PRN prefixes: col 0-7 contiene "G 1", "G10", "R10", etc.
          // V2 format sin letra (solo números: "   1") se ignora.
          const prnCode = line.substring(0, 7).trim();
          if (/^[GRECJIS]/.test(prnCode)) {
            const sysLabel = this.sysLabel(prnCode.charAt(0));
            if (sysLabel && !header.constellations.includes(sysLabel)) {
              header.constellations.push(sysLabel);
            }
          }
          break;
        case 'SIGNAL STRENGTH UNIT':
          header.signalUnit = line.substring(0, 20).trim();
          break;
        case 'GLONASS SLOT / FREQ':
          if (!header.glonassSlot) header.glonassSlot = {};
          const slotPart = line.substring(0, 3).trim();
          const freqPart = line.substring(3, 7).trim();
          if (slotPart) header.glonassSlot[slotPart] = parseInt(freqPart) || 0;
          break;
        case 'GLONASS COD/PHS/BIS':
          header.glonassCodePhaseBias.push(line.substring(0, 60).trim());
          break;
        case 'LEAP SECONDS':
          header.leapSeconds = parseInt(line.substring(0, 6)) || 0;
          break;
        case 'PHASE SHIFT':
          header.phaseShift.push(line.substring(0, 60).trim());
          break;
        case 'SYS / PHASE SHIFT':
          header.sysPhaseShift.push(line.substring(0, 60).trim());
          break;
        case 'SCALE FACTOR':
          const sfSys = line.substring(0, 3).trim();
          const sfVal = parseFloat(line.substring(3, 10)) || 1;
          header.scaleFactor[sfSys || 'M'] = sfVal;
          break;
        case 'COMMENT':
          header.comments.push(line.substring(0, 60).trim());
          break;
      }
    }

    if (header.constellations.length === 0 && header.satelliteSystem) {
      const sysName = this.sysLabel(header.satelliteSystem);
      if (sysName && sysName !== 'Mixto') {
        header.constellations.push(sysName);
      }
      if (header.satelliteSystem === 'M') {
        header.constellations.push('GPS', 'GLONASS', 'Galileo', 'BeiDou');
      }
    }

    if (header.startTime && !header.endTime) {
      const epochLines = this.findEpochCount(lines, headerEnd);
      header.epochCount = epochLines;
    }

    return header;
  }

  private emptyHeader(): RinexHeader {
    return {
      version: '', fileType: '', satelliteSystem: '', program: '', agency: '', creationDate: '',
      markerName: '', markerNumber: '', markerType: '', observer: '',
      receiverBrand: '', receiverModel: '', receiverSerial: '', receiverFirmware: '',
      antennaModel: '', antennaType: '', antennaSerial: '',
      antennaHeight: 0, antennaDeltaN: 0, antennaDeltaE: 0, antennaDeltaH: 0,
      approxX: 0, approxY: 0, approxZ: 0,
      startTime: null, endTime: null, interval: 0,
      obsTypes: {}, numObsTypes: {}, constellations: [],
      signalUnit: '', leapSeconds: 0, glonassSlot: {},
      glonassCodePhaseBias: [], phaseShift: [], sysPhaseShift: [],
      scaleFactor: {}, comments: [], isRinex4: false, epochCount: 0,
    };
  }

  private identifyBrand(raw: string): string {
    const lower = raw.toLowerCase();
    for (const [key, brand] of Object.entries(RECEIVER_BRANDS)) {
      if (lower.includes(key)) return brand;
    }
    const firstWord = raw.split(/[\s,]+/)[0];
    if (firstWord && firstWord.length > 2) return firstWord;
    return 'Fabricante no identificado';
  }

  private parseRinexTime(line: string): Date | null {
    const parts = line.substring(0, 43).trim().split(/\s+/).filter(Boolean);
    if (parts.length < 6) return null;
    const [year, month, day, hour, min] = parts.map(Number);
    const sec = parseFloat(parts[5]) || 0;
    const y = year < 80 ? 2000 + year : year < 100 ? 1900 + year : year;
    return new Date(Date.UTC(y, month - 1, day, hour, min, Math.floor(sec), Math.round((sec % 1) * 1000)));
  }

  private findEpochCount(lines: string[], headerEnd: number): number {
    let count = 0;
    for (let i = headerEnd + 1; i < lines.length && count < 10000; i++) {
      const line = lines[i];
      if (line.startsWith('> ') || /^\d{4}\s/.test(line.trim())) count++;
    }
    return count;
  }

  private sysLabel(sys: string): string {
    const map: Record<string, string> = {
      G: 'GPS', R: 'GLONASS', E: 'Galileo', C: 'BeiDou',
      J: 'QZSS', I: 'IRNSS', S: 'SBAS', M: 'Mixto',
    };
    return map[sys] || sys;
  }
}
