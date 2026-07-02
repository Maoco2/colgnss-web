import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const initSqlJs = require('sql.js');

@Injectable()
export class IgacSqliteService implements OnModuleInit {
  private db: any;
  private readonly logger = new Logger(IgacSqliteService.name);

  // Caches
  private systemsCache: any[] | null = null;
  private ellipsoidsCache: Map<number, any> = new Map();
  private gaussZonesCache: Map<number, any[]> = new Map();
  private helmertCache: any[] | null = null;
  private departmentsCache: any[] | null = null;

  async onModuleInit() {
    try {
      const dbPath = process.env.IGAC_S3DB_PATH || path.join(__dirname, '..', '..', '..', '..', 'Igac.s3db');
      const resolved = path.resolve(dbPath);
      if (!fs.existsSync(resolved)) {
        this.logger.warn(`Igac.s3db not found at ${resolved}. Coordinate conversion will be unavailable.`);
        return;
      }
      const buffer = fs.readFileSync(resolved);
      const SQL = await initSqlJs();
      this.db = new SQL.Database(buffer);
      this.logger.log(`Igac.s3db loaded (${(buffer.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      this.logger.error('Failed to load Igac.s3db', err);
    }
  }

  isLoaded(): boolean {
    return this.db !== null;
  }

  getReferenceSystems(): any[] {
    if (!this.db) return [];
    if (this.systemsCache) return this.systemsCache;
    const stmt = this.db.exec('SELECT PK_SISTEMA, NOMBRE, FK_ELIPSOIDE, CUBRIMIENTO FROM SISTEMAS_REFERENCIA ORDER BY PK_SISTEMA');
    this.systemsCache = this.parseResults(stmt);
    return this.systemsCache;
  }

  getEllipsoid(id: number): any {
    if (!this.db) return null;
    if (this.ellipsoidsCache.has(id)) return this.ellipsoidsCache.get(id);
    const stmt = this.db.exec(`SELECT PK_ELIPSOIDE, NOMBRE, SEMIEJE_MAYOR, ACHATAMIENTO FROM ELIPSOIDES WHERE PK_ELIPSOIDE = ${id}`);
    const rows = this.parseResults(stmt);
    const result = rows.length > 0 ? rows[0] : null;
    if (result) this.ellipsoidsCache.set(id, result);
    return result;
  }

  getCoordinateTypes(systemId: number): { type: string; label: string; requiresOrigin: boolean }[] {
    const types: { type: string; label: string; requiresOrigin: boolean }[] = [
      { type: 'geographic', label: 'Coordenadas Geográficas', requiresOrigin: false },
      { type: 'geocentric_xyz', label: 'Geocéntricas XYZ', requiresOrigin: false },
    ];
    if (!this.db) return types;
    const gk = this.db.exec(`SELECT COUNT(*) as cnt FROM ORIGENES_GAUSS WHERE FK_SISTEMA = ${systemId}`);
    if (gk.length > 0 && this.parseResults(gk)[0]?.cnt > 0) {
      types.push({ type: 'gauss_kruger', label: 'Gauss-Krüger', requiresOrigin: true });
      types.push({ type: 'origen_nacional', label: 'Origen Nacional', requiresOrigin: false });
    }
    const cart = this.db.exec(`SELECT COUNT(*) as cnt FROM ORIGENES_CART WHERE FK_SISTEMA = ${systemId}`);
    if (cart.length > 0 && this.parseResults(cart)[0]?.cnt > 0) {
      types.push({ type: 'local_cartesian', label: 'Planas Cartesianas (Origen Local)', requiresOrigin: true });
    }
    return types;
  }

  getGaussKrugerZones(systemId: number): any[] {
    if (!this.db) return [];
    const cached = this.gaussZonesCache.get(systemId);
    if (cached) return cached;
    const stmt = this.db.exec(`SELECT PK_ORIGENES_GAUSS, NOMBRE, LATITUD, LONGITUD, NORTE, ESTE, COBERTURA, N0 FROM ORIGENES_GAUSS WHERE FK_SISTEMA = ${systemId} ORDER BY LONGITUD`);
    const rows = this.parseResults(stmt);
    this.gaussZonesCache.set(systemId, rows);
    return rows;
  }

  getDepartments(): any[] {
    if (!this.db) return [];
    if (this.departmentsCache) return this.departmentsCache;
    const stmt = this.db.exec('SELECT PK_DEPARTAMENTO, NOMBRE FROM DEPARTAMENTOS ORDER BY NOMBRE');
    this.departmentsCache = this.parseResults(stmt);
    return this.departmentsCache;
  }

  getMunicipalities(departmentPk: number): any[] {
    if (!this.db) return [];
    const stmt = this.db.exec(`SELECT PK_MUNICIPIOS, NOMBRE FROM MUNICIPIOS WHERE FK_DEPARTAMENTOS = ${departmentPk} AND NOMBRE != '--Seleccione Municipio--' ORDER BY NOMBRE`);
    return this.parseResults(stmt);
  }

  getLocalOrigins(systemId: number, municipalityPk?: number): any[] {
    if (!this.db) return [];
    let sql = `SELECT PK_ORIGENES_CART, NOMBRE, LATITUD, LONGITUD, NORTE, ESTE, PLANO_PROY, DESCRIP, OFICIAL FROM ORIGENES_CART WHERE FK_SISTEMA = ${systemId}`;
    if (municipalityPk) sql += ` AND FK_MUNICIPIOS = ${municipalityPk}`;
    sql += ' ORDER BY NOMBRE';
    const stmt = this.db.exec(sql);
    return this.parseResults(stmt);
  }

  getOrigenNacionalZone(systemId: number): any | null {
    if (!this.db) return null;
    if (systemId === 1) {
      // EPSG:9377 - MAGNA-SIRGAS / Origen Nacional (GRS80)
      // PROJCS["MAGNA-SIRGAS 2018 / Origen-Nacional",PROJECTION["Transverse_Mercator"],
      //   PARAMETER["latitude_of_origin",4], PARAMETER["central_meridian",-73],
      //   PARAMETER["scale_factor",0.9992], PARAMETER["false_easting",5000000],
      //   PARAMETER["false_northing",2000000]]
      const a = 6378137;
      const f = 1 / 298.257222101;
      const e2 = 2 * f - f * f;
      const latRad = 4 * Math.PI / 180;
      const e4 = e2 * e2;
      const e6 = e4 * e2;
      const e8 = e6 * e2;
      const A0 = 1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256 - 175 * e8 / 16384;
      const A2 = 3 * (e2 + e4 / 4 + 15 * e6 / 128 + 525 * e8 / 16384) / 8;
      const A4 = 15 * (e4 + 3 * e6 / 4 + 35 * e8 / 64) / 256;
      const A6 = 35 * (e6 + 5 * e8 / 4) / 3072;
      const A8 = 315 * e8 / 131072;
      const n0 = a * (A0 * latRad - A2 * Math.sin(2 * latRad) + A4 * Math.sin(4 * latRad) - A6 * Math.sin(6 * latRad) + A8 * Math.sin(8 * latRad));
      return {
        PK_ORIGENES_GAUSS: 0,
        NOMBRE: 'Origen Nacional (EPSG:9377)',
        LATITUD: 4,
        LONGITUD: -73,
        NORTE: 2000000,
        ESTE: 5000000,
        N0: Math.round(n0 * 1e4) / 1e4,
        FACTOR_ESCALA: 0.9992,
      };
    }
    // Bogotá: use DB Central zone
    const stmt = this.db.exec(`SELECT PK_ORIGENES_GAUSS, NOMBRE, LATITUD, LONGITUD, NORTE, ESTE, N0 FROM ORIGENES_GAUSS WHERE FK_SISTEMA = ${systemId} AND NOMBRE = 'Central'`);
    const rows = this.parseResults(stmt);
    return rows.length > 0 ? { ...rows[0], FACTOR_ESCALA: 1.0 } : null;
  }

  getHelmertParameters(): any[] {
    if (!this.db) return [];
    if (this.helmertCache) return this.helmertCache;
    const stmt = this.db.exec('SELECT ID, NOMBRE, DX, DY, DZ, FACTOR_ES, RX, RY, RZ, X0, Y0, Z0 FROM REGIONES ORDER BY ID');
    this.helmertCache = this.parseResults(stmt);
    return this.helmertCache;
  }

  private parseResults(stmt: any[]): any[] {
    if (!stmt || stmt.length === 0) return [];
    const { columns, values } = stmt[0];
    return values.map((row: any) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
      return obj;
    });
  }
}
