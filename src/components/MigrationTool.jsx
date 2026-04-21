import { useState } from 'react';
import { Database, UploadCloud, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';
import { STORAGE_KEYS, getFromStorage } from '../utils/storage';

const MigrationTool = ({ employees, attendance, ledger, onComplete }) => {
  const [status, setStatus] = useState('idle'); // idle, migrating, completed, error
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [message, setMessage] = useState('');

  const startMigration = async () => {
    setStatus('migrating');
    try {
      const dbEmployees = employees; // Already fetched from DB in App.jsx
      
      // 1. Get Local Data
      const localEmployees = getFromStorage(STORAGE_KEYS.EMPLOYEES, []);
      const localAttendance = getFromStorage(STORAGE_KEYS.ATTENDANCE, {});
      const localLedger = getFromStorage(STORAGE_KEYS.LEDGER, {});

      if (localEmployees.length === 0 && Object.keys(localAttendance).length === 0) {
        setMessage('No local data found to migrate.');
        setStatus('completed');
        return;
      }

      // 2. Map Old IDs to New IDs
      // Strategy: Match by employeeId first, then by name
      const idMap = {};
      localEmployees.forEach(localEmp => {
        const match = dbEmployees.find(dbEmp => 
          (dbEmp.employeeId && dbEmp.employeeId === localEmp.employeeId) || 
          (dbEmp.name.toLowerCase() === localEmp.name.toLowerCase())
        );
        if (match) {
          idMap[localEmp.id || localEmp._id] = match._id;
        }
      });

      console.log('ID Mapping:', idMap);

      // 3. Migrate Attendance
      const dates = Object.keys(localAttendance);
      let count = 0;
      const total = dates.length + Object.keys(localLedger).length;
      setProgress({ current: 0, total });

      for (const date of dates) {
        const localDaily = localAttendance[date];
        const dbDaily = {};
        let hasData = false;

        Object.entries(localDaily).forEach(([oldId, status]) => {
          const newId = idMap[oldId];
          if (newId) {
            dbDaily[newId] = status;
            hasData = true;
          }
        });

        if (hasData) {
          await api.saveAttendance(date, dbDaily);
        }
        count++;
        setProgress(p => ({ ...p, current: count }));
      }

      // 4. Migrate Ledger
      const oldEmpIds = Object.keys(localLedger);
      for (const oldId of oldEmpIds) {
        const newId = idMap[oldId];
        if (!newId) {
          count++;
          setProgress(p => ({ ...p, current: count }));
          continue;
        }

        const entries = localLedger[oldId] || [];
        for (const entry of entries) {
          // Flatten entry and update employeeId
          await api.saveLedger({
            ...entry,
            employeeId: newId,
            id: undefined, // Remove old ID to prevent conflicts
            _id: undefined
          });
        }
        count++;
        setProgress(p => ({ ...p, current: count }));
      }

      setMessage('Migration successful! All past records have been moved to MongoDB.');
      setStatus('completed');
      if (onComplete) onComplete();

    } catch (err) {
      console.error('Migration error:', err);
      setMessage('An error occurred during migration: ' + err.message);
      setStatus('error');
    }
  };

  if (status === 'completed' && message.includes('No local data')) return null;

  return (
    <div className="card" style={{ 
      background: 'var(--primary-light)', 
      border: '1px solid var(--primary)', 
      marginBottom: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Database size={24} color="var(--primary)" />
        <div>
          <h3 style={{ margin: 0, color: 'var(--primary)' }}>Sync Local Data to Cloud</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Move your past attendance and records from this browser to your permanent database.
          </p>
        </div>
      </div>

      {status === 'idle' && (
        <button className="btn btn-primary" onClick={startMigration} style={{ alignSelf: 'flex-start' }}>
          <UploadCloud size={18} /> Start Sync Now
        </button>
      )}

      {status === 'migrating' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <RefreshCw size={20} className="spin" color="var(--primary)" />
          <div style={{ flex: 1 }}>
            <div style={{ height: '8px', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                background: 'var(--primary)', 
                width: `${(progress.current / progress.total) * 100}%`,
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: '600' }}>
              Migrating records... {progress.current} / {progress.total}
            </p>
          </div>
        </div>
      )}

      {status === 'completed' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--success)' }}>
          <CheckCircle2 size={20} />
          <p style={{ margin: 0, fontWeight: '600' }}>{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)' }}>
          <AlertCircle size={20} />
          <p style={{ margin: 0, fontWeight: '600' }}>{message}</p>
          <button className="btn btn-secondary" onClick={startMigration} style={{ marginLeft: 'auto' }}>Retry</button>
        </div>
      )}

      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default MigrationTool;
