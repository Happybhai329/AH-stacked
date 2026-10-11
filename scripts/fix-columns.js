import { initDatabase, query } from '../server/db.js';

async function main() {
  await initDatabase();

  // Add date_of_application
  await query(`
    ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS date_of_application TIMESTAMP WITH TIME ZONE;
  `);

  // Ensure dob can be cast to timestamp or date
  // In students, dob might be TEXT like '2014-04-25'. Let's check:
  const dobType = await query(`
    SELECT data_type FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'dob'
  `);
  console.log('DOB column type:', dobType.rows[0]?.data_type);

  if (dobType.rows[0]?.data_type === 'text') {
    console.log('Converting dob from text to timestamp with time zone...');
    // We can add a dob_date or alter column type with USING
    await query(`
      ALTER TABLE students 
        ALTER COLUMN dob TYPE TIMESTAMP WITH TIME ZONE 
        USING CASE 
          WHEN dob IS NULL OR dob = '' THEN NULL 
          ELSE dob::timestamp with time zone 
        END;
    `);
  }

  // Also in batches: writing_class, actual_class
  await query(`
    ALTER TABLE batches 
      ADD COLUMN IF NOT EXISTS writing_class TEXT,
      ADD COLUMN IF NOT EXISTS actual_class TEXT;
  `);

  console.log('Columns verified.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
