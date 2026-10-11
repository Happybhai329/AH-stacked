import { initDatabase, query } from '../server/db.js';

async function main() {
  await initDatabase();
  await query(`
    ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  `);

  try {
    await query(`
      UPDATE employees SET
        created_at = COALESCE(created_at, "createdAt"::timestamptz, CURRENT_TIMESTAMP),
        updated_at = COALESCE(updated_at, "updatedAt"::timestamptz, CURRENT_TIMESTAMP)
      WHERE created_at IS NULL OR updated_at IS NULL;
    `);
  } catch (e) {
    console.warn(e.message);
  }

  console.log('Added created_at and updated_at to employees.');
  process.exit(0);
}
main();
