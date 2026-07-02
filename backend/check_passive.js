const init = require('sql.js');
init().then(S => {
  const db = new S.Database(require('fs').readFileSync('./colgnss_dev.sqlite'));
  // Check column names
  const cols = db.exec("PRAGMA table_info(calculations)");
  console.log('Calc columns:', cols[0].values.map(v => v[1]));
  // Find calcs with station1_id
  const c = db.exec("SELECT id, station1_id, station2_id, station1_name, station2_name FROM calculations ORDER BY created_at DESC LIMIT 10");
  c[0].values.forEach(r => console.log('Calc:', r[0], 'st1:', r[1], 'st2:', r[2], 'n1:', r[3], 'n2:', r[4]));
  // Check station types
  const s = db.exec("SELECT id, code, name, type, municipality FROM stations WHERE id IN (SELECT DISTINCT station1_id FROM calculations WHERE station1_id IS NOT NULL UNION SELECT DISTINCT station2_id FROM calculations WHERE station2_id IS NOT NULL)");
  if (s[0]) s[0].values.forEach(r => console.log('Station:', r[1], r[2], r[3], r[4]));
});
