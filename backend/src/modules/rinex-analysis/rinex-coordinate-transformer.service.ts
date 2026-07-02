import { Injectable } from '@nestjs/common';

export interface GeographicCoords {
  lat: number;
  lon: number;
  height: number;
  coordSystem: string;
}

@Injectable()
export class CoordinateTransformerService {
  xyzToGeographic(x: number, y: number, z: number): GeographicCoords {
    const a = 6378137;
    const f = 1 / 298.257222101;
    const b = a * (1 - f);
    const esq = 1 - (b * b) / (a * a);
    const p = Math.sqrt(x * x + y * y);
    const lon = Math.atan2(y, x);
    let lat = Math.atan2(z, p * (1 - esq));
    for (let iter = 0; iter < 10; iter++) {
      const sinLat = Math.sin(lat);
      const N = a / Math.sqrt(1 - esq * sinLat * sinLat);
      const newLat = Math.atan2(z + esq * N * sinLat, p);
      if (Math.abs(newLat - lat) < 1e-12) break;
      lat = newLat;
    }
    const sinLat = Math.sin(lat);
    const N = a / Math.sqrt(1 - esq * sinLat * sinLat);
    const h = p / Math.cos(lat) - N;
    return {
      lat: Math.round(lat * 180 / Math.PI * 1e8) / 1e8,
      lon: Math.round(lon * 180 / Math.PI * 1e8) / 1e8,
      height: Math.round(h * 100) / 100,
      coordSystem: 'MAGNA-SIRGAS (GRS80)',
    };
  }
}
