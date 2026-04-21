-- 1. Create a sequence for the numeric part of the ID
-- Based on your current 7 employees, we start at 8.
CREATE SEQUENCE IF NOT EXISTS employee_seq START WITH 8;

-- 2. Update the employee_id column to use the sequence by default
-- This automatically generates IDs like 'TS-008', 'TS-009', etc.
ALTER TABLE employees 
ALTER COLUMN employee_id SET DEFAULT 'TS-' || lpad(nextval('employee_seq')::text, 3, '0');

-- 3. Ensure the employee_id stays unique
ALTER TABLE employees ADD CONSTRAINT unique_employee_id UNIQUE (employee_id);
