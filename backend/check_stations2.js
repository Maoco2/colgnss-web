const init = require('sql.js');
init().then(S => {
  const db = new S.Database(require('fs').readFileSync('./colgnss_dev.sqlite'));
  // Check the specific stations from the calculation
  const ids = ['50cc2037-df96-4d0c-9f00-d1c44755ba04', 'b3ca3b96-4f6b-45ec-9a14-b89c34fa815d'];
  ids.forEach(id => {
    const r = db.exec("SELECT id, code, name, type, municipality FROM stations WHERE id='" + id + "'");
    if (r[0] && r[0].values[0]) console.log('Station:', r[0].values[0]);
  });
  // Also check a few passive stations
  const p = db.exec("SELECT id, code, name, type, municipality FROM stations WHERE type='passive' LIMIT 5");
  if (p[0]) p[0].values.forEach(r => console.log('Passive:', r));
  // Check what station1_name, station2_name are stored in the calculation
  const c = db.exec("SELECT id, station1_name, station2_name FROM calculations WHERE id='d3aacb6f-e037-4bf8-ac75-a6fd791a3226'");
  if (c[0] && c[0].values[0]) console.log('Calc stations:', c[0].values[0]);
});
