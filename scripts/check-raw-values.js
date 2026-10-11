import { initDatabase, query } from '../server/db.js';

async function main() {
  await initDatabase();
  const sample = await query("SELECT raw_values FROM prime_admissions LIMIT 1");
  console.log('TYPE OF raw_values:', typeof sample.rows[0].raw_values, Array.isArray(sample.rows[0].raw_values));
  console.log('FIRST 5 ELEMENTS:', sample.rows[0].raw_values?.slice ? sample.rows[0].raw_values.slice(0, 6) : sample.rows[0].raw_values);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
