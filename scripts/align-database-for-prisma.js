import { initDatabase, query } from '../server/db.js';

async function main() {
  await initDatabase();
  console.log('--- Starting Database Alignment for Prisma & NestJS ---');

  // 1. Ensure uuid extension is available
  await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  await query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

  // 2. Create Enums if they do not exist
  await query(`
    DO $$ BEGIN
      CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'GRADUATED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      CREATE TYPE "AdmissionStatus" AS ENUM ('PENDING', 'ENROLLED', 'CANCELLED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'STAFF', 'TEACHER');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // 3. Align BATCHES table
  console.log('Aligning batches table...');
  // Add columns if they do not exist
  await query(`
    ALTER TABLE batches 
      ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
      ADD COLUMN IF NOT EXISTS name TEXT,
      ADD COLUMN IF NOT EXISTS class_room TEXT,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
  `);

  // Populate name and class_room from legacy columns
  await query(`
    UPDATE batches SET 
      name = COALESCE(name, batch_name),
      class_room = COALESCE(class_room, classroom)
    WHERE name IS NULL OR class_room IS NULL;
  `);

  // Make sure batches id is primary key or unique
  try {
    await query(`ALTER TABLE batches DROP CONSTRAINT IF EXISTS batches_pkey CASCADE;`);
    await query(`ALTER TABLE batches ADD PRIMARY KEY (id);`);
  } catch (e) {
    console.warn('Batches primary key notice:', e.message);
  }

  try {
    await query(`ALTER TABLE batches ADD CONSTRAINT batches_name_key UNIQUE (name);`);
  } catch (e) {
    console.warn('Batches name unique notice:', e.message);
  }

  // 4. Align STUDENTS table
  console.log('Aligning students table...');
  await query(`
    ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
      ADD COLUMN IF NOT EXISTS status "StudentStatus" DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS batch_id UUID,
      ADD COLUMN IF NOT EXISTS class TEXT,
      ADD COLUMN IF NOT EXISTS mobile_numbers TEXT,
      ADD COLUMN IF NOT EXISTS present_school TEXT,
      ADD COLUMN IF NOT EXISTS start_session TEXT,
      ADD COLUMN IF NOT EXISTS end_session TEXT,
      ADD COLUMN IF NOT EXISTS mother_name TEXT,
      ADD COLUMN IF NOT EXISTS category TEXT,
      ADD COLUMN IF NOT EXISTS father_occupation TEXT,
      ADD COLUMN IF NOT EXISTS defence_service TEXT,
      ADD COLUMN IF NOT EXISTS job_description TEXT,
      ADD COLUMN IF NOT EXISTS additional_language TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
  `);

  // Populate mapped fields
  await query(`
    UPDATE students SET 
      class = COALESCE(class, class_name),
      mobile_numbers = COALESCE(mobile_numbers, mobile),
      present_school = COALESCE(present_school, school),
      status = COALESCE(status, 'ACTIVE')
    WHERE class IS NULL OR mobile_numbers IS NULL OR present_school IS NULL OR status IS NULL;
  `);

  // Switch primary key to id
  try {
    await query(`ALTER TABLE students DROP CONSTRAINT IF EXISTS students_pkey CASCADE;`);
    await query(`ALTER TABLE students ADD PRIMARY KEY (id);`);
  } catch (e) {
    console.warn('Students primary key notice:', e.message);
  }

  try {
    await query(`ALTER TABLE students ADD CONSTRAINT students_student_id_key UNIQUE (student_id);`);
  } catch (e) {
    console.warn('Students student_id unique notice:', e.message);
  }

  // Link batch_id in students to batches table
  console.log('Linking students to batches...');
  const linkRes = await query(`
    UPDATE students s
    SET batch_id = b.id
    FROM batches b
    WHERE LOWER(TRIM(s.batch)) = LOWER(TRIM(b.name))
       OR LOWER(TRIM(s.batch)) = LOWER(TRIM(b.batch_name))
    RETURNING s.student_id;
  `);
  console.log(`Linked ${linkRes.rowCount} students to their respective batch IDs.`);

  // 5. Create ADMISSIONS table if not present
  console.log('Ensuring admissions table exists...');
  await query(`
    CREATE TABLE IF NOT EXISTS admissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id TEXT UNIQUE NOT NULL,
      start_session TEXT,
      end_session TEXT,
      date_of_application TIMESTAMP WITH TIME ZONE,
      student_name TEXT NOT NULL,
      father_name TEXT,
      dob TIMESTAMP WITH TIME ZONE,
      mobile_numbers TEXT,
      email TEXT,
      motherName TEXT,
      category TEXT,
      father_occupation TEXT,
      defence_service TEXT,
      job_description TEXT,
      class TEXT,
      present_school TEXT,
      program TEXT,
      status "AdmissionStatus" DEFAULT 'PENDING',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP WITH TIME ZONE
    );
  `);

  // Populate admissions from prime_admissions if admissions is empty
  const admissionsCount = await query('SELECT count(1) as c FROM admissions');
  if (Number(admissionsCount.rows[0].c) === 0) {
    console.log('Populating admissions from prime_admissions...');
    await query(`
      INSERT INTO admissions (
        student_id, student_name, father_name, program, 
        start_session, end_session, mobile_numbers, class, present_school, status
      )
      SELECT 
        COALESCE(raw_values->>4, 'ADM-' || row_number::text) as student_id,
        COALESCE(student_name, raw_values->>0, 'Student') as student_name,
        COALESCE(father_name, raw_values->>1) as father_name,
        COALESCE(program, raw_values->>23) as program,
        start_session,
        end_session,
        COALESCE(mobile, raw_values->>9),
        raw_values->>15 as class,
        raw_values->>16 as present_school,
        'PENDING'::"AdmissionStatus"
      FROM prime_admissions
      WHERE (raw_values->>4) IS NOT NULL AND (raw_values->>4) != ''
      ON CONFLICT (student_id) DO NOTHING;
    `);
    const newAdmCount = await query('SELECT count(1) as c FROM admissions');
    console.log(`Populated ${newAdmCount.rows[0].c} admissions.`);
  }

  // 6. Create SUBJECTS and BATCH_SUBJECTS if not present
  console.log('Ensuring subjects and batch_subjects exist...');
  await query(`
    CREATE TABLE IF NOT EXISTS subjects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP WITH TIME ZONE
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS batch_subjects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
      subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(batch_id, subject_id)
    );
  `);

  // Seed default core subjects
  await query(`
    INSERT INTO subjects (name, code) VALUES 
      ('MATHEMATICS', 'MATH'),
      ('ENGLISH', 'ENG'),
      ('GENERAL KNOWLEDGE', 'GK'),
      ('REASONING', 'REAS'),
      ('HINDI', 'HIN'),
      ('SCIENCE', 'SCI'),
      ('SOCIAL SCIENCE', 'SST')
    ON CONFLICT (name) DO NOTHING;
  `);

  // 7. Verify Counts
  const finalStudents = await query('SELECT count(1) as c FROM students WHERE deleted_at IS NULL');
  const finalBatches = await query('SELECT count(1) as c FROM batches WHERE deleted_at IS NULL');
  const finalAdmissions = await query('SELECT count(1) as c FROM admissions WHERE deleted_at IS NULL');
  console.log(`\n✅ ALIGNMENT COMPLETE:`);
  console.log(`- Active Students: ${finalStudents.rows[0].c}`);
  console.log(`- Batches: ${finalBatches.rows[0].c}`);
  console.log(`- Admissions: ${finalAdmissions.rows[0].c}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
