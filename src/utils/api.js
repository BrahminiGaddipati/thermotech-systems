const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return 'http://localhost:5000/api';
  
  // If the URL doesn't start with http/https, add https://
  if (!envUrl.startsWith('http')) {
    return `https://${envUrl}`;
  }
  return envUrl;
};

const API_BASE = getApiBase();

export const api = {
  // Employees
  getEmployees: async () => {
    const res = await fetch(`${API_BASE}/employees`);
    if (!res.ok) throw new Error('Failed to fetch employees');
    return res.json();
  },
  saveEmployee: async (employeeData) => {
    const res = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to save employee');
    }
    return res.json();
  },
  updateEmployee: async (id, employeeData) => {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update employee');
    }
    return res.json();
  },
  deleteEmployee: async (id) => {
    const res = await fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete employee');
    return res.json();
  },

  // Attendance
  getAttendance: async () => {
    const res = await fetch(`${API_BASE}/attendance`);
    if (!res.ok) throw new Error('Failed to fetch attendance');
    return res.json();
  },
  saveAttendance: async (date, attendance) => {
    const res = await fetch(`${API_BASE}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, attendance })
    });
    if (!res.ok) throw new Error('Failed to save attendance');
    return res.json();
  },

  // Ledger
  getLedger: async () => {
    const res = await fetch(`${API_BASE}/ledger`);
    if (!res.ok) throw new Error('Failed to fetch ledger');
    return res.json();
  },
  saveLedger: async (ledgerData) => {
    const res = await fetch(`${API_BASE}/ledger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ledgerData)
    });
    if (!res.ok) throw new Error('Failed to save ledger entry');
    return res.json();
  }
};
