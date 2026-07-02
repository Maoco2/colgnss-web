import { Injectable, Logger } from '@nestjs/common';
import { IgacSqliteService } from './igac-sqlite.service';

export interface EllipsoidParams {
  a: number;  // semi-major axis
  f: number;  // flattening (1/f stored in DB, so f = 1/achatamiento)
}

export interface HelmertParams {
  dx: number; dy: number; dz: number;
  rx: number; ry: number; rz: number;  // radians
  scale: number;  // ppm
  x0: number; y0: number; z0: number;  // centroid
}

@Injectable()
export class CoordinateTransformerService {
  private readonly logger = new Logger(CoordinateTransformerService.name);

  constructor(private readonly igac: IgacSqliteService) {}

  getEllipsoidParams(systemId: number): EllipsoidParams | null {
    const system = this.igac.getReferenceSystems().find(s => s.PK_SISTEMA === systemId);
    if (!system) return null;
    const el = this.igac.getEllipsoid(system.FK_ELIPSOIDE);
    if (!el) return null;
    return { a: el.SEMIEJE_MAYOR, f: 1 / el.ACHATAMIENTO };
  }

  /** Geographic (lat, lon in degrees, h in meters) → Geocentric XYZ */
  geographicToXyz(latDeg: number, lonDeg: number, h: number, ell: EllipsoidParams): { x: number; y: number; z: number } {
    const a = ell.a;
    const e2 = 2 * ell.f - ell.f * ell.f;
    const sinLat = Math.sin(latDeg * Math.PI / 180);
    const cosLat = Math.cos(latDeg * Math.PI / 180);
    const sinLon = Math.sin(lonDeg * Math.PI / 180);
    const cosLon = Math.cos(lonDeg * Math.PI / 180);
    const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
    return {
      x: (N + h) * cosLat * cosLon,
      y: (N + h) * cosLat * sinLon,
      z: (N * (1 - e2) + h) * sinLat,
    };
  }

  /** Geocentric XYZ → Geographic (lat, lon in degrees, h in meters) */
  xyzToGeographic(x: number, y: number, z: number, ell: EllipsoidParams, tolerance = 1e-12): { lat: number; lon: number; h: number } {
    const a = ell.a;
    const e2 = 2 * ell.f - ell.f * ell.f;
    const lon = Math.atan2(y, x);
    const p = Math.sqrt(x * x + y * y);
    let lat = Math.atan2(z, p * (1 - e2));
    let prevLat: number;
    do {
      prevLat = lat;
      const sinLat = Math.sin(lat);
      const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
      lat = Math.atan2(z + e2 * N * sinLat, p);
    } while (Math.abs(lat - prevLat) > tolerance);
    const sinLat = Math.sin(lat);
    const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
    const h = p / Math.cos(lat) - N;
    return { lat: lat * 180 / Math.PI, lon: lon * 180 / Math.PI, h: isNaN(h) ? 0 : h };
  }

  /** Helmert 7-parameter transformation (Bursa-Wolf) with centroid */
  helmertTransform(x: number, y: number, z: number, p: HelmertParams, inverse = false): { x: number; y: number; z: number } {
    const dx_ = x - p.x0;
    const dy_ = y - p.y0;
    const dz_ = z - p.z0;
    let s = p.scale * 1e-6;
    let dx = p.dx, dy = p.dy, dz = p.dz;
    let rx = p.rx, ry = p.ry, rz = p.rz;
    if (inverse) {
      dx = -dx; dy = -dy; dz = -dz;
      rx = -rx; ry = -ry; rz = -rz;
      s = -s / (1 + s);  // (1/(1+s) - 1) ≈ -s for small s
    }
    const xr = dx + p.x0 + (1 + s) * (dx_ + rz * dy_ - ry * dz_);
    const yr = dy + p.y0 + (1 + s) * (-rz * dx_ + dy_ + rx * dz_);
    const zr = dz + p.z0 + (1 + s) * (ry * dx_ - rx * dy_ + dz_);
    return { x: xr, y: yr, z: zr };
  }

  /** Select the closest Helmert region by centroid proximity */
  selectHelmertRegion(x: number, y: number, z: number): HelmertParams | null {
    const regions = this.igac.getHelmertParameters();
    if (regions.length === 0) return null;
    let best = regions[0];
    let bestDist = Infinity;
    for (const r of regions) {
      const d = (x - r.X0) ** 2 + (y - r.Y0) ** 2 + (z - r.Z0) ** 2;
      if (d < bestDist) { bestDist = d; best = r; }
    }
    return {
      dx: best.DX, dy: best.DY, dz: best.DZ,
      rx: best.RX, ry: best.RY, rz: best.RZ,
      scale: best.FACTOR_ES,
      x0: best.X0, y0: best.Y0, z0: best.Z0,
    };
  }

  /** Datum transformation: sourceSystemId → targetSystemId */
  transformDatum(lat: number, lon: number, h: number, sourceSystemId: number, targetSystemId: number): { lat: number; lon: number; h: number } {
    if (sourceSystemId === targetSystemId) return { lat, lon, h };
    const srcEll = this.getEllipsoidParams(sourceSystemId);
    const tgtEll = this.getEllipsoidParams(targetSystemId);
    if (!srcEll || !tgtEll) throw new Error('Ellipsoid not found');
    const xyz = this.geographicToXyz(lat, lon, h || 0, srcEll);
    const helmert = this.selectHelmertRegion(xyz.x, xyz.y, xyz.z);
    if (!helmert) throw new Error('Helmert parameters not found');
    // DB params are Bogotá (sys 2) → MAGNA-SIRGAS (sys 1); reverse when going the other way
    const inverse = sourceSystemId === 1 && targetSystemId === 2;
    const xyz2 = this.helmertTransform(xyz.x, xyz.y, xyz.z, helmert, inverse);
    return this.xyzToGeographic(xyz2.x, xyz2.y, xyz2.z, tgtEll);
  }

  /** Gauss-Kruger (Transverse Mercator) to Geographic */
  gaussKrugerToGeographic(north: number, east: number, zone: any, ell: EllipsoidParams): { lat: number; lon: number } {
    const a = ell.a;
    const e2 = 2 * ell.f - ell.f * ell.f;
    const e4 = e2 * e2;
    const e6 = e4 * e2;
    const centralMeridian = zone.LONGITUD;
    const falseNorthing = zone.NORTE;
    const falseEasting = zone.ESTE;
    const n0 = zone.N0;

    const k0 = zone.FACTOR_ESCALA || 1.0;

    const E = east - falseEasting;
    const N = north - falseNorthing;

    // Use N0 from the database as the meridian arc from equator to the origin latitude
    const M = n0 + N / k0;

    const mu = M / (a * (1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256));
    const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));

    const J1 = (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32);
    const J2 = (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32);
    const J3 = (151 * e1 * e1 * e1 / 96);
    const J4 = (1097 * e1 * e1 * e1 * e1 / 512);

    let fp = mu + J1 * Math.sin(2 * mu) + J2 * Math.sin(4 * mu) + J3 * Math.sin(6 * mu) + J4 * Math.sin(8 * mu);

    const sinFp = Math.sin(fp);
    const cosFp = Math.cos(fp);
    const tanFp = Math.tan(fp);
    const t2 = tanFp * tanFp;
    const t4 = t2 * t2;
    const ep2 = e2 / (1 - e2);
    const C1 = ep2 * cosFp * cosFp;
    const C2 = C1 * C1;
    const Nf = a / Math.sqrt(1 - e2 * sinFp * sinFp);
    const R = Nf * (1 - e2) / (1 - e2 * sinFp * sinFp);
    const D = E / (Nf * k0);
    const D2 = D * D;
    const D4 = D2 * D2;
    const D6 = D4 * D2;

    const lat = fp - (Nf * tanFp / R) * (
      D2 / 2 - (5 + 3 * t2 + 10 * C1 - 4 * C2 - 9 * ep2) * D4 / 24
      + (61 + 90 * t2 + 298 * C1 + 45 * t4 - 252 * ep2 - 3 * C2) * D6 / 720
    );

    const lon = (1 / cosFp) * (
      D - (1 + 2 * t2 + C1) * D2 * D / 6
      + (5 - 2 * C1 + 28 * t2 - 3 * C2 + 8 * ep2 + 24 * t4) * D4 * D / 120
    ) + centralMeridian * Math.PI / 180;

    return { lat: lat * 180 / Math.PI, lon: lon * 180 / Math.PI };
  }

  /** Geographic to Gauss-Kruger (Transverse Mercator) */
  geographicToGaussKruger(latDeg: number, lonDeg: number, zone: any, ell: EllipsoidParams): { north: number; east: number; convergence: number; scale: number } {
    const a = ell.a;
    const e2 = 2 * ell.f - ell.f * ell.f;
    const e4 = e2 * e2;
    const e6 = e4 * e2;
    const centralMeridian = zone.LONGITUD * Math.PI / 180;
    const falseNorthing = zone.NORTE;
    const falseEasting = zone.ESTE;
    const k0 = zone.FACTOR_ESCALA || 1.0;

    const lat = latDeg * Math.PI / 180;
    const lon = lonDeg * Math.PI / 180;
    const dLon = lon - centralMeridian;

    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);
    const tanLat = Math.tan(lat);
    const t2 = tanLat * tanLat;
    const t4 = t2 * t2;
    const ep2 = e2 / (1 - e2);
    const C = ep2 * cosLat * cosLat;
    const C2 = C * C;
    const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
    const M = this.meridianArc(lat, a, e2);
    const Mo = zone.N0;  // Meridian arc to origin latitude

    const dLon2 = dLon * dLon;
    const dLon4 = dLon2 * dLon2;
    const dLon6 = dLon4 * dLon2;

    const north = (M - Mo) * k0 + N * k0 * (
      dLon2 * sinLat * cosLat / 2
      + dLon4 * sinLat * cosLat * cosLat * cosLat * (5 - t2 + 9 * C + 4 * C2) / 24
      + dLon6 * sinLat * cosLat * cosLat * cosLat * cosLat * cosLat * (61 - 58 * t2 + t4 + 600 * C - 330 * ep2) / 720
    ) + falseNorthing;

    const east = N * k0 * (
      dLon * cosLat
      + dLon2 * dLon * cosLat * cosLat * cosLat * (1 - t2 + C) / 6
      + dLon4 * dLon * cosLat * cosLat * cosLat * cosLat * cosLat * (5 - 18 * t2 + t4 + 72 * C - 58 * ep2) / 120
    ) + falseEasting;

    const convergence = Math.atan(tanLat * Math.sin(dLon) / Math.cos(dLon)) * 180 / Math.PI;
    const scale = k0 * (1 + (1 + t2 + C) * dLon2 * cosLat * cosLat / 2);

    return { north, east, convergence, scale };
  }

  /** Local Cartesian (Origen Cartográfico) to Geographic */
  localToGeographic(north: number, east: number, origin: any, ell: EllipsoidParams): { lat: number; lon: number } {
    const a = ell.a;
    const e2 = 2 * ell.f - ell.f * ell.f;
    const latOrigin = origin.LATITUD * Math.PI / 180;
    const lonOrigin = origin.LONGITUD * Math.PI / 180;
    const falseNorth = origin.NORTE;
    const falseEast = origin.ESTE;
    const planeH = origin.PLANO_PROY || 0;

    const N = north - falseNorth;
    const E = east - falseEast;

    const Rm = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(latOrigin) * Math.sin(latOrigin), 1.5);
    const Rn = a / Math.sqrt(1 - e2 * Math.sin(latOrigin) * Math.sin(latOrigin));

    const lat = latOrigin + (N / Rm) - (E * E * Math.tan(latOrigin)) / (2 * Rm * Rn);
    const lon = lonOrigin + (E / (Rn * Math.cos(latOrigin))) - (N * E * Math.tan(latOrigin)) / (Rn * Rm * Math.cos(latOrigin));

    return { lat: lat * 180 / Math.PI, lon: lon * 180 / Math.PI };
  }

  /** Geographic to Local Cartesian (Origen Cartográfico) */
  geographicToLocal(latDeg: number, lonDeg: number, origin: any, ell: EllipsoidParams): { north: number; east: number } {
    const a = ell.a;
    const e2 = 2 * ell.f - ell.f * ell.f;
    const latOrigin = origin.LATITUD * Math.PI / 180;
    const lonOrigin = origin.LONGITUD * Math.PI / 180;
    const lat = latDeg * Math.PI / 180;
    const lon = lonDeg * Math.PI / 180;
    const falseNorth = origin.NORTE;
    const falseEast = origin.ESTE;

    const dLat = lat - latOrigin;
    const dLon = lon - lonOrigin;

    const sinLat = Math.sin(latOrigin);
    const cosLat = Math.cos(latOrigin);

    const Rm = a * (1 - e2) / Math.pow(1 - e2 * sinLat * sinLat, 1.5);
    const Rn = a / Math.sqrt(1 - e2 * sinLat * sinLat);

    const north = Rm * dLat + falseNorth;
    const east = Rn * cosLat * dLon + falseEast;

    return { north, east };
  }

  /** Meridian arc distance from equator to given latitude */
  private meridianArc(latRad: number, a: number, e2: number): number {
    const e4 = e2 * e2;
    const e6 = e4 * e2;
    const e8 = e6 * e2;
    const A0 = 1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256 - 175 * e8 / 16384;
    const A2 = 3 * (e2 + e4 / 4 + 15 * e6 / 128 + 525 * e8 / 16384) / 8;
    const A4 = 15 * (e4 + 3 * e6 / 4 + 35 * e8 / 64) / 256;
    const A6 = 35 * (e6 + 5 * e8 / 4) / 3072;
    const A8 = 315 * e8 / 131072;
    return a * (A0 * latRad - A2 * Math.sin(2 * latRad) + A4 * Math.sin(4 * latRad) - A6 * Math.sin(6 * latRad) + A8 * Math.sin(8 * latRad));
  }

  /** Main conversion dispatcher */
  convert(params: {
    sourceSystemId: number;
    sourceCoordType: string;
    sourceOrigin: any;
    targetSystemId: number;
    targetCoordType: string;
    targetOrigin: any;
    values: { [key: string]: number };
  }): { result: { [key: string]: any }; intermediate: { lat?: number; lon?: number; h?: number }; convergence?: number; scale?: number } {
    const srcEll = this.getEllipsoidParams(params.sourceSystemId);
    const tgtEll = this.getEllipsoidParams(params.targetSystemId);
    if (!srcEll || !tgtEll) throw new Error('Ellipsoid parameters not found');

    let lat: number, lon: number, h = 0;

    // Step 1: Convert input to geographic (lat, lon in degrees)
    if (params.sourceCoordType === 'geographic') {
      lat = params.values.lat;
      lon = params.values.lon;
      h = params.values.h || 0;
    } else if (params.sourceCoordType === 'geocentric_xyz') {
      const geo = this.xyzToGeographic(params.values.x, params.values.y, params.values.z, srcEll);
      lat = geo.lat; lon = geo.lon; h = geo.h;
    } else if (params.sourceCoordType === 'gauss_kruger' || params.sourceCoordType === 'origen_nacional') {
      if (!params.sourceOrigin) throw new Error('Source Gauss-Kruger zone required');
      const geo = this.gaussKrugerToGeographic(params.values.north, params.values.east, params.sourceOrigin, srcEll);
      lat = geo.lat; lon = geo.lon;
    } else if (params.sourceCoordType === 'local_cartesian') {
      if (!params.sourceOrigin) throw new Error('Source local origin required');
      const geo = this.localToGeographic(params.values.north, params.values.east, params.sourceOrigin, srcEll);
      lat = geo.lat; lon = geo.lon;
    } else {
      throw new Error(`Unsupported source coordinate type: ${params.sourceCoordType}`);
    }

    // Step 2: Datum transformation if needed
    let geoAfterDatum = { lat, lon, h };
    if (params.sourceSystemId !== params.targetSystemId) {
      geoAfterDatum = this.transformDatum(lat, lon, h, params.sourceSystemId, params.targetSystemId);
    }

    // Step 3: Convert to target type
    let result: { [key: string]: any };
    let convergence: number | undefined;
    let scale: number | undefined;

    if (params.targetCoordType === 'geographic') {
      result = { lat: geoAfterDatum.lat, lon: geoAfterDatum.lon };
      if (geoAfterDatum.h) result.h = geoAfterDatum.h;
      convergence = 0;
      scale = 1;
    } else if (params.targetCoordType === 'geocentric_xyz') {
      const xyz = this.geographicToXyz(geoAfterDatum.lat, geoAfterDatum.lon, geoAfterDatum.h, tgtEll);
      result = { x: xyz.x, y: xyz.y, z: xyz.z };
    } else if (params.targetCoordType === 'gauss_kruger' || params.targetCoordType === 'origen_nacional') {
      if (!params.targetOrigin) throw new Error('Target Gauss-Kruger zone required');
      const gk = this.geographicToGaussKruger(geoAfterDatum.lat, geoAfterDatum.lon, params.targetOrigin, tgtEll);
      result = { north: gk.north, east: gk.east };
      convergence = gk.convergence;
      scale = gk.scale;
    } else if (params.targetCoordType === 'local_cartesian') {
      if (!params.targetOrigin) throw new Error('Target local origin required');
      const local = this.geographicToLocal(geoAfterDatum.lat, geoAfterDatum.lon, params.targetOrigin, tgtEll);
      result = { north: local.north, east: local.east };
    } else {
      throw new Error(`Unsupported target coordinate type: ${params.targetCoordType}`);
    }

    return { result, intermediate: { lat: geoAfterDatum.lat, lon: geoAfterDatum.lon, h: geoAfterDatum.h }, convergence, scale };
  }
}
