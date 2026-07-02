const initSqlJs = require("C:\\Users\\Windows 10\\Downloads\\ColGnssWeb - copia\\backend\\node_modules\\sql.js");
const fs = require("fs");
async function main() {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync("C:\\Users\\Windows 10\\Downloads\\ColGnssWeb - copia\\Igac.s3db");
  const db = new SQL.Database(buf);
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
  console.log("=== Tables in Igac.s3db ===");
  if (tables.length > 0) tables[0].values.forEach(r => console.log("  -", r[0]));
  const schema = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL ORDER BY name;");
  console.log("\n=== Table Schemas ===");
  if (schema.length > 0) schema[0].values.forEach(r => { console.log("---"); console.log(r[0]); });
  console.log("\n=== Row Counts ===");
  const names = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
  if (names.length > 0) {
    for (const r of names[0].values) {
      const cnt = db.exec("SELECT COUNT(*) FROM \"" + r[0] + "\"");
      if (cnt.length > 0) console.log("  " + r[0] + ": " + cnt[0].values[0][0] + " rows");
    }
  }
  db.close();
}
main().catch(console.error);
