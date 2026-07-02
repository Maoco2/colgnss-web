import { Injectable } from '@nestjs/common';

export interface ReceiverInfo {
  brand: string;
  model: string;
  family: string;
  manufacturer: string;
  year: number;
  type: string;
  maxConstellations: number;
  frequencies: string[];
  recommendedUse: string;
}

@Injectable()
export class ReceiverCatalogService {
  private readonly catalog: Map<string, ReceiverInfo>;

  constructor() {
    this.catalog = new Map(Object.entries(RECEIVER_CATALOG));
  }

  identify(raw: string): { brand: string; model: string; info: ReceiverInfo | null } {
    const cleaned = raw.trim();
    const lower = cleaned.toLowerCase();

    for (const [key, info] of this.catalog) {
      if (lower.includes(key.toLowerCase())) {
        return { brand: info.brand, model: cleaned, info };
      }
    }

    const brand = this.guessBrand(cleaned);
    return { brand, model: cleaned, info: null };
  }

  private guessBrand(raw: string): string {
    const lower = raw.toLowerCase();
    const brands: [string, string][] = [
      ['trimble', 'Trimble'], ['leica', 'Leica Geosystems'], ['topcon', 'Topcon'],
      ['septentrio', 'Septentrio'], ['novatel', 'NovAtel'], ['chcnav', 'CHCNAV'],
      ['hitarget', 'HiTarget'], ['geomax', 'GeoMax'], ['hemisphere', 'Hemisphere'],
      ['ashtech', 'Ashtech'], ['south', 'South'], ['javad', 'Javad'],
      ['comnav', 'ComNav'], ['emlid', 'Emlid'], ['sokkia', 'Sokkia'],
      ['stonex', 'Stonex'], ['ublox', 'u-blox'],
    ];
    for (const [key, label] of brands) {
      if (lower.includes(key)) return label;
    }
    return raw.split(/[\s,]+/)[0] || 'Fabricante no identificado';
  }
}

const RECEIVER_CATALOG: Record<string, ReceiverInfo> = {
  'LEICA GR50': {
    brand: 'Leica Geosystems', model: 'GR50', family: 'Receptor permanente',
    manufacturer: 'Leica Geosystems AG', year: 2015, type: 'Permanente / Geodésico',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Estaciones de monitoreo continuo, redes GNSS permanentes',
  },
  'LEICA GR30': {
    brand: 'Leica Geosystems', model: 'GR30', family: 'Receptor permanente',
    manufacturer: 'Leica Geosystems AG', year: 2013, type: 'Permanente / Geodésico',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'B1', 'B2'],
    recommendedUse: 'Redes GNSS permanentes, monitoreo de deformaciones',
  },
  'LEICA GR10': {
    brand: 'Leica Geosystems', model: 'GR10', family: 'Receptor permanente',
    manufacturer: 'Leica Geosystems AG', year: 2013, type: 'Permanente / Geodésico',
    maxConstellations: 4, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a'],
    recommendedUse: 'Redes GNSS locales, estaciones de referencia',
  },
  'LEICA GS18': {
    brand: 'Leica Geosystems', model: 'GS18', family: 'Receptor RTK',
    manufacturer: 'Leica Geosystems AG', year: 2018, type: 'RTK / Móvil',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Levantamientos RTK, catastrales, topografía general',
  },
  'LEICA GS16': {
    brand: 'Leica Geosystems', model: 'GS16', family: 'Receptor RTK',
    manufacturer: 'Leica Geosystems AG', year: 2015, type: 'RTK / Móvil',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Topografía RTK, levantamientos GNSS',
  },
  'LEICA GS15': {
    brand: 'Leica Geosystems', model: 'GS15', family: 'Receptor RTK',
    manufacturer: 'Leica Geosystems AG', year: 2011, type: 'RTK / Móvil',
    maxConstellations: 4, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a'],
    recommendedUse: 'Topografía RTK, replanteo, navegación',
  },
  'LEICA VIVA GS10': {
    brand: 'Leica Geosystems', model: 'Viva GS10', family: 'Receptor RTK',
    manufacturer: 'Leica Geosystems AG', year: 2009, type: 'RTK / Móvil',
    maxConstellations: 4, frequencies: ['L1', 'L2', 'L5'],
    recommendedUse: 'Topografía RTK, Smartpole',
  },
  'LEICA VIVA GS08': {
    brand: 'Leica Geosystems', model: 'Viva GS08', family: 'Receptor RTK',
    manufacturer: 'Leica Geosystems AG', year: 2009, type: 'RTK / Móvil',
    maxConstellations: 3, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía RTK básica',
  },
  'LEICA GRX1200+': {
    brand: 'Leica Geosystems', model: 'GRX1200+', family: 'Receptor permanente',
    manufacturer: 'Leica Geosystems AG', year: 2008, type: 'Permanente / Geodésico',
    maxConstellations: 3, frequencies: ['L1', 'L2'],
    recommendedUse: 'Estaciones de referencia, redes geodésicas',
  },
  'LEICA GRX1200': {
    brand: 'Leica Geosystems', model: 'GRX1200', family: 'Receptor permanente',
    manufacturer: 'Leica Geosystems AG', year: 2005, type: 'Permanente / Geodésico',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Estaciones de referencia GPS',
  },
  'LEICA GPS1200+': {
    brand: 'Leica Geosystems', model: 'GPS1200+', family: 'Receptor RTK',
    manufacturer: 'Leica Geosystems AG', year: 2007, type: 'RTK / Móvil',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía GPS RTK',
  },
  'LEICA SR530': {
    brand: 'Leica Geosystems', model: 'SR530', family: 'Receptor geodésico',
    manufacturer: 'Leica Geosystems AG', year: 2002, type: 'Geodésico',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Levantamientos geodésicos estáticos',
  },
  'LEICA SR520': {
    brand: 'Leica Geosystems', model: 'SR520', family: 'Receptor geodésico',
    manufacturer: 'Leica Geosystems AG', year: 2000, type: 'Geodésico',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Levantamientos geodésicos estáticos',
  },
  'LEICA MC1000': {
    brand: 'Leica Geosystems', model: 'MC1000', family: 'Receptor geodésico',
    manufacturer: 'Leica Geosystems AG', year: 1998, type: 'Geodésico',
    maxConstellations: 1, frequencies: ['L1'],
    recommendedUse: 'Monitoreo de deformaciones',
  },
  'LEICA MX412': {
    brand: 'Leica Geosystems', model: 'MX412', family: 'Receptor de navegación',
    manufacturer: 'Leica Geosystems AG', year: 1997, type: 'Navegación',
    maxConstellations: 1, frequencies: ['L1'],
    recommendedUse: 'Navegación marina',
  },
  'LEICA SR9400': {
    brand: 'Leica Geosystems', model: 'SR9400', family: 'Receptor geodésico',
    manufacturer: 'Leica Geosystems AG', year: 1996, type: 'Geodésico',
    maxConstellations: 1, frequencies: ['L1'],
    recommendedUse: 'Levantamientos GPS estáticos',
  },
  'TRIMBLE NETR9': {
    brand: 'Trimble', model: 'NetR9', family: 'Receptor permanente',
    manufacturer: 'Trimble Navigation Ltd.', year: 2011, type: 'Permanente / Geodésico',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Estaciones de referencia permanentes, redes geodésicas',
  },
  'TRIMBLE NETR8': {
    brand: 'Trimble', model: 'NetR8', family: 'Receptor permanente',
    manufacturer: 'Trimble Navigation Ltd.', year: 2009, type: 'Permanente / Geodésico',
    maxConstellations: 3, frequencies: ['L1', 'L2', 'L5'],
    recommendedUse: 'Estaciones de referencia, redes geodésicas',
  },
  'TRIMBLE ALLOY': {
    brand: 'Trimble', model: 'Alloy', family: 'Receptor permanente',
    manufacturer: 'Trimble Navigation Ltd.', year: 2018, type: 'Permanente / Geodésico',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Estaciones CORS, redes RTK, investigación',
  },
  'TRIMBLE R10': {
    brand: 'Trimble', model: 'R10', family: 'Receptor RTK',
    manufacturer: 'Trimble Navigation Ltd.', year: 2014, type: 'RTK / Móvil',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Topografía RTK, catastral, construcción',
  },
  'TRIMBLE R12': {
    brand: 'Trimble', model: 'R12', family: 'Receptor RTK',
    manufacturer: 'Trimble Navigation Ltd.', year: 2019, type: 'RTK / Móvil',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Topografía RTK de alta precisión, prospección',
  },
  'TRIMBLE R8': {
    brand: 'Trimble', model: 'R8', family: 'Receptor RTK',
    manufacturer: 'Trimble Navigation Ltd.', year: 2007, type: 'RTK / Móvil',
    maxConstellations: 3, frequencies: ['L1', 'L2', 'L5'],
    recommendedUse: 'Topografía RTK, replanteo',
  },
  'TRIMBLE R7': {
    brand: 'Trimble', model: 'R7', family: 'Receptor geodésico',
    manufacturer: 'Trimble Navigation Ltd.', year: 2005, type: 'Geodésico / RTK',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Levantamientos geodésicos, RTK',
  },
  'TRIMBLE R6': {
    brand: 'Trimble', model: 'R6', family: 'Receptor RTK',
    manufacturer: 'Trimble Navigation Ltd.', year: 2006, type: 'RTK / Móvil',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía RTK',
  },
  'TRIMBLE R4': {
    brand: 'Trimble', model: 'R4', family: 'Receptor RTK',
    manufacturer: 'Trimble Navigation Ltd.', year: 2008, type: 'RTK / Móvil',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía RTK básica',
  },
  'TRIMBLE 5700': {
    brand: 'Trimble', model: '5700', family: 'Receptor geodésico',
    manufacturer: 'Trimble Navigation Ltd.', year: 2002, type: 'Geodésico',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Levantamientos geodésicos estáticos',
  },
  'TRIMBLE 5800': {
    brand: 'Trimble', model: '5800', family: 'Receptor RTK',
    manufacturer: 'Trimble Navigation Ltd.', year: 2004, type: 'RTK / Móvil',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía RTK',
  },
  'TRIMBLE 4000SSI': {
    brand: 'Trimble', model: '4000SSI', family: 'Receptor geodésico',
    manufacturer: 'Trimble Navigation Ltd.', year: 1996, type: 'Geodésico',
    maxConstellations: 1, frequencies: ['L1', 'L2'],
    recommendedUse: 'Redes geodésicas, monitoreo',
  },
  'TRIMBLE 4700': {
    brand: 'Trimble', model: '4700', family: 'Receptor geodésico',
    manufacturer: 'Trimble Navigation Ltd.', year: 1997, type: 'Geodésico',
    maxConstellations: 1, frequencies: ['L1', 'L2'],
    recommendedUse: 'Levantamientos geodésicos de precisión',
  },
  'SEPTENTRIO POLARX5': {
    brand: 'Septentrio', model: 'PolaRx5', family: 'Receptor permanente',
    manufacturer: 'Septentrio NV', year: 2017, type: 'Permanente / Geodésico',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Estaciones de referencia, investigación científica',
  },
  'SEPTENTRIO POLARX4': {
    brand: 'Septentrio', model: 'PolaRx4', family: 'Receptor permanente',
    manufacturer: 'Septentrio NV', year: 2013, type: 'Permanente / Geodésico',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Estaciones de referencia, ionosfera',
  },
  'SEPTENTRIO POLARX3': {
    brand: 'Septentrio', model: 'PolaRx3', family: 'Receptor permanente',
    manufacturer: 'Septentrio NV', year: 2009, type: 'Permanente / Geodésico',
    maxConstellations: 3, frequencies: ['L1', 'L2'],
    recommendedUse: 'Estaciones de referencia GPS/Galileo',
  },
  'SEPTENTRIO POLARX2': {
    brand: 'Septentrio', model: 'PolaRx2', family: 'Receptor permanente',
    manufacturer: 'Septentrio NV', year: 2006, type: 'Permanente / Geodésico',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Estaciones de referencia',
  },
  'SEPTENTRIO POLARX': {
    brand: 'Septentrio', model: 'PolaRx', family: 'Receptor permanente',
    manufacturer: 'Septentrio NV', year: 2003, type: 'Permanente / Geodésico',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Estaciones de referencia',
  },
  'SEPTENTRIO ASTERX4': {
    brand: 'Septentrio', model: 'AsteRx4', family: 'Receptor OEM',
    manufacturer: 'Septentrio NV', year: 2018, type: 'OEM / Embebido',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Integración en drones, vehículos autónomos',
  },
  'SEPTENTRIO ASTERX3': {
    brand: 'Septentrio', model: 'AsteRx3', family: 'Receptor OEM',
    manufacturer: 'Septentrio NV', year: 2015, type: 'OEM / Embebido',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Integración en robótica, drones',
  },
  'NOVATEL OEM7': {
    brand: 'NovAtel', model: 'OEM7', family: 'Receptor OEM',
    manufacturer: 'NovAtel Inc. (Hexagon)', year: 2017, type: 'OEM / Embebido',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Integración en sistemas de posicionamiento',
  },
  'NOVATEL OEM6': {
    brand: 'NovAtel', model: 'OEM6', family: 'Receptor OEM',
    manufacturer: 'NovAtel Inc. (Hexagon)', year: 2013, type: 'OEM / Embebido',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Integración en sistemas de navegación',
  },
  'NOVATEL OEM628': {
    brand: 'NovAtel', model: 'OEM628', family: 'Receptor OEM',
    manufacturer: 'NovAtel Inc. (Hexagon)', year: 2012, type: 'OEM / Embebido',
    maxConstellations: 3, frequencies: ['L1', 'L2'],
    recommendedUse: 'Integración en sistemas de referencia',
  },
  'NOVATEL PROPAK6': {
    brand: 'NovAtel', model: 'ProPak6', family: 'Receptor portátil',
    manufacturer: 'NovAtel Inc. (Hexagon)', year: 2015, type: 'Portátil / Geodésico',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Topografía, prospección, marine',
  },
  'NOVATEL PROPAK7': {
    brand: 'NovAtel', model: 'ProPak7', family: 'Receptor portátil',
    manufacturer: 'NovAtel Inc. (Hexagon)', year: 2019, type: 'Portátil / Geodésico',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Topografía avanzada, referencia móvil',
  },
  'NOVATEL SPAN': {
    brand: 'NovAtel', model: 'SPAN', family: 'INS/GNSS',
    manufacturer: 'NovAtel Inc. (Hexagon)', year: 2010, type: 'INS / GNSS',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5'],
    recommendedUse: 'Navegación inercial integrada, vehículos autónomos',
  },
  'TOPCON NETG5': {
    brand: 'Topcon', model: 'Net-G5', family: 'Receptor permanente',
    manufacturer: 'Topcon Corporation', year: 2018, type: 'Permanente / Geodésico',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Estaciones CORS, redes de monitoreo',
  },
  'TOPCON NETG3A': {
    brand: 'Topcon', model: 'Net-G3A', family: 'Receptor permanente',
    manufacturer: 'Topcon Corporation', year: 2012, type: 'Permanente / Geodésico',
    maxConstellations: 4, frequencies: ['L1', 'L2', 'L5'],
    recommendedUse: 'Estaciones de referencia, redes locales',
  },
  'TOPCON GR5': {
    brand: 'Topcon', model: 'GR5', family: 'Receptor RTK',
    manufacturer: 'Topcon Corporation', year: 2015, type: 'RTK / Móvil',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Topografía RTK, catastral',
  },
  'TOPCON GR3': {
    brand: 'Topcon', model: 'GR3', family: 'Receptor RTK',
    manufacturer: 'Topcon Corporation', year: 2011, type: 'RTK / Móvil',
    maxConstellations: 3, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía RTK',
  },
  'TOPCON HIPER V': {
    brand: 'Topcon', model: 'HiPer V', family: 'Receptor RTK',
    manufacturer: 'Topcon Corporation', year: 2019, type: 'RTK / Móvil',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Topografía RTK de alta precisión',
  },
  'TOPCON HIPER II': {
    brand: 'Topcon', model: 'HiPer II', family: 'Receptor RTK',
    manufacturer: 'Topcon Corporation', year: 2005, type: 'RTK / Móvil',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía RTK básica',
  },
  'TOPCON HIPER HR': {
    brand: 'Topcon', model: 'HiPer HR', family: 'Receptor RTK',
    manufacturer: 'Topcon Corporation', year: 2014, type: 'RTK / Móvil',
    maxConstellations: 4, frequencies: ['L1', 'L2', 'L5'],
    recommendedUse: 'Topografía RTK',
  },
  'TOPCON LEGACY': {
    brand: 'Topcon', model: 'Legacy', family: 'Receptor RTK',
    manufacturer: 'Topcon Corporation', year: 2003, type: 'RTK / Móvil',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía RTK básica',
  },
  'TOPCON GB1000': {
    brand: 'Topcon', model: 'GB-1000', family: 'Receptor permanente',
    manufacturer: 'Topcon Corporation', year: 2008, type: 'Permanente / Geodésico',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Estaciones de referencia, monitoreo',
  },
  'CHCNAV I90': {
    brand: 'CHCNAV', model: 'i90', family: 'Receptor RTK',
    manufacturer: 'CHC Navigation', year: 2017, type: 'RTK / Móvil',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Topografía RTK, catastral',
  },
  'CHCNAV X91': {
    brand: 'CHCNAV', model: 'X91', family: 'Receptor RTK',
    manufacturer: 'CHC Navigation', year: 2020, type: 'RTK / Móvil',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Topografía RTK avanzada',
  },
  'CHCNAV LANDSTAR': {
    brand: 'CHCNAV', model: 'LandStar', family: 'Receptor RTK',
    manufacturer: 'CHC Navigation', year: 2018, type: 'RTK / Móvil',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Topografía RTK',
  },
  'CHCNAV X900': {
    brand: 'CHCNAV', model: 'X900', family: 'Receptor RTK',
    manufacturer: 'CHC Navigation', year: 2014, type: 'RTK / Móvil',
    maxConstellations: 4, frequencies: ['L1', 'L2', 'L5'],
    recommendedUse: 'Topografía RTK básica',
  },
  'HITARGET V30': {
    brand: 'HiTarget', model: 'V30', family: 'Receptor RTK',
    manufacturer: 'HiTarget Navigation', year: 2019, type: 'RTK / Móvil',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Topografía RTK, catastral, construcción',
  },
  'HITARGET HD V2': {
    brand: 'HiTarget', model: 'HD V2', family: 'Receptor RTK',
    manufacturer: 'HiTarget Navigation', year: 2016, type: 'RTK / Móvil',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Topografía RTK',
  },
  'HITARGET HD580': {
    brand: 'HiTarget', model: 'HD580', family: 'Receptor RTK',
    manufacturer: 'HiTarget Navigation', year: 2013, type: 'RTK / Móvil',
    maxConstellations: 3, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía RTK básica',
  },
  'HITARGET H32': {
    brand: 'HiTarget', model: 'H32', family: 'Receptor RTK',
    manufacturer: 'HiTarget Navigation', year: 2011, type: 'RTK / Móvil',
    maxConstellations: 3, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía RTK',
  },
  'GEOMAX ZENITH25': {
    brand: 'GeoMax', model: 'Zenith25', family: 'Receptor RTK',
    manufacturer: 'GeoMax AG (Hexagon)', year: 2017, type: 'RTK / Móvil',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Topografía RTK, construcción, catastral',
  },
  'GEOMAX ZENITH20': {
    brand: 'GeoMax', model: 'Zenith20', family: 'Receptor RTK',
    manufacturer: 'GeoMax AG (Hexagon)', year: 2014, type: 'RTK / Móvil',
    maxConstellations: 4, frequencies: ['L1', 'L2', 'L5'],
    recommendedUse: 'Topografía RTK, replanteo',
  },
  'HEMISPHERE S631': {
    brand: 'Hemisphere', model: 'S631', family: 'Receptor GNSS',
    manufacturer: 'Hemisphere GNSS Inc.', year: 2020, type: 'Compacto / Móvil',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Navegación marina, agricultura de precisión',
  },
  'HEMISPHERE S321': {
    brand: 'Hemisphere', model: 'S321', family: 'Receptor GNSS',
    manufacturer: 'Hemisphere GNSS Inc.', year: 2017, type: 'Compacto / Móvil',
    maxConstellations: 3, frequencies: ['L1', 'L2'],
    recommendedUse: 'Navegación, agricultura de precisión',
  },
  'HEMISPHERE A31': {
    brand: 'Hemisphere', model: 'A31', family: 'Receptor GNSS',
    manufacturer: 'Hemisphere GNSS Inc.', year: 2015, type: 'OEM / Embebido',
    maxConstellations: 3, frequencies: ['L1', 'L2'],
    recommendedUse: 'Integración, agricultura',
  },
  'ASHTECH Z-XII': {
    brand: 'Ashtech', model: 'Z-XII', family: 'Receptor geodésico',
    manufacturer: 'Ashtech Inc.', year: 1998, type: 'Geodésico',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Redes geodésicas históricas, monitoreo',
  },
  'ASHTECH Z-SURVEYOR': {
    brand: 'Ashtech', model: 'Z-Surveyor', family: 'Receptor geodésico',
    manufacturer: 'Ashtech Inc.', year: 1996, type: 'Geodésico',
    maxConstellations: 1, frequencies: ['L1', 'L2'],
    recommendedUse: 'Levantamientos geodésicos históricos',
  },
  'ASHTECH GG24': {
    brand: 'Ashtech', model: 'GG24', family: 'Receptor geodésico',
    manufacturer: 'Ashtech Inc.', year: 1995, type: 'Geodésico',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'GPS+GLONASS temprano',
  },
  'SOUTH GALAXY G1': {
    brand: 'South', model: 'Galaxy G1', family: 'Receptor RTK',
    manufacturer: 'South Surveying & Mapping', year: 2019, type: 'RTK / Móvil',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Topografía RTK, catastral, GIS',
  },
  'SOUTH GALAXY G6': {
    brand: 'South', model: 'Galaxy G6', family: 'Receptor RTK',
    manufacturer: 'South Surveying & Mapping', year: 2017, type: 'RTK / Móvil',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Topografía RTK',
  },
  'SOUTH S750': {
    brand: 'South', model: 'S750', family: 'Receptor RTK',
    manufacturer: 'South Surveying & Mapping', year: 2014, type: 'RTK / Móvil',
    maxConstellations: 3, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía RTK básica',
  },
  'JAVAD DELTA': {
    brand: 'Javad', model: 'Delta', family: 'Receptor OEM',
    manufacturer: 'Javad GNSS Inc.', year: 2018, type: 'OEM / Embebido',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Integración de alto rendimiento',
  },
  'JAVAD TRE_G3TH': {
    brand: 'Javad', model: 'TRE_G3TH', family: 'Receptor OEM',
    manufacturer: 'Javad GNSS Inc.', year: 2014, type: 'OEM / Embebido',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Integración multipropósito',
  },
  'JAVAD SIGMA': {
    brand: 'Javad', model: 'Sigma', family: 'Receptor RTK',
    manufacturer: 'Javad GNSS Inc.', year: 2016, type: 'RTK / Móvil',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Topografía RTK de precisión',
  },
  'JAVAD TRIUMPH 2': {
    brand: 'Javad', model: 'Triumph 2', family: 'Receptor RTK',
    manufacturer: 'Javad GNSS Inc.', year: 2013, type: 'RTK / Móvil',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Topografía RTK, control de maquinaria',
  },
  'JAVAD TRIUMPH 1': {
    brand: 'Javad', model: 'Triumph 1', family: 'Receptor RTK',
    manufacturer: 'Javad GNSS Inc.', year: 2010, type: 'RTK / Móvil',
    maxConstellations: 3, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía RTK básica',
  },
  'JAVAD GNSS': {
    brand: 'Javad', model: 'GNSS', family: 'Receptor genérico',
    manufacturer: 'Javad GNSS Inc.', year: 2008, type: 'Geodésico',
    maxConstellations: 3, frequencies: ['L1', 'L2'],
    recommendedUse: 'Varios propósitos',
  },
  'COMNAV T300': {
    brand: 'ComNav', model: 'T300', family: 'Receptor RTK',
    manufacturer: 'ComNav Technology Ltd.', year: 2019, type: 'RTK / Móvil',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Topografía RTK, catastral, GIS',
  },
  'COMNAV K508': {
    brand: 'ComNav', model: 'K508', family: 'Receptor RTK',
    manufacturer: 'ComNav Technology Ltd.', year: 2017, type: 'RTK / Móvil',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Topografía RTK',
  },
  'EMLID REACH RS2': {
    brand: 'Emlid', model: 'Reach RS2', family: 'Receptor RTK',
    manufacturer: 'Emlid Ltd.', year: 2019, type: 'RTK / Móvil',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Topografía RTK económica, GIS',
  },
  'EMLID REACH RS+': {
    brand: 'Emlid', model: 'Reach RS+', family: 'Receptor RTK',
    manufacturer: 'Emlid Ltd.', year: 2017, type: 'RTK / Móvil',
    maxConstellations: 3, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía RTK básica, educación',
  },
  'EMLID REACH M2': {
    brand: 'Emlid', model: 'Reach M2', family: 'Receptor RTK',
    manufacturer: 'Emlid Ltd.', year: 2021, type: 'RTK / Móvil',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Topografía RTK, prospección',
  },
  'SOKKIA GRX2': {
    brand: 'Sokkia', model: 'GRX2', family: 'Receptor RTK',
    manufacturer: 'Sokkia Co. Ltd.', year: 2017, type: 'RTK / Móvil',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Topografía RTK, catastral, construcción',
  },
  'SOKKIA GRX1': {
    brand: 'Sokkia', model: 'GRX1', family: 'Receptor RTK',
    manufacturer: 'Sokkia Co. Ltd.', year: 2013, type: 'RTK / Móvil',
    maxConstellations: 3, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía RTK',
  },
  'SOKKIA GSR2700': {
    brand: 'Sokkia', model: 'GSR2700', family: 'Receptor geodésico',
    manufacturer: 'Sokkia Co. Ltd.', year: 2009, type: 'Geodésico / RTK',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía geodésica',
  },
  'SOKKIA GSR2600': {
    brand: 'Sokkia', model: 'GSR2600', family: 'Receptor geodésico',
    manufacturer: 'Sokkia Co. Ltd.', year: 2005, type: 'Geodésico',
    maxConstellations: 2, frequencies: ['L1', 'L2'],
    recommendedUse: 'Levantamientos geodésicos',
  },
  'STONEX S700I': {
    brand: 'Stonex', model: 'S700i', family: 'Receptor RTK',
    manufacturer: 'Stonex Srl', year: 2019, type: 'RTK / Móvil',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Topografía RTK, catastral, GIS',
  },
  'STONEX S780': {
    brand: 'Stonex', model: 'S780', family: 'Receptor RTK',
    manufacturer: 'Stonex Srl', year: 2020, type: 'RTK / Móvil',
    maxConstellations: 7, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b', 'E6', 'B1', 'B2', 'B3'],
    recommendedUse: 'Topografía RTK avanzada',
  },
  'STONEX S9III': {
    brand: 'Stonex', model: 'S9III', family: 'Receptor RTK',
    manufacturer: 'Stonex Srl', year: 2016, type: 'RTK / Móvil',
    maxConstellations: 5, frequencies: ['L1', 'L2', 'L5', 'E1', 'E5a', 'E5b'],
    recommendedUse: 'Topografía RTK',
  },
  'STONEX S8': {
    brand: 'Stonex', model: 'S8', family: 'Receptor RTK',
    manufacturer: 'Stonex Srl', year: 2013, type: 'RTK / Móvil',
    maxConstellations: 3, frequencies: ['L1', 'L2'],
    recommendedUse: 'Topografía RTK básica',
  },
};
