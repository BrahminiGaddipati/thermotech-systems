import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Employee from './models/Employee.js';
import Attendance from './models/Attendance.js';
import Ledger from './models/Ledger.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Employees
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/employees', async (req, res) => {
  const employee = new Employee(req.body);
  try {
    const newEmployee = await employee.save();
    res.status(201).json(newEmployee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEmployee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Attendance
app.get('/api/attendance', async (req, res) => {
  try {
    const attendance = await Attendance.find();
    const result = {};
    attendance.forEach(a => {
      if (a.date) {
        result[a.date] = a.attendance ? Object.fromEntries(a.attendance) : {};
      }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  const { date, attendance } = req.body;
  try {
    let record = await Attendance.findOne({ date });
    if (record) {
      record.attendance = attendance;
      await record.save();
    } else {
      record = new Attendance({ date, attendance });
      await record.save();
    }
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Ledger
app.get('/api/ledger', async (req, res) => {
  try {
    const ledger = await Ledger.find();
    const result = {};
    ledger.forEach(l => {
      if (!result[l.employeeId]) result[l.employeeId] = [];
      result[l.employeeId].push(l);
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/ledger', async (req, res) => {
  const { employeeId, date, amount, hours, type, note } = req.body;
  try {
    // For manual entries in PayrollManager (which creates new entries)
    // or AttendanceTracker (which updates daily entries)
    if (req.body.id) {
        // This is a new unique entry from PayrollManager
        const newEntry = new Ledger(req.body);
        await newEntry.save();
        return res.status(201).json(newEntry);
    }

    // AttendanceTracker logic: update or create entry for specific date/employee
    let entry = await Ledger.findOne({ employeeId, date });
    if (entry) {
      if (amount !== undefined) entry.amount = amount;
      if (hours !== undefined) entry.hours = hours;
      if (type !== undefined) entry.type = type;
      if (note !== undefined) entry.note = note;
      await entry.save();
    } else {
      entry = new Ledger({ employeeId, date, amount, hours, type: type || 'advance', note });
      await entry.save();
    }
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
