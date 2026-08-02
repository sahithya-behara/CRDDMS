// pages/UserManagement.jsx — Admin user manager

import { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Shield } from 'lucide-react';

const ROLES = ['super_admin','admin','dept_head','faculty','staff','compliance_reviewer'];

export default function UserManagement() {
  const [users,    setUsers]    = useState([]);
  const [depts,    setDepts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'staff', department_id:'' });

  useEffect(() => {
    Promise.all([api.get('/users'), api.get('/departments')]).then(([u, d]) => {
      setUsers(u.data.users || []);
      setDepts(d.data.departments || []);
    }).finally(() => setLoading(false));
  }, []);

  const loadUsers = () => api.get('/users').then(r => setUsers(r.data.users || []));

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/auth/register', form);
    setShowAdd(false);
    setForm({ name:'', email:'', password:'', role:'staff', department_id:'' });
    loadUsers();
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    await api.put(`/users/${editUser.id}`, form);
    setEditUser(null);
    loadUsers();
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, department_id: user.department_id || '', password:'' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await api.delete(`/users/${id}`);
    loadUsers();
  };

  const handleToggle = async (user) => {
    await api.put(`/users/${user.id}`, { is_active: !user.is_active });
    loadUsers();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-sub">Manage institutional users and their roles</p>
        </div>
        <button onClick={() => { setForm({ name:'', email:'', password:'', role:'staff', department_id:'' }); setShowAdd(true); }}
          className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bgpage">
              <tr>
                <th className="table-header">User</th>
                <th className="table-header">Role</th>
                <th className="table-header">Department</th>
                <th className="table-header">Status</th>
                <th className="table-header">Joined</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10">
                  <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{u.name}</p>
                        <p className="text-xs text-slate/50">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <Shield size={12} className="text-secondary" />
                      <span className="text-xs capitalize">{u.role?.replace('_',' ')}</span>
                    </div>
                  </td>
                  <td className="table-cell text-xs">{u.department_code || '—'}</td>
                  <td className="table-cell">
                    <badge className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </badge>
                  </td>
                  <td className="table-cell text-xs text-slate/50">
                    {new Date(u.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(u)} className="btn-icon"><Edit2 size={14} /></button>
                      <button onClick={() => handleToggle(u)} className={`btn-icon ${u.is_active ? 'text-warning' : 'text-success'}`} title={u.is_active ? 'Deactivate' : 'Activate'}>
                        <Shield size={14} />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="btn-icon text-danger"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New User">
        <form onSubmit={handleAdd} className="space-y-4">
          <div><label className="label">Full Name *</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required /></div>
          <div><label className="label">Email *</label>
            <input type="email" className="input-field" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required /></div>
          <div><label className="label">Password *</label>
            <input type="password" className="input-field" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Role</label>
              <select className="input-field" value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
              </select></div>
            <div><label className="label">Department</label>
              <select className="input-field" value={form.department_id} onChange={e => setForm(f=>({...f,department_id:e.target.value}))}>
                <option value="">None</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.department_code}</option>)}
              </select></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create User</button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        <form onSubmit={handleEdit} className="space-y-4">
          <div><label className="label">Full Name</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} /></div>
          <div><label className="label">New Password (leave blank to keep)</label>
            <input type="password" className="input-field" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Role</label>
              <select className="input-field" value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
              </select></div>
            <div><label className="label">Department</label>
              <select className="input-field" value={form.department_id} onChange={e => setForm(f=>({...f,department_id:e.target.value}))}>
                <option value="">None</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.department_code}</option>)}
              </select></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setEditUser(null)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
