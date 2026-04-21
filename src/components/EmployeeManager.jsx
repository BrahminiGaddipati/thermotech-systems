import { useState } from 'react';
import { Plus, User, Briefcase, IndianRupee, Trash2, Edit } from 'lucide-react';
import { api } from '../utils/api';

const EmployeeManager = ({ employees, setEmployees }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    designation: '',
    dailyWage: '',
    phone: '',
    photo: ''
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (employee) => {
    setFormData({
      employeeId: employee.employeeId || '',
      name: employee.name,
      designation: employee.designation,
      dailyWage: employee.dailyWage,
      phone: employee.phone || '',
      photo: employee.photo || ''
    });
    setEditingId(employee._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.dailyWage || !formData.designation) {
      alert('Please fill in all required fields (Name, Designation, Wage)');
      return;
    }

    try {
      if (editingId) {
        const updated = await api.updateEmployee(editingId, formData);
        setEmployees(employees.map(emp => emp._id === editingId ? updated : emp));
      } else {
        const newEmployee = await api.saveEmployee(formData);
        setEmployees([...employees, newEmployee]);
      }
      setFormData({ employeeId: '', name: '', designation: '', dailyWage: '', phone: '', photo: '' });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      console.error('Error saving employee:', err);
      alert(`Error saving employee: ${err.message}`);
    }
  };

  const deleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.deleteEmployee(id);
        setEmployees(employees.filter(emp => emp._id !== id));
      } catch (err) {
        console.error('Error deleting employee:', err);
      }
    }
  };

  return (
    <div>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Employees</h1>
          <p>Manage your workforce details</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            if (showForm) {
              setEditingId(null);
              setFormData({ employeeId: '', name: '', designation: '', dailyWage: '', phone: '', photo: '' });
            }
            setShowForm(!showForm);
          }}
        >
          <Plus size={18} /> {showForm ? 'Cancel' : 'Add Employee'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', maxWidth: '600px' }}>
          <form onSubmit={handleSubmit}>
            {editingId && (
              <div className="form-group">
                <label>Employee ID</label>
                <input 
                  type="text" 
                  value={formData.employeeId}
                  disabled
                  style={{ background: 'var(--bg-card)', cursor: 'not-allowed' }}
                />
              </div>
            )}

            <div className="form-group">
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Designation</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <select 
                    style={{ paddingLeft: '2.5rem', width: '100%', height: '42px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)' }}
                    value={formData.designation}
                    onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    required
                  >
                    <option value="">Select Designation</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Welder">Welder</option>
                    <option value="Helper">Helper</option>
                    <option value="Grinder">Grinder</option>
                    <option value="Fitter">Fitter</option>
                    <option value="Technician">Technician</option>
                    <option value="Foreman">Foreman</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Daily Wage (₹)</label>
                <div style={{ position: 'relative' }}>
                  <IndianRupee size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="number" 
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="e.g. 1200"
                    value={formData.dailyWage}
                    onChange={(e) => setFormData({...formData, dailyWage: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. +91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Profile Photo</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>
            {formData.photo && (
              <div style={{ marginBottom: '1rem' }}>
                <img src={formData.photo} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              {editingId ? 'Update Employee Data' : 'Save Employee Data'}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee Details</th>
                <th>Designation</th>
                <th>Contact</th>
                <th>Daily Wage</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No employees added yet. Click 'Add Employee' to get started.
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
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
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({emp.employeeId})</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{emp.designation || 'N/A'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{emp.phone || 'N/A'}</td>
                    <td><span style={{ color: 'var(--primary)', fontWeight: '600' }}>₹{emp.dailyWage}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          className="nav-item" 
                          style={{ width: 'auto', padding: '0.5rem' }}
                          onClick={() => handleEdit(emp)}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="nav-item" 
                          style={{ width: 'auto', padding: '0.5rem', color: 'var(--danger)' }}
                          onClick={() => deleteEmployee(emp._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManager;
