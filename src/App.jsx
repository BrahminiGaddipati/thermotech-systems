import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Wallet, 
  LayoutDashboard, 
  FileText,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { format, startOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';

import { api } from './utils/api';
import { calculateSalary, STORAGE_KEYS, getFromStorage, saveToStorage } from './utils/storage';
import EmployeeManager from './components/EmployeeManager';
import AttendanceTracker from './components/AttendanceTracker';
import PayrollManager from './components/PayrollManager';
import MonthlyReport from './components/MonthlyReport';
import Login from './components/Login';
import MigrationTool from './components/MigrationTool';

const Dashboard = ({ employees, attendance, ledger }) => {
  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayAttendance = attendance[today] || {};
    const presentCount = Object.values(todayAttendance).filter(s => s === 'present').length;
    
    // Calculate budget for the last 6 months
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    const budgetData = last6Months.map(month => {
      let monthlyTotal = 0;
      employees.forEach(emp => {
        const salary = calculateSalary(emp, month, attendance, ledger);
        monthlyTotal += salary.total;
      });
      return {
        name: format(month, 'MMM'),
        budget: monthlyTotal
      };
    });

    const currentMonthTotal = budgetData[budgetData.length - 1].budget;

    return {
      presentCount,
      currentMonthTotal,
      budgetData
    };
  }, [employees, attendance, ledger]);

  return (
    <div>
      <div className="header">
        <h1>Dashboard</h1>
        <p>Overview of Thermotech Systems Operations</p>
      </div>
      
      <div className="grid">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Employees</p>
              <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{employees.length}</h2>
            </div>
            <div className="logo-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Users size={20} />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Present Today</p>
              <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{stats.presentCount}</h2>
            </div>
            <div className="logo-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              <Calendar size={20} />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Current Month Budget</p>
              <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>₹{stats.currentMonthTotal.toLocaleString()}</h2>
            </div>
            <div className="logo-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem', height: '400px' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Monthly Budget Trends</h3>
        <ResponsiveContainer width="100%" height="90%" minHeight={300} minWidth={0} aspect={2}>
          <AreaChart data={stats.budgetData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip 
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px' }}
              itemStyle={{ color: 'var(--primary)' }}
            />
            <Area type="monotone" dataKey="budget" stroke="var(--primary)" fillOpacity={0.1} fill="var(--primary)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('tt_active_tab') || 'dashboard');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('tt_active_tab', tab);
  };

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [ledger, setLedger] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empData, attData, ledData] = await Promise.all([
          api.getEmployees(),
          api.getAttendance(),
          api.getLedger()
        ]);
        setEmployees(empData);
        setAttendance(attData);
        setLedger(ledData);
        setDataLoaded(true);
      } catch (err) {
        console.error('Error fetching data from MongoDB:', err);
        // Fallback to local storage if API fails
        setEmployees(getFromStorage(STORAGE_KEYS.EMPLOYEES));
        setAttendance(getFromStorage(STORAGE_KEYS.ATTENDANCE, {}));
        setLedger(getFromStorage(STORAGE_KEYS.LEDGER, {}));
        setDataLoaded(true);
      }
    };
    if (isLoggedIn) fetchData();
  }, [isLoggedIn, refreshTrigger]);

  // Sync state to storage
  useEffect(() => {
    if (dataLoaded) saveToStorage(STORAGE_KEYS.EMPLOYEES, employees);
  }, [employees, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) saveToStorage(STORAGE_KEYS.ATTENDANCE, attendance);
  }, [attendance, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) saveToStorage(STORAGE_KEYS.LEDGER, ledger);
  }, [ledger, dataLoaded]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
  };

  // These functions are now just wrappers around state setters,
  // as the useEffect hooks handle persistence.
  const updateEmployees = (newEmployees) => {
    setEmployees(newEmployees);
  };

  const updateAttendance = (newAttendance) => {
    setAttendance(newAttendance);
  };

  const updateLedger = (newLedger) => {
    setLedger(newLedger);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <MigrationTool 
              employees={employees} 
              attendance={attendance} 
              ledger={ledger} 
              onComplete={() => setRefreshTrigger(t => t + 1)}
            />
            <Dashboard employees={employees} attendance={attendance} ledger={ledger} />
          </>
        );
      case 'employees':
        return <EmployeeManager employees={employees} setEmployees={setEmployees} />;
      case 'attendance':
        return <AttendanceTracker 
          employees={employees} 
          attendance={attendance} 
          setAttendance={setAttendance}
          ledger={ledger}
          setLedger={setLedger}
        />;
      case 'payroll':
        return <PayrollManager employees={employees} attendance={attendance} ledger={ledger} setLedger={setLedger} />;
      case 'reports':
        return <MonthlyReport employees={employees} attendance={attendance} ledger={ledger} />;
      default:
        return <Dashboard employees={employees} attendance={attendance} ledger={ledger} />;
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.5rem 1rem', textAlign: 'center' }}>
          <img src="/logo.jpg" alt="Thermotech Logo" style={{ width: '120px', height: 'auto', marginBottom: '0.5rem' }} />
          <div className="logo-text">
            <span className="main" style={{ fontSize: '1rem', letterSpacing: '1px' }}>THERMOTECH SYSTEMS</span>
            <span className="sub" style={{ fontSize: '0.7rem' }}>IBR Approved Boiler Erector</span>
          </div>
        </div>

        <nav className="nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => handleTabChange('employees')}
          >
            <Users size={20} /> Employees
          </button>
          <button 
            className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => handleTabChange('attendance')}
          >
            <Calendar size={20} /> Attendance
          </button>
          <button 
            className={`nav-item ${activeTab === 'payroll' ? 'active' : ''}`}
            onClick={() => handleTabChange('payroll')}
          >
            <Wallet size={20} /> Payroll
          </button>
          <button 
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleTabChange('reports')}
          >
            <FileText size={20} /> Reports
          </button>

          <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <button 
              className="nav-item"
              style={{ color: 'var(--danger)', width: '100%' }}
              onClick={handleLogout}
            >
              <ShieldCheck size={20} /> Logout Admin
            </button>
          </div>
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem', background: 'var(--primary-light)', borderRadius: '4px', fontSize: '0.8rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--primary)', fontWeight: '600' }}>Thermotech Systems</p>
          <p style={{ color: 'var(--text-muted)' }}>Attendance & Payroll v1.0</p>
        </div>
      </aside>

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
