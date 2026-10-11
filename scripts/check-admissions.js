import { initDatabase, query } from '../server/db.js';

async function main() {
  await initDatabase();
  const res = await query("SELECT count(1) as c FROM prime_admissions");
  console.log('PRIME_ADMISSIONS COUNT:', res.rows[0].c);
  const sample = await query("SELECT * FROM prime_admissions LIMIT 1");
  console.log('SAMPLE ADMISSION:', sample.rows[0]);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
