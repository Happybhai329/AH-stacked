import { initDatabase, query } from '../server/db.js';

async function main() {
  await initDatabase();
  console.log('Aligning employees table...');

  await query(`
    ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS employee_id TEXT,
      ADD COLUMN IF NOT EXISTS phone TEXT,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
  `);

  try {
    await query(`
      UPDATE employees SET
        employee_id = COALESCE(employee_id, "employeeId", emp_id),
        phone = COALESCE(phone, contact)
      WHERE employee_id IS NULL OR phone IS NULL;
    `);
  } catch (e) {
    console.warn('Update notice:', e.message);
  }

  // Ensure unique constraint on employee_id
  try {
    await query(`ALTER TABLE employees ADD CONSTRAINT employees_employee_id_key UNIQUE (employee_id);`);
  } catch (e) {
    console.warn('Unique constraint notice:', e.message);
  }

  // Check if id needs to be UUID
  // If id is text, Prisma might require UUID if schema says @db.Uuid
  // Let's check schema: id String @id @default(uuid()) @db.Uuid
  console.log('Checking id type...');
  const idType = await query("SELECT data_type FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'id'");
  if (idType.rows[0]?.data_type === 'text') {
    console.log('Converting id to UUID...');
    // Drop primary key if exists
    try {
      await query(`ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_pkey CASCADE;`);
    } catch(e) {}
    
    // Add id_uuid
    await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();`);
    await query(`ALTER TABLE employees DROP COLUMN id CASCADE;`);
    await query(`ALTER TABLE employees RENAME COLUMN id_uuid TO id;`);
    await query(`ALTER TABLE employees ADD PRIMARY KEY (id);`);
  }

  console.log('Employees table aligned!');
  process.exit(0);
}
main();
