export const STORAGE_KEYS = {
  EMPLOYEES: 'tt_employees',
  ATTENDANCE: 'tt_attendance',
  LEDGER: 'tt_ledger', // For advances and overtime
};

export const getFromStorage = (key, defaultValue = []) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

export const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const calculateSalary = (employee, month, attendance, ledger) => {
  if (!employee) return 0;
  
  const dailyWage = parseFloat(employee.dailyWage) || 0;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  
  let totalWorkDays = 0;
  let overtimeHours = 0;
  let advances = 0;

  // Calculate attendance for the month
  Object.entries(attendance).forEach(([dateStr, employees]) => {
    const date = new Date(dateStr);
    if (date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear()) {
      const status = employees[employee._id];
      if (status === 'present') totalWorkDays += 1;
      else if (status === 'half') totalWorkDays += 0.5;
    }
  });

  // Calculate ledger items (advances and overtime)
  const employeeLedger = ledger[employee._id] || [];
  employeeLedger.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear()) {
      advances += parseFloat(item.amount) || 0;
      overtimeHours += parseFloat(item.hours) || 0;
    }
  });

  // Weekly off logic (optional, but let's keep it simple: just total days worked)
  const attendanceSalary = totalWorkDays * dailyWage;
  
  // Overtime calculation per reference: (Hours / 8) * Daily Wage
  const overtimeSalary = (overtimeHours / 8) * dailyWage;
  
  return {
    base: attendanceSalary,
    overtime: Math.round(overtimeSalary),
    advance: advances,
    total: Math.round(attendanceSalary + overtimeSalary - advances),
    grossSalary: Math.round(attendanceSalary + overtimeSalary),
    daysWorked: totalWorkDays,
    otHours: overtimeHours
  };
};
