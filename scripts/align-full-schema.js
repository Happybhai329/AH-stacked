import { initDatabase, query } from '../server/db.js';
import * as bcrypt from 'bcryptjs';

async function main() {
  await initDatabase();
  console.log('--- Aligning full database schema for Prisma ---');

  // 1. Add is_active to subjects
  await query(`
    ALTER TABLE subjects 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  `);

  // 2. Ensure UserRole enum exists
  await query(`
    DO $$ BEGIN
      CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'STAFF', 'TEACHER');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // 3. Create users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      post TEXT DEFAULT 'ACADEMIC MANAGER',
      name TEXT NOT NULL,
      email TEXT,
      mobile TEXT,
      role "UserRole" DEFAULT 'STAFF',
      is_active BOOLEAN DEFAULT true,
      last_login_at TIMESTAMP WITH TIME ZONE,
      refresh_token TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP WITH TIME ZONE
    );
  `);

  // Seed default admin and academic manager users if users is empty
  const userCount = await query('SELECT count(1) as c FROM users');
  if (Number(userCount.rows[0].c) === 0) {
    console.log('Seeding default users in users table...');
    const adminHash = await bcrypt.hash('admin123', 10);
    const tpcHash = await bcrypt.hash('Tpc@321', 10);
    await query(`
      INSERT INTO users (username, password_hash, name, role, post) VALUES 
        ('admin', $1, 'System Administrator', 'ADMIN', 'ADMINISTRATOR'),
        ('tpc@123', $2, 'Academic Manager', 'MANAGER', 'ACADEMIC MANAGER')
      ON CONFLICT (username) DO NOTHING;
    `, [adminHash, tpcHash]);
  }

  // 4. Create employees table
  await query(`
    CREATE TABLE IF NOT EXISTS employees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      email TEXT,
      department TEXT,
      designation TEXT,
      phone TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP WITH TIME ZONE
    );
  `);

  // Populate employees from prime_employees if empty
  const empCount = await query('SELECT count(1) as c FROM employees');
  if (Number(empCount.rows[0].c) === 0) {
    console.log('Populating employees from prime_employees...');
    await query(`
      INSERT INTO employees (employee_id, name, department, designation, email, phone, is_active)
      SELECT 
        employee_id,
        COALESCE(name, employee_id),
        department,
        role,
        email,
        contact,
        (status IS NULL OR LOWER(status) != 'inactive')
      FROM prime_employees
      WHERE employee_id IS NOT NULL AND employee_id != ''
      ON CONFLICT (employee_id) DO NOTHING;
    `);
  }

  // 5. Create teachers table
  await query(`
    CREATE TABLE IF NOT EXISTS teachers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      teacher_id TEXT UNIQUE NOT NULL,
      email TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP WITH TIME ZONE
    );
  `);

  // Populate teachers from prime_employees where department is TEACHING or role mentions teacher
  const teacherCount = await query('SELECT count(1) as c FROM teachers');
  if (Number(teacherCount.rows[0].c) === 0) {
    console.log('Populating teachers from prime_employees...');
    await query(`
      INSERT INTO teachers (teacher_id, name, email)
      SELECT 
        employee_id,
        COALESCE(name, employee_id),
        email
      FROM prime_employees
      WHERE employee_id IS NOT NULL 
        AND (LOWER(department) LIKE '%teach%' OR LOWER(role) LIKE '%teach%')
      ON CONFLICT (teacher_id) DO NOTHING;
    `);
  }

  console.log('Full alignment complete!');
  process.exit(0);
}

main().catch(err => {
  console.error('Alignment error:', err);
  process.exit(1);
});
