import { initDatabase, query } from '../server/db.js';

async function main() {
  await initDatabase();
  console.log('--- Fixing Admissions & Batches Schema for Prisma ---');

  // 1. Add DUPLICATE to AdmissionStatus enum if not exists
  await query(`
    DO $$ BEGIN
      ALTER TYPE "AdmissionStatus" ADD VALUE IF NOT EXISTS 'DUPLICATE';
    EXCEPTION
      WHEN others THEN null;
    END $$;
  `);

  // 2. Add use_day_wise_schedule to batches
  await query(`
    ALTER TABLE batches
      ADD COLUMN IF NOT EXISTS use_day_wise_schedule BOOLEAN DEFAULT false;
  `);

  // 3. Fix admissions columns
  await query(`
    ALTER TABLE admissions
      ADD COLUMN IF NOT EXISTS mother_name TEXT,
      ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMP WITH TIME ZONE;
  `);

  // If mothername exists, copy to mother_name
  try {
    await query(`
      UPDATE admissions SET mother_name = COALESCE(mother_name, mothername) WHERE mother_name IS NULL;
    `);
  } catch (e) {
    // mothername might not exist, ignore
  }

  // Also check if dob in admissions is TIMESTAMP or needs proper casting
  const admDobType = await query(`
    SELECT data_type FROM information_schema.columns 
    WHERE table_name = 'admissions' AND column_name = 'dob'
  `);
  console.log('Admissions DOB column type:', admDobType.rows[0]?.data_type);

  // 4. Populate missing mother_name, dob, date_of_application in admissions from prime_admissions
  console.log('Syncing rich columns from prime_admissions to admissions...');
  await query(`
    UPDATE admissions a
    SET 
      mother_name = COALESCE(a.mother_name, p.raw_values->>2),
      dob = COALESCE(a.dob, CASE 
        WHEN (p.raw_values->>8) IS NOT NULL AND (p.raw_values->>8) != '' 
        THEN (p.raw_values->>8)::timestamp with time zone 
        ELSE NULL 
      END),
      date_of_application = COALESCE(a.date_of_application, CASE 
        WHEN (p.raw_values->>7) IS NOT NULL AND (p.raw_values->>7) != '' 
        THEN (p.raw_values->>7)::timestamp with time zone 
        ELSE NULL 
      END),
      category = COALESCE(a.category, p.raw_values->>11),
      father_occupation = COALESCE(a.father_occupation, p.raw_values->>12),
      defence_service = COALESCE(a.defence_service, p.raw_values->>13),
      job_description = COALESCE(a.job_description, p.raw_values->>14)
    FROM prime_admissions p
    WHERE a.student_id = (p.raw_values->>4);
  `);

  // 5. Check batch_change_logs table exists
  await query(`
    CREATE TABLE IF NOT EXISTS batch_change_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id TEXT NOT NULL,
      student_name TEXT,
      previous_batch TEXT,
      new_batch TEXT NOT NULL,
      changed_by_id UUID,
      changed_by_name TEXT,
      batch_id UUID REFERENCES batches(id),
      date_of_change TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database schema aligned successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error fixing schema:', err);
  process.exit(1);
});
