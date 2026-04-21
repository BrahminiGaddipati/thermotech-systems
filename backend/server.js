import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 5000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_KEY:', SUPABASE_KEY ? 'SET (length: ' + SUPABASE_KEY.length + ')' : 'NOT SET');

const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

if (!supabase) {
  console.error('WARNING: Supabase client not initialized. Set SUPABASE_URL and SUPABASE_KEY.');
}

// Helper to map DB row to frontend employee object (_id compatibility)
const mapEmployee = (emp) => ({
  ...emp,
  _id: emp.id,
  dailyWage: Number(emp.daily_wage),
  employeeId: emp.employee_id,
  joiningDate: emp.joining_date
});

// Employees
app.get('/api/employees', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name');
    
    if (error) throw error;
    res.json(data.map(mapEmployee));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const insertData = {
      name: req.body.name,
      designation: req.body.designation,
      daily_wage: req.body.dailyWage,
      phone: req.body.phone,
      photo: req.body.photo,
      joining_date: req.body.joiningDate
    };

    // Only include employee_id if it was explicitly provided (e.g. legacy or manual overwrite)
    if (req.body.employeeId) {
      insertData.employee_id = req.body.employeeId;
    }

    const { data, error } = await supabase
      .from('employees')
      .insert(insertData)
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(mapEmployee(data));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .update({
        employee_id: req.body.employeeId,
        name: req.body.name,
        designation: req.body.designation,
        daily_wage: req.body.dailyWage,
        phone: req.body.phone,
        photo: req.body.photo,
        joining_date: req.body.joiningDate
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(mapEmployee(data));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Attendance
app.get('/api/attendance', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*');
    
    if (error) throw error;

    // Convert flattened rows back to Map structure
    const result = {};
    data.forEach(row => {
      const dateStr = row.date;
      if (!result[dateStr]) result[dateStr] = {};
      result[dateStr][row.employee_id] = row.status;
    });
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  const { date, attendance } = req.body;
  try {
    const rows = Object.entries(attendance).map(([empId, status]) => ({
      date,
      employee_id: empId,
      status
    }));

    const { data, error } = await supabase
      .from('attendance')
      .upsert(rows, { onConflict: 'date,employee_id' })
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Ledger
app.get('/api/ledger', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ledgers')
      .select('*');
    
    if (error) throw error;

    const result = {};
    data.forEach(row => {
      if (!result[row.employee_id]) result[row.employee_id] = [];
      result[row.employee_id].push({
        ...row,
        _id: row.id,
        employeeId: row.employee_id
      });
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/ledger', async (req, res) => {
  const { employeeId, date, amount, hours, type, note } = req.body;
  try {
    // Standard Ledger entry
    const { data, error } = await supabase
      .from('ledgers')
      .upsert({
        employee_id: employeeId,
        date,
        amount: Number(amount) || 0,
        hours: Number(hours) || 0,
        type: type || 'advance',
        note
      }, { onConflict: 'employee_id,date,type' }) // Assuming unique per day per type for sync safety
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json({
      ...data,
      _id: data.id,
      employeeId: data.employee_id
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    supabase_url_set: !!SUPABASE_URL,
    supabase_key_set: !!SUPABASE_KEY,
    supabase_initialized: !!supabase,
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Supabase connected to: ${SUPABASE_URL}`);
});
