import { Injectable } from '@nestjs/common';

export interface AntennaInfo {
  brand: string;
  model: string;
  radome: string;
  type: string;
  application: string;
  frequencies: string[];
}

@Injectable()
export class AntennaCatalogService {
  private readonly catalog: Map<string, AntennaInfo>;

  constructor() {
    this.catalog = new Map(Object.entries(ANTENNA_CATALOG));
  }

  identify(rawModel: string, rawType?: string): { model: string; radome: string; info: AntennaInfo | null } {
    const cleaned = rawModel.trim();
    const upper = cleaned.toUpperCase();

    for (const [key, info] of this.catalog) {
      if (upper.startsWith(key) || upper.includes(key)) {
        return { model: cleaned, radome: rawType?.trim() || info.radome, info };
      }
    }

    return { model: cleaned, radome: rawType?.trim() || 'N/A', info: null };
  }
}

const ANTENNA_CATALOG: Record<string, AntennaInfo> = {
  'LEIAR25': {
    brand: 'Leica Geosystems', model: 'AR25', radome: 'LEIT',
    type: 'Geodésica (Choke Ring)', application: 'Estaciones de referencia permanentes',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2/L3', 'Galileo E1/E5a/E5b/E6', 'BeiDou B1/B2/B3', 'QZSS L1/L2/L5', 'IRNSS L5'],
  },
  'LEIAR20': {
    brand: 'Leica Geosystems', model: 'AR20', radome: 'LEIT',
    type: 'Geodésica (Choke Ring)', application: 'Estaciones de referencia permanentes',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2', 'Galileo E1/E5a/E5b', 'BeiDou B1/B2/B3'],
  },
  'LEIAT504GG': {
    brand: 'Leica Geosystems', model: 'AT504GG', radome: 'LEIS',
    type: 'Geodésica', application: 'Topografía, redes de referencia móviles',
    frequencies: ['GPS L1/L2', 'GLONASS L1/L2'],
  },
  'LEIAT503': {
    brand: 'Leica Geosystems', model: 'AT503', radome: 'LEIS',
    type: 'Geodésica', application: 'Topografía, monitoreo de deformaciones',
    frequencies: ['GPS L1/L2', 'GLONASS L1/L2'],
  },
  'LEIAR10': {
    brand: 'Leica Geosystems', model: 'AR10', radome: 'LEIT',
    type: 'Geodésica (Choke Ring)', application: 'Estaciones de referencia permanentes',
    frequencies: ['GPS L1/L2', 'GLONASS L1/L2', 'Galileo E1/E5a'],
  },
  'LEIAT502': {
    brand: 'Leica Geosystems', model: 'AT502', radome: 'LEIS',
    type: 'Geodésica', application: 'Topografía de precisión',
    frequencies: ['GPS L1/L2'],
  },
  'LEIAT501': {
    brand: 'Leica Geosystems', model: 'AT501', radome: 'LEIS',
    type: 'Geodésica', application: 'Topografía',
    frequencies: ['GPS L1/L2'],
  },
  'LEIAR25.R3': {
    brand: 'Leica Geosystems', model: 'AR25.R3', radome: 'LEIT',
    type: 'Geodésica (Choke Ring)', application: 'Estaciones de referencia, investigación',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2/L3', 'Galileo E1/E5a/E5b/E6', 'BeiDou B1/B2/B3', 'QZSS L1/L2/L5'],
  },
  'LEIAT504': {
    brand: 'Leica Geosystems', model: 'AT504', radome: 'LEIS',
    type: 'Geodésica', application: 'Topografía RTK de alta precisión',
    frequencies: ['GPS L1/L2', 'GLONASS L1/L2'],
  },
  'LEIAT504_LEIS': {
    brand: 'Leica Geosystems', model: 'AT504', radome: 'LEIS',
    type: 'Geodésica', application: 'Topografía RTK',
    frequencies: ['GPS L1/L2', 'GLONASS L1/L2'],
  },
  'TRM59800': {
    brand: 'Trimble', model: 'GNSS Choke Ring (59800)', radome: 'TRM',
    type: 'Geodésica (Choke Ring)', application: 'Estaciones CORS, referencia permanente',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2/L3', 'Galileo E1/E5a/E5b/E6', 'BeiDou B1/B2/B3', 'QZSS L1/L2/L5'],
  },
  'TRM57971': {
    brand: 'Trimble', model: 'Zephyr Geodetic 2 (57971)', radome: 'TRM',
    type: 'Geodésica', application: 'Estaciones de referencia, topografía',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2'],
  },
  'TRM55971': {
    brand: 'Trimble', model: 'Zephyr Geodetic (55971)', radome: 'TRM',
    type: 'Geodésica', application: 'Estaciones de referencia, topografía',
    frequencies: ['GPS L1/L2', 'GLONASS L1/L2'],
  },
  'TRM41249': {
    brand: 'Trimble', model: 'Compact L1/L2 (41249)', radome: 'TRM',
    type: 'Geodésica compacta', application: 'Topografía móvil, rover',
    frequencies: ['GPS L1/L2'],
  },
  'TRM2965': {
    brand: 'Trimble', model: 'Choke Ring (2965)', radome: 'TRM',
    type: 'Geodésica (Choke Ring)', application: 'Estaciones de referencia históricas',
    frequencies: ['GPS L1/L2'],
  },
  'TRM22020': {
    brand: 'Trimble', model: 'Zephyr (22020)', radome: 'TRM',
    type: 'Geodésica', application: 'Topografía, rover',
    frequencies: ['GPS L1/L2'],
  },
  'TRM115000': {
    brand: 'Trimble', model: 'Rover (115000)', radome: 'TRM',
    type: 'Compacta', application: 'Receptores Trimble R-series',
    frequencies: ['GPS L1/L2', 'GLONASS L1/L2'],
  },
  'TPSCR.G5': {
    brand: 'Topcon', model: 'CR-G5', radome: 'TPSH',
    type: 'Geodésica (Choke Ring)', application: 'Estaciones de referencia permanentes, monitoreo',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2/L3', 'Galileo E1/E5a/E5b/E6', 'BeiDou B1/B2/B3'],
  },
  'TPSCR.G3': {
    brand: 'Topcon', model: 'CR-G3', radome: 'TPSH',
    type: 'Geodésica (Choke Ring)', application: 'Estaciones de referencia, redes geodésicas',
    frequencies: ['GPS L1/L2', 'GLONASS L1/L2', 'Galileo E1/E5a'],
  },
  'TPSH.R3': {
    brand: 'Topcon', model: 'HiPer SH', radome: 'TPSH',
    type: 'Geodésica compacta', application: 'Receptores Topcon HiPer, rover RTK',
    frequencies: ['GPS L1/L2', 'GLONASS L1/L2', 'Galileo E1/E5a'],
  },
  'TPSH.G5A1': {
    brand: 'Topcon', model: 'HiPer SH G5', radome: 'TPSH',
    type: 'Geodésica compacta', application: 'Receptores Topcon HiPer, rover RTK',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2/L3', 'Galileo E1/E5a/E5b'],
  },
  'TPPG.A1': {
    brand: 'Topcon', model: 'PG-A1', radome: 'TPPG',
    type: 'Geodésica', application: 'Estaciones de referencia Topcon Net-G5',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2/L3', 'Galileo E1/E5a/E5b/E6', 'BeiDou B1/B2/B3'],
  },
  'NOV702': {
    brand: 'NovAtel', model: 'GPS-702', radome: 'NOV',
    type: 'Geodésica (Pinwheel)', application: 'Estaciones de referencia, topografía',
    frequencies: ['GPS L1/L2', 'GLONASS L1/L2'],
  },
  'NOV703': {
    brand: 'NovAtel', model: 'GPS-703', radome: 'NOV',
    type: 'Geodésica (Pinwheel)', application: 'Estaciones de referencia',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2/L3'],
  },
  'NOV704': {
    brand: 'NovAtel', model: 'GPS-704', radome: 'NOV',
    type: 'Geodésica (Choke Ring)', application: 'Estaciones CORS, referencia permanente',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2/L3', 'Galileo E1/E5a/E5b', 'BeiDou B1/B2'],
  },
  'SEPCHOKE_MC': {
    brand: 'Septentrio', model: 'Choke Ring MC', radome: 'SEP',
    type: 'Geodésica (Choke Ring)', application: 'Estaciones de referencia Septentrio',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2/L3', 'Galileo E1/E5a/E5b/E6', 'BeiDou B1/B2/B3'],
  },
  'SEPANT20': {
    brand: 'Septentrio', model: 'Antenna 20', radome: 'SEP',
    type: 'Geodésica compacta', application: 'Receptores móviles Septentrio',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2/L3', 'Galileo E1/E5a/E5b'],
  },
  'HITGT V30': {
    brand: 'HiTarget', model: 'V30 Antenna', radome: 'HITGT',
    type: 'Geodésica compacta', application: 'Receptores HiTarget V30',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2/L3', 'Galileo E1/E5a/E5b'],
  },
  'SOK_R3': {
    brand: 'Sokkia', model: 'R3', radome: 'SOK',
    type: 'Geodésica compacta', application: 'Receptores Sokkia GRX',
    frequencies: ['GPS L1/L2', 'GLONASS L1/L2'],
  },
  'CHCC 5G': {
    brand: 'CHCNAV', model: '5G Antenna', radome: 'CHCC',
    type: 'Geodésica compacta', application: 'Receptores CHCNAV i90/X91',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2/L3', 'Galileo E1/E5a/E5b', 'BeiDou B1/B2/B3'],
  },
  'ASHTECH700936': {
    brand: 'Ashtech', model: '700936', radome: 'ASH',
    type: 'Geodésica (Dorne Margolin)', application: 'Estaciones de referencia históricas',
    frequencies: ['GPS L1/L2'],
  },
  'ASHTECH700929': {
    brand: 'Ashtech', model: '700929', radome: 'ASH',
    type: 'Geodésica (Dorne Margolin)', application: 'Estaciones de referencia históricas',
    frequencies: ['GPS L1/L2'],
  },
  'JAVRINGANT_DM': {
    brand: 'Javad', model: 'RingAnt DM', radome: 'JAV',
    type: 'Geodésica (Choke Ring)', application: 'Estaciones de referencia Javad',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2/L3', 'Galileo E1/E5a/E5b', 'BeiDou B1/B2/B3'],
  },
  'JAVGRANT_G5T': {
    brand: 'Javad', model: 'GrAnt G5T', radome: 'JAV',
    type: 'Geodésica (Choke Ring)', application: 'Estaciones de referencia, monitoreo',
    frequencies: ['GPS L1/L2/L5', 'GLONASS L1/L2/L3', 'Galileo E1/E5a/E5b/E6', 'BeiDou B1/B2/B3'],
  },
};
