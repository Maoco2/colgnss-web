import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { StationsService } from '../../modules/stations/stations.service';
import { StationType } from '../../modules/stations/station.entity';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../../');

async function seedActive(stationsService: StationsService) {
  const geoJsonPath = path.join(PROJECT_ROOT, 'Red_ActivaGNSS_202511.geojson');
  if (!fs.existsSync(geoJsonPath)) {
    console.log('GeoJSON file not found, skipping active stations seed');
    return 0;
  }

  const data = JSON.parse(fs.readFileSync(geoJsonPath, 'utf-8'));
  let imported = 0;

  for (const feature of data.features) {
    const props = feature.properties;
    const coords = feature.geometry.coordinates;

    try {
      await stationsService.create({
        code: props.MRTNomencl || 'UNKNOWN',
        name: props.MDANMNombr || 'Unknown',
        type: StationType.ACTIVE,
        department: props.DeNombre || 'Unknown',
        municipality: props.MDANMNombr || 'Unknown',
        latitude: coords[1],
        longitude: coords[0],
        height: parseFloat(String(props.AlturaElip || '0').replace(',', '.')),
        receiverType: props.RedGeoAc_RedNacional_MRTMaterial || null,
        observations: props.Nota_Aclaratoria || undefined,
      });
      imported++;
    } catch (e) {
      console.error(`Failed to import active station ${props.MRTNomencl}: ${e.message}`);
    }
  }

  console.log(`Imported ${imported} active stations from GeoJSON`);
  return imported;
}

async function seedPassive(stationsService: StationsService) {
  const gpkgPath = path.join(PROJECT_ROOT, 'RedPasivaGNSSCeM.gpkg');
  if (!fs.existsSync(gpkgPath)) {
    console.log('GeoPackage file not found, skipping passive stations seed');
    return 0;
  }

  let imported = 0;
  try {
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();
    const buf = fs.readFileSync(gpkgPath);
    const db = new SQL.Database(buf);

    const rows = db.exec('SELECT Nomenc, Lat, Long, AltElips, NomDpto, NomMpio, Tipo_Mat, Obs, Orden FROM VertGeod ORDER BY OBJECTID');
    db.close();

    if (!rows.length) {
      console.log('No data in VertGeod table');
      return 0;
    }

    for (const row of rows[0].values) {
      const [nomenc, lat, lng, altElips, nomDpto, nomMpio, tipoMat, obs, orden] = row;

      try {
        await stationsService.create({
          code: String(nomenc || 'UNKNOWN'),
          name: `${String(nomMpio || 'Unknown')} - ${String(nomenc || '')}`,
          type: StationType.PASSIVE,
          department: String(nomDpto || 'Unknown'),
          municipality: String(nomMpio || 'Unknown'),
          latitude: lat,
          longitude: lng,
          height: altElips || null,
          materialType: String(tipoMat || '').trim() || undefined,
          observations: String(obs || '').trim() || undefined,
        });
        imported++;
      } catch (e) {
        console.error(`Failed to import passive station ${nomenc}: ${e.message}`);
      }
    }
  } catch (e) {
    console.error(`Error reading GeoPackage: ${e.message}`);
  }

  console.log(`Imported ${imported} passive stations from GeoPackage`);
  return imported;
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const stationsService = app.get(StationsService);

  const activeCount = await seedActive(stationsService);
  const passiveCount = await seedPassive(stationsService);

  console.log(`\nSeed complete: ${activeCount + passiveCount} total stations (${activeCount} active, ${passiveCount} passive)`);

  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
