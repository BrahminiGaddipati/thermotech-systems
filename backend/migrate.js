import mongoose from 'mongoose';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY; // Service Role Key is best for migration

if (!MONGODB_URI || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing environment variables. Need MONGODB_URI, SUPABASE_URL, and SUPABASE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// MongoDB Schemas (simplified for migration)
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }));
const Attendance = mongoose.model('Attendance', new mongoose.Schema({}, { strict: false }));
const Ledger = mongoose.model('Ledger', new mongoose.Schema({}, { strict: false }));

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Migrate Employees
    console.log('Fetching employees from MongoDB...');
    const mongoEmployees = await Employee.find({});
    console.log(`Found ${mongoEmployees.length} employees.`);

    const idMap = {}; // mongoId -> supabaseId

    for (const emp of mongoEmployees) {
      const { _id, __v, createdAt, updatedAt, ...empData } = emp.toObject();
      
      const { data, error } = await supabase
        .from('employees')
        .upsert({
          employee_id: empData.employeeId,
          name: empData.name,
          designation: empData.designation,
          daily_wage: empData.dailyWage,
          phone: empData.phone,
          photo: empData.photo,
          joining_date: empData.joiningDate,
          created_at: createdAt,
          updated_at: updatedAt
        }, { onConflict: 'employee_id' })
        .select()
        .single();

      if (error) {
        console.error(`Error migrating employee ${empData.name}:`, error.message);
      } else {
        idMap[_id.toString()] = data.id;
        console.log(`Migrated employee: ${empData.name}`);
      }
    }

    // 2. Migrate Attendance
    console.log('Fetching attendance from MongoDB...');
    const mongoAttendance = await Attendance.find({});
    console.log(`Found ${mongoAttendance.length} attendance documents.`);

    for (const att of mongoAttendance) {
      const { date, attendance: attMap } = att.toObject();
      const attendanceRows = [];

      if (attMap) {
        Object.entries(attMap).forEach(([oldEmpId, status]) => {
          const newEmpId = idMap[oldEmpId];
          if (newEmpId) {
            attendanceRows.push({
              date: date,
              employee_id: newEmpId,
              status: status
            });
          }
        });
      }

      if (attendanceRows.length > 0) {
        const { error } = await supabase
          .from('attendance')
          .upsert(attendanceRows, { onConflict: 'date,employee_id' });

        if (error) {
          console.error(`Error migrating attendance for ${date}:`, error.message);
        } else {
          console.log(`Migrated attendance for ${date}`);
        }
      }
    }

    // 3. Migrate Ledgers
    console.log('Fetching ledgers from MongoDB...');
    const mongoLedgers = await Ledger.find({});
    console.log(`Found ${mongoLedgers.length} ledger entries.`);

    for (const led of mongoLedgers) {
      const { _id, __v, createdAt, updatedAt, ...ledData } = led.toObject();
      const newEmpId = idMap[ledData.employeeId?.toString()];

      if (newEmpId) {
        const { error } = await supabase
          .from('ledgers')
          .upsert({
            employee_id: newEmpId,
            date: ledData.date,
            amount: ledData.amount,
            hours: ledData.hours,
            type: ledData.type,
            note: ledData.note,
            created_at: createdAt,
            updated_at: updatedAt
          });

        if (error) {
          console.error(`Error migrating ledger entry ${_id}:`, error.message);
        } else {
          console.log(`Migrated ledger entry for date ${ledData.date}`);
        }
      }
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
