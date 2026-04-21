import { useState } from 'react';
import { Check, X, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { api } from '../utils/api';

const AttendanceTracker = ({ employees, attendance, setAttendance, ledger, setLedger }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dailyAttendance = attendance[dateStr] || {};

  const markAttendance = async (employeeId, status) => {
    const updatedDaily = { ...dailyAttendance, [employeeId]: status };
    try {
      await api.saveAttendance(dateStr, updatedDaily);
      setAttendance({ ...attendance, [dateStr]: updatedDaily });
    } catch (err) {
      console.error('Error saving attendance:', err);
    }
  };

  const handleLedgerChange = async (employeeId, field, value) => {
    try {
      const entry = await api.saveLedger({ employeeId, date: dateStr, [field]: value, type: field === 'hours' ? 'overtime' : 'advance' });
      
      const employeeLedger = ledger[employeeId] || [];
      const dateEntryIndex = employeeLedger.findIndex(item => item.date === dateStr);
      
      let updatedLedger;
      if (dateEntryIndex >= 0) {
        updatedLedger = [...employeeLedger];
        updatedLedger[dateEntryIndex] = entry;
      } else {
        updatedLedger = [...employeeLedger, entry];
      }

      setLedger({
        ...ledger,
        [employeeId]: updatedLedger
      });
    } catch (err) {
      console.error('Error saving ledger entry:', err);
    }
  };

  const changeDate = (days) => {
    setSelectedDate(addDays(selectedDate, days));
  };

  if (employees.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>No Employees Found</h2>
        <p style={{ color: 'var(--text-muted)' }}>You need to add employees first before marking attendance.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Attendance</h1>
          <p>Mark daily attendance for {format(selectedDate, 'MMMM do, yyyy')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <button className="nav-item" style={{ width: 'auto', padding: '0.5rem' }} onClick={() => changeDate(-1)}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
            <CalendarIcon size={18} color="var(--primary)" />
            {format(selectedDate, 'EEE, MMM d')}
          </div>
          <button className="nav-item" style={{ width: 'auto', padding: '0.5rem' }} onClick={() => changeDate(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Designation</th>
                <th style={{ textAlign: 'center' }}>OT Hours</th>
                <th style={{ textAlign: 'center' }}>Advance (₹)</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const status = dailyAttendance[emp._id];
                const employeeLedger = ledger[emp._id] || [];
                const dailyLedger = employeeLedger.find(item => item.date === dateStr) || {};
                
                return (
                  <tr key={emp._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {emp.photo ? (
                          <img src={emp.photo} alt={emp.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div className="logo-icon" style={{ width: '36px', height: '36px', borderRadius: '4px', fontSize: '0.8rem' }}>
                            {emp.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                        )}
                        <span style={{ fontWeight: '500' }}>{emp.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{emp.designation}</td>
                    <td>
                      <input 
                        type="number" 
                        placeholder="0"
                        style={{ width: '70px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', textAlign: 'center' }}
                        value={dailyLedger.hours || ''}
                        onChange={(e) => handleLedgerChange(emp._id, 'hours', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        placeholder="0"
                        style={{ width: '90px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', textAlign: 'center' }}
                        value={dailyLedger.amount || ''}
                        onChange={(e) => handleLedgerChange(emp._id, 'amount', e.target.value)}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button 
                          onClick={() => markAttendance(emp._id, 'present')}
                          className={`btn ${status === 'present' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                          <Check size={16} /> Present
                        </button>
                        <button 
                          onClick={() => markAttendance(emp._id, 'half')}
                          className={`btn ${status === 'half' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: status === 'half' ? 'var(--warning)' : '' }}
                        >
                          <Clock size={16} /> Half Day
                        </button>
                        <button 
                          onClick={() => markAttendance(emp._id, 'absent')}
                          className={`btn ${status === 'absent' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: status === 'absent' ? 'var(--danger)' : '' }}
                        >
                          <X size={16} /> Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={async () => {
          const bulk = {};
          employees.forEach(e => bulk[e._id] = 'present');
          try {
            await api.saveAttendance(dateStr, bulk);
            setAttendance({ ...attendance, [dateStr]: bulk });
          } catch (err) {
            console.error('Error saving bulk attendance:', err);
          }
        }}>
          Mark All Present
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => alert('Attendance saved for ' + dateStr)}>
          Save Today's Records
        </button>
      </div>
    </div>
  );
};

export default AttendanceTracker;
