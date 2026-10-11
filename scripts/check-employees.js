import { initDatabase, query } from '../server/db.js';

async function main() {
  await initDatabase();
  const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'employees'");
  console.log('EMPLOYEES COLUMNS:', res.rows);
  process.exit(0);
}
main();
