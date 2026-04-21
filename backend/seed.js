import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Employee from './models/Employee.js';
import Attendance from './models/Attendance.js';
import Ledger from './models/Ledger.js';
// Add this if __dirname is needed or path is needed, but we can just use dotenv.config() assuming it runs in backend dir
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_system';

const dummyEmployees = [
  {
    employeeId: 'EMP001',
    name: 'Rajesh Kumar',
    designation: 'Senior Welder',
    dailyWage: 800,
    phone: '9876543210'
  },
  {
    employeeId: 'EMP002',
    name: 'Suresh Singh',
    designation: 'Fitter',
    dailyWage: 700,
    phone: '9876543211'
  },
  {
    employeeId: 'EMP003',
    name: 'Amit Patel',
    designation: 'Helper',
    dailyWage: 400,
    phone: '9876543212'
  },
  {
    employeeId: 'EMP004',
    name: 'Vikram Sharma',
    designation: 'Technician',
    dailyWage: 750,
    phone: '9876543213'
  },
  {
    employeeId: 'EMP005',
    name: 'Ravi Verma',
    designation: 'Engineer',
    dailyWage: 1200,
    phone: '9876543214'
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Employee.deleteMany({});
    await Attendance.deleteMany({});
    await Ledger.deleteMany({});
    console.log('Cleared existing data');

    // Insert Employees
    const createdEmployees = await Employee.insertMany(dummyEmployees);
    console.log(`Inserted ${createdEmployees.length} employees`);

    // Generate Attendance and Ledger entries for the past week
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dailyAttendanceMap = new Map();
        
        for (const emp of createdEmployees) {
            // Randomly assign attendance: 70% present, 20% half, 10% absent
            const rand = Math.random();
            let status = 'present';
            if (rand > 0.9) status = 'absent';
            else if (rand > 0.7) status = 'half';
            
            dailyAttendanceMap.set(emp._id.toString(), status);

            // Random overtime or advance
            if (status === 'present' && Math.random() > 0.7) {
                const isOvertime = Math.random() > 0.5;
                await Ledger.create({
                    employeeId: emp._id,
                    date: dateStr,
                    type: isOvertime ? 'overtime' : 'advance',
                    hours: isOvertime ? Math.floor(Math.random() * 4) + 1 : 0,
                    amount: !isOvertime ? Math.floor(Math.random() * 500) + 100 : 0
                });
            }
        }

        await Attendance.create({
            date: dateStr,
            attendance: dailyAttendanceMap
        });
    }

    console.log('Generated attendance and ledger records for the past 7 days');
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
