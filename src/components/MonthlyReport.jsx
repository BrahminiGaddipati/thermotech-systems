import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, FileText, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { calculateSalary } from '../utils/storage';

const MonthlyReport = ({ employees, attendance, ledger }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(selectedMonth),
      end: endOfMonth(selectedMonth)
    });
  }, [selectedMonth]);

  const changeMonth = (offset) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedMonth(newDate);
  };

  const getStatusChar = (status) => {
    switch (status) {
      case 'present': return 'P';
      case 'half': return 'H';
      case 'absent': return 'A';
      default: return '-';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'var(--success)';
      case 'half': return 'var(--warning)';
      case 'absent': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="report-container">
      {/* Print-only header */}
      <div className="print-header" style={{ display: 'none', textAlign: 'center', marginBottom: '20px', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/logo.jpg" alt="Thermotech Logo" style={{ maxHeight: '80px', maxWidth: '300px', objectFit: 'contain', marginBottom: '10px' }} />
        <h2 style={{ margin: 0, fontSize: '18pt', color: '#000', fontFamily: 'var(--font-main)' }}>THERMOTECH SYSTEMS</h2>
        <p style={{ margin: '5px 0 0', fontSize: '12pt', color: '#555', fontFamily: 'var(--font-main)' }}>IBR Approved Boiler Erector</p>
      </div>

      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Monthly Performance Report</h1>
          <p>Detailed view of {format(selectedMonth, 'MMMM yyyy')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
            <button className="nav-item" style={{ width: 'auto', padding: '0.5rem' }} onClick={() => changeMonth(-1)}>
              <ChevronLeft size={20} />
            </button>
            <span style={{ fontWeight: '600', minWidth: '100px', textAlign: 'center' }}>{format(selectedMonth, 'MMM yyyy')}</span>
            <button className="nav-item" style={{ width: 'auto', padding: '0.5rem' }} onClick={() => changeMonth(1)}>
              <ChevronRight size={20} />
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div className="table-container" style={{ maxHeight: '70vh' }}>
          <table className="report-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-card)' }}>
              <tr>
                <th style={{ position: 'sticky', left: 0, zIndex: 20, background: 'var(--bg-card)', minWidth: '150px' }}>Employee</th>
                {daysInMonth.map(day => (
                  <th key={day.toString()} style={{ minWidth: '30px', textAlign: 'center', fontSize: '0.65rem' }}>
                    {format(day, 'd')}<br/>{format(day, 'E')[0]}
                  </th>
                ))}
                <th style={{ textAlign: 'center', background: 'var(--primary-light)', color: 'var(--primary)', minWidth: '80px' }}>Basic Sal</th>
                <th style={{ textAlign: 'center', background: 'var(--primary-light)', color: 'var(--primary)', minWidth: '60px' }}>OT Pay</th>
                <th style={{ textAlign: 'center', background: 'var(--primary-light)', color: 'var(--primary)', minWidth: '80px' }}>Total Salary</th>
                <th style={{ textAlign: 'center', background: 'var(--primary-light)', color: 'var(--primary)', minWidth: '80px' }}>Advance</th>
                <th style={{ textAlign: 'center', background: 'var(--primary-light)', color: 'var(--primary)', minWidth: '100px' }}>Net Salary</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={daysInMonth.length + 5} style={{ textAlign: 'center', padding: '3rem' }}>No employees found</td></tr>
              ) : (
                employees.map(emp => {
                  const stats = calculateSalary(emp, selectedMonth, attendance, ledger);
                  return (
                    <tr key={emp._id}>
                      <td style={{ position: 'sticky', left: 0, zIndex: 5, background: 'var(--bg-card)', fontWeight: '600', borderRight: '2px solid var(--border)', fontSize: '0.85rem' }}>
                        {emp.name}
                      </td>
                      {daysInMonth.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const status = attendance[dateStr]?.[emp._id];
                        const employeeLedger = ledger[emp._id] || [];
                        const dailyEntries = employeeLedger.filter(item => item.date === dateStr);
                        const dailyOT = dailyEntries.reduce((sum, item) => sum + (parseFloat(item.hours) || 0), 0);
                        const dailyAdvance = dailyEntries.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                        
                        return (
                          <td key={dateStr} style={{ 
                            textAlign: 'center', 
                            fontSize: '0.65rem', 
                            color: getStatusColor(status), 
                            fontWeight: status ? '700' : '400',
                            padding: '0.25rem 0'
                          }}>
                            <div>{getStatusChar(status)}</div>
                            {dailyOT > 0 && <div style={{ fontSize: '0.55rem', color: 'var(--primary)', marginTop: '2px' }}>{dailyOT}h</div>}
                            {dailyAdvance > 0 && <div style={{ fontSize: '0.55rem', color: 'var(--danger)', marginTop: '2px' }}>₹{dailyAdvance}</div>}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center', fontWeight: '600', fontSize: '0.85rem' }}>₹{stats.base.toLocaleString()}</td>
                      <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>₹{stats.overtime.toLocaleString()}</td>
                      <td style={{ textAlign: 'center', fontWeight: '600', fontSize: '0.85rem', background: 'rgba(var(--primary-rgb), 0.05)' }}>₹{stats.grossSalary.toLocaleString()}</td>
                      <td style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--danger)' }}>₹{stats.advance.toLocaleString()}</td>
                      <td style={{ textAlign: 'center', fontWeight: '700', color: 'var(--primary)', fontSize: '0.9rem' }}>
                        ₹{stats.total.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '2rem', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '12px', height: '12px', background: 'var(--success)', borderRadius: '2px' }}></span>
          <span style={{ fontSize: '0.875rem' }}>P: Present</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '12px', height: '12px', background: 'var(--warning)', borderRadius: '2px' }}></span>
          <span style={{ fontSize: '0.875rem' }}>H: Half Day</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '12px', height: '12px', background: 'var(--danger)', borderRadius: '2px' }}></span>
          <span style={{ fontSize: '0.875rem' }}>A: Absent</span>
        </div>
      </div>

      <style>{`
        .report-table th, .report-table td {
          padding: 0.75rem 0.5rem;
          border-bottom: 1px solid var(--border);
          border-right: 1px solid var(--border-light);
        }
        @media print {
          @page {
            size: landscape;
            margin: 10mm;
          }
          .print-header { 
            display: flex !important; 
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            margin-bottom: 20px !important;
            padding-bottom: 10px !important;
            border-bottom: 2px solid #ccc !important;
          }
          .sidebar, .btn, .header div:last-child { display: none !important; }
          .main-content { margin: 0; padding: 0 !important; overflow: visible !important; }
          .app-container { display: block !important; overflow: visible !important; }
          .card { border: none; box-shadow: none; padding: 0 !important; overflow: visible !important; margin-top: 10px !important; }
          .report-container { width: 100% !important; padding: 0 !important; }
          .table-container { overflow: visible !important; max-height: none !important; }
          .report-table { width: 100% !important; border-collapse: collapse !important; table-layout: auto !important; }
          .report-table th, .report-table td { 
            font-size: 7pt !important; 
            padding: 1pt 0.5pt !important; 
            position: static !important;
            background: transparent !important;
            border: 1px solid #ccc !important;
          }
          .report-table th { font-weight: bold !important; }
          .report-table thead { display: table-header-group !important; }
          .report-table tr { page-break-inside: avoid !important; }
        }
      `}</style>
    </div>
  );
};

export default MonthlyReport;
