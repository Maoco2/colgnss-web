const initSqlJs = require('sql.js');
const fs = require('fs');

async function main() {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync('C:\\Users\\Windows 10\\Downloads\\ColGnssWeb\\RedPasivaGNSSCeM.gpkg');
  const db = new SQL.Database(buf);

  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('=== TABLES ===');
  tables[0].values.forEach(r => console.log(' ', r[0]));

  const contents = db.exec('SELECT * FROM gpkg_contents');
  console.log('\n=== CONTENTS ===');
  if (contents.length) {
    console.log(' Columns:', contents[0].columns.join(', '));
    contents[0].values.forEach(r => console.log(' ', JSON.stringify(r)));
  }

  const geomCols = db.exec('SELECT * FROM gpkg_geometry_columns');
  console.log('\n=== GEOMETRY COLUMNS ===');
  if (geomCols.length) {
    console.log(' Columns:', geomCols[0].columns.join(', '));
    geomCols[0].values.forEach(r => console.log(' ', JSON.stringify(r)));
  }

  const dataTables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'gpkg_%' AND name NOT LIKE 'sqlite_%'");
  if (dataTables.length) {
    for (const row of dataTables[0].values) {
      const tname = row[0];
      console.log('\n=== TABLE:', tname, '=== ');
      const info = db.exec("PRAGMA table_info(" + tname + ")");
      if (info.length) {
        console.log(' Columns:');
        info[0].values.forEach(c => console.log('  -', c[1], c[2]));
      }
      const sample = db.exec("SELECT * FROM " + tname + " LIMIT 3");
      if (sample.length) {
        console.log(' Sample rows:');
        console.log('  Columns:', sample[0].columns.join(', '));
        sample[0].values.forEach((r, i) => {
          console.log('  Row ' + i + ':');
          r.forEach((v, j) => {
            const col = sample[0].columns[j];
            const val = v && typeof v === 'object' && v.length > 100 ? v.length + ' bytes' : v;
            console.log('    ' + col + ':', val);
          });
        });
      }
    }
  }

  db.close();
}
main().catch(console.error);
