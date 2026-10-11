import { initDatabase, query } from '../server/db.js';

async function main() {
  await initDatabase();
  const studentsCount = await query("SELECT count(1) as c FROM students");
  const batchesCount = await query("SELECT count(1) as c FROM batches");
  const sampleStudents = await query("SELECT * FROM students LIMIT 3");
  const sampleBatches = await query("SELECT * FROM batches LIMIT 3");
  console.log('STUDENTS COUNT:', studentsCount.rows[0].c);
  console.log('BATCHES COUNT:', batchesCount.rows[0].c);
  console.log('SAMPLE STUDENT:', sampleStudents.rows[0]);
  console.log('SAMPLE BATCH:', sampleBatches.rows[0]);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
