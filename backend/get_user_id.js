const init = require('sql.js');
init().then(S => {
  const db = new S.Database(require('fs').readFileSync('./colgnss_dev.sqlite'));
  const r = db.exec("SELECT id, email FROM users");
  r[0].values.forEach(row => console.log(row[0], row[1]));
});
