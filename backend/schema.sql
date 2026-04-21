-- 1. Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT UNIQUE,
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    daily_wage NUMERIC NOT NULL,
    phone TEXT,
    photo TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Attendance Table (Flattened for relational integrity)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- 'present', 'half', 'absent'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, employee_id)
);

-- 3. Ledgers Table
CREATE TABLE IF NOT EXISTS ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC DEFAULT 0,
    hours NUMERIC DEFAULT 0,
    type TEXT CHECK (type IN ('advance', 'overtime')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Recommended but you can disable for initial testing
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledgers ENABLE ROW LEVEL SECURITY;

-- Creating simple policies to allow all actions for now (you should refine these later)
CREATE POLICY "Allow all for authenticated users" ON employees FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON attendance FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON ledgers FOR ALL USING (true);
