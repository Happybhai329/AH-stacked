import { initDatabase, query } from '../server/db.js';

async function main() {
  await initDatabase();
  const res = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log('TABLES IN DB:', res.rows.map(r => r.table_name));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
