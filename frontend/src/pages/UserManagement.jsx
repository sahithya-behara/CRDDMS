// pages/UserManagement.jsx — Institutional User Management & Super Admin Registration Approval
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtimeSubscription } from '../context/RealtimeContext';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Shield, CheckCircle2, XCircle, UserCheck, AlertTriangle, Loader2, Clock, Mail } from 'lucide-react';

const ROLES = ['super_admin', 'admin', 'dept_head', 'faculty', 'staff', 'compliance_reviewer'];

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'pending' : 'active');
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPending, setLoadingPending] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [rejectUser, setRejectUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionProcessing, setActionProcessing] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', department_id: '' });

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, []);

  const loadPending = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoadingPending(true);
    try {
      const res = await api.get('/users/pending-registrations');
      setPendingUsers(res.data.registrations || []);
    } catch (err) {
      console.error('Failed to load pending registrations:', err);
    } finally {
      setLoadingPending(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/users'),
      api.get('/departments'),
      isSuperAdmin ? api.get('/users/pending-registrations') : Promise.resolve({ data: { registrations: [] } })
    ])
      .then(([u, d, p]) => {
        setUsers(u.data.users || []);
        setDepts(d.data.departments || []);
        if (isSuperAdmin) setPendingUsers(p.data.registrations || []);
      })
      .catch((err) => {
        console.error('Error initializing user management:', err);
      })
      .finally(() => setLoading(false));
  }, [isSuperAdmin]);

  // Real-time auto sync when users register or are approved/rejected
  useRealtimeSubscription(
    ['REGISTRATION_PENDING_APPROVAL', 'REGISTRATION_STATUS_CHANGED', 'USER_UPDATED'],
    useCallback(() => {
      loadUsers();
      if (isSuperAdmin) loadPending();
    }, [loadUsers, loadPending, isSuperAdmin])
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      setShowAdd(false);
      setForm({ name: '', email: '', password: '', role: 'staff', department_id: '' });
      setFeedback({ type: 'success', message: 'User account created and verification link dispatched.' });
      loadUsers();
      if (isSuperAdmin) loadPending();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to add user.' });
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editUser.id}`, form);
      setEditUser(null);
      setFeedback({ type: 'success', message: 'User profile updated successfully.' });
      loadUsers();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update user.' });
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      department_id: u.department_id || '',
      password: '',
      account_status: u.account_status || 'ACTIVE',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      await api.delete(`/users/${id}`);
      setFeedback({ type: 'success', message: 'User deleted successfully.' });
      loadUsers();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to delete user.' });
    }
  };

  const handleToggle = async (u) => {
    try {
      await api.put(`/users/${u.id}`, { is_active: !u.is_active });
      loadUsers();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update user state.' });
    }
  };

  // ── Super Admin Approval Actions ─────────────────────────
  const handleApprove = async (reg) => {
    setActionProcessing(reg.id);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.post(`/users/${reg.id}/approve-registration`);
      setFeedback({ type: 'success', message: res.data.message || `Account for ${reg.name} approved successfully.` });
      await Promise.all([loadUsers(), loadPending()]);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Approval action failed.' });
    } finally {
      setActionProcessing(null);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectUser) return;
    setActionProcessing(rejectUser.id);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.post(`/users/${rejectUser.id}/reject-registration`, { reason: rejectReason });
      setFeedback({ type: 'success', message: res.data.message || `Registration for ${rejectUser.name} rejected.` });
      setRejectUser(null);
      setRejectReason('');
      await Promise.all([loadUsers(), loadPending()]);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Rejection action failed.' });
    } finally {
      setActionProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B3D91] tracking-tight">User Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Role-based governance, staff provisioning, and institutional registration approvals
          </p>
        </div>
        <button
          onClick={() => {
            setForm({ name: '', email: '', password: '', role: 'staff', department_id: '' });
            setShowAdd(true);
          }}
          className="btn-primary flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl shadow-sm text-sm"
        >
          <Plus size={16} /> Add Institutional User
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          role="alert"
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-xs font-bold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Super Admin Tabbed Switcher */}
      {isSuperAdmin && (
        <div className="flex border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'border-[#0B3D91] text-[#0B3D91]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCheck size={18} />
            <span>Pending Registrations</span>
            {pendingUsers.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-amber-500 text-white animate-pulse">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'border-[#0B3D91] text-[#0B3D91]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Shield size={18} />
            <span>Active Institutional Accounts ({users.length})</span>
          </button>
        </div>
      )}

      {/* ── SECTION 1: Pending Registrations Queue (Super Admin) ── */}
      {isSuperAdmin && activeTab === 'pending' && (
        <div className="card overflow-hidden p-0 border border-slate-200 shadow-sm rounded-2xl bg-white">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50/70 to-orange-50/40 border-b border-amber-200/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Clock size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Pending Registration Approvals</h2>
                <p className="text-xs text-slate-500">
                  Users who verified email ownership and are awaiting Super Admin activation
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300/60">
              {pendingUsers.length} Awaiting Review
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Candidate User</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Requested Role</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Email Status</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Registered On</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Super Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingPending ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <Loader2 className="w-8 h-8 text-[#0B3D91] animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Loading pending registration queue…</p>
                    </td>
                  </tr>
                ) : pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2 opacity-80" />
                      <p className="text-sm font-bold text-slate-700">No Pending Registrations</p>
                      <p className="text-xs text-slate-500 mt-0.5">All verified users have been reviewed and approved.</p>
                    </td>
                  </tr>
                ) : (
                  pendingUsers.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#0B3D91] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                            {reg.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900">{reg.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail size={12} /> {reg.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                        {reg.department_name ? `${reg.department_name} (${reg.department_code})` : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {reg.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={13} /> Email Verified
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 font-medium">
                        {reg.created_at ? new Date(reg.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(reg)}
                            disabled={actionProcessing === reg.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                            title="Approve registration and activate account"
                          >
                            {actionProcessing === reg.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                            Approve
                          </button>

                          <button
                            onClick={() => {
                              setRejectUser(reg);
                              setRejectReason('');
                            }}
                            disabled={actionProcessing === reg.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                            title="Reject this registration"
                          >
                            <XCircle size={14} />
                            Reject
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
      )}

      {/* ── SECTION 2: Active / All Institutional Users ── */}
      {(!isSuperAdmin || activeTab === 'active') && (
        <div className="card overflow-hidden p-0 border border-slate-200 shadow-sm rounded-2xl bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Account State</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Joined</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0B3D91] to-[#1E5AA8] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                            {u.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#0B3D91] border border-blue-200">
                          {u.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                        {u.department_name ? `${u.department_name} (${u.department_code})` : '—'}
                      </td>
                      <td className="px-4 py-4">
                        {u.account_status === 'ACTIVE' || (!u.account_status && u.is_active) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ● Active
                          </span>
                        ) : u.account_status === 'PENDING_SUPER_ADMIN_APPROVAL' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ⏳ Pending Approval
                          </span>
                        ) : u.account_status === 'PENDING_EMAIL_VERIFICATION' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            ✉️ Unverified
                          </span>
                        ) : u.account_status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            ✕ Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 font-medium">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-[#0B3D91] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleToggle(u)}
                            className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                              u.is_active
                                ? 'text-amber-700 hover:bg-amber-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={u.is_active ? 'Suspend Account' : 'Activate Account'}
                          >
                            {u.is_active ? 'Suspend' : 'Activate'}
                          </button>
                          {isSuperAdmin && currentUser.id !== u.id && (
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal: Add User ── */}
      {showAdd && (
        <Modal title="Add Institutional User" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="Dr. K. Ramesh"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Institutional Email *</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="ramesh@jntugv.edu.in"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Initial Password * (Min. 8 chars)</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="Password@123"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Department Assignment</label>
              <select
                className="input-field cursor-pointer"
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
              >
                <option value="">None / Administrative</option>
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name} ({d.department_code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Institutional Role *</label>
              <select
                className="input-field cursor-pointer"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Provision User
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Edit User ── */}
      {editUser && (
        <Modal title={`Edit Profile — ${editUser.name}`} onClose={() => setEditUser(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Department</label>
              <select
                className="input-field cursor-pointer"
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
              >
                <option value="">None / Administrative</option>
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name} ({d.department_code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Institutional Role</label>
              <select
                className="input-field cursor-pointer"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Reset Password (leave blank to retain existing)</label>
              <input
                type="password"
                className="input-field"
                placeholder="New password (optional)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setEditUser(null)} className="btn-ghost">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Reject Registration ── */}
      {rejectUser && (
        <Modal title="Reject User Registration" onClose={() => setRejectUser(null)}>
          <form onSubmit={handleReject} className="space-y-4">
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 leading-relaxed">
              You are about to reject the registration request for <strong>{rejectUser.name}</strong> ({rejectUser.email}). The user will not receive portal access.
            </div>

            <div>
              <label className="label">Administrative Reason (will be communicated politely)</label>
              <textarea
                rows={3}
                className="input-field text-xs"
                placeholder="e.g. Ineligible faculty role or unverified institutional appointment."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setRejectUser(null)} className="btn-ghost text-xs">
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionProcessing === rejectUser.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                {actionProcessing === rejectUser.id ? 'Processing…' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
