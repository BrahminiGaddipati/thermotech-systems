import { useState } from 'react';
import { Wallet, Plus, IndianRupee, Clock, Calendar as CalendarIcon, History, TrendingDown, ArrowUpRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { calculateSalary } from '../utils/storage';
import { api } from '../utils/api';

const PayrollManager = ({ employees, attendance, ledger, setLedger }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [showOvertimeForm, setShowOvertimeForm] = useState(false);
  
  const [ledgerForm, setLedgerForm] = useState({
    employeeId: '',
    amount: '',
    hours: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: ''
  });

  const handleLedgerSubmit = async (type) => {
    if (!ledgerForm.employeeId) return;

    try {
      const payload = {
        employeeId: ledgerForm.employeeId,
        type,
        date: ledgerForm.date,
        amount: ledgerForm.amount,
        hours: ledgerForm.hours,
        note: ledgerForm.note
      };
      
      const newEntry = await api.saveLedger(payload);

      const employeeLedger = ledger[ledgerForm.employeeId] || [];
      setLedger({
        ...ledger,
        [ledgerForm.employeeId]: [...employeeLedger, newEntry]
      });

      setLedgerForm({ employeeId: '', amount: '', hours: '', date: format(new Date(), 'yyyy-MM-dd'), note: '' });
      setShowAdvanceForm(false);
      setShowOvertimeForm(false);
    } catch (err) {
      console.error('Error saving ledger entry:', err);
    }
  };

  return (
    <div>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Payroll & Ledger</h1>
          <p>Calculations for {format(selectedMonth, 'MMMM yyyy')}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowAdvanceForm(!showAdvanceForm)}>
            <ArrowUpRight size={18} /> Give Advance
          </button>
          <button className="btn btn-primary" onClick={() => setShowOvertimeForm(!showOvertimeForm)}>
            <Clock size={18} /> Add Overtime
          </button>
        </div>
      </div>

      {(showAdvanceForm || showOvertimeForm) && (
        <div className="card" style={{ marginBottom: '2rem', border: `1px solid ${showAdvanceForm ? 'var(--danger)' : 'var(--primary)'}` }}>
          <h2>{showAdvanceForm ? 'Record Salary Advance' : 'Record Overtime Hours'}</h2>
          <div className="grid" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>Select Employee</label>
              <select 
                value={ledgerForm.employeeId}
                onChange={(e) => setLedgerForm({...ledgerForm, employeeId: e.target.value})}
              >
                <option value="">Choose...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{showAdvanceForm ? 'Advance Amount (₹)' : 'Overtime Hours'}</label>
              <input 
                type="number" 
                value={showAdvanceForm ? ledgerForm.amount : ledgerForm.hours}
                onChange={(e) => setLedgerForm({...ledgerForm, [showAdvanceForm ? 'amount' : 'hours']: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input 
                type="date" 
                value={ledgerForm.date}
                onChange={(e) => setLedgerForm({...ledgerForm, date: e.target.value})}
              />
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', background: showAdvanceForm ? 'var(--danger)' : 'var(--primary)' }}
            onClick={() => handleLedgerSubmit(showAdvanceForm ? 'advance' : 'overtime')}
          >
            Confirm Entry
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Days Worked</th>
                <th>OT Hours</th>
                <th>Base Pay</th>
                <th>OT Pay</th>
                <th>Total Salary</th>
                <th>Advance</th>
                <th>Net Salary</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No database records found.</td></tr>
              ) : (
                employees.map(emp => {
                  const stats = calculateSalary(emp, selectedMonth, attendance, ledger);
                  return (
                    <tr key={emp._id}>
                      <td style={{ fontWeight: '600' }}>{emp.name}</td>
                      <td>{stats.daysWorked}</td>
                      <td>{stats.otHours}</td>
                      <td>₹{stats.base.toLocaleString()}</td>
                      <td style={{ color: 'var(--success)' }}>+₹{stats.overtime.toLocaleString()}</td>
                      <td style={{ fontWeight: '600' }}>₹{stats.grossSalary.toLocaleString()}</td>
                      <td style={{ color: 'var(--danger)' }}>-₹{stats.advance.toLocaleString()}</td>
                      <td>
                        <div style={{ padding: '0.4rem 0.8rem', background: 'var(--primary-light)', borderRadius: '4px', color: 'var(--primary)', fontWeight: '700', display: 'inline-block' }}>
                          ₹{stats.total.toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollManager;
