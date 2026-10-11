import { initDatabase, query } from '../server/db.js';

async function main() {
  await initDatabase();
  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS email TEXT;`);
  console.log('Added email column to employees.');
  process.exit(0);
}
main();
