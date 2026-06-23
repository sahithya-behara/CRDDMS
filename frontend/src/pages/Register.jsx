// pages/Register.jsx — Professional institutional staff registration page
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Eye, EyeOff, Lock, Mail, User, BookOpen, Loader2, ShieldCheck } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [deptId, setDeptId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/departments')
      .then(r => setDepartments(r.data.departments || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await register(name, email, password, role, deptId ? parseInt(deptId) : null);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please contact administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Layer 1: College entrance image covering the whole page */}
      <div
        className="fixed inset-0 bg-cover bg-center pointer-events-none select-none"
        style={{
          backgroundImage: `url("https://jntugv.edu.in/static/media/JNTU_PIC.ae61eebb7dc963f0dd30.png")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center 35%',
          filter: 'grayscale(60%)',
          opacity: 0.60,
          zIndex: 0,
        }}
      />
      {/* Layer 2: Soft gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#F8FAFC]/30 via-[#EBF3FC]/40 to-[#F8FAFC]/70 pointer-events-none z-10" />

      <div className="w-full max-w-md relative z-20 my-8">
        {/* Institution Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#cbd5e1] p-1.5 overflow-hidden">
            <img
              src={`${import.meta.env.BASE_URL}jntugv_logo.jpg`}
              alt="JNTU-GV Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-[#0B3D91] tracking-tight">CRDDMS</h1>
          <p className="text-[#8B6D10] text-xs mt-2 max-w-xs mx-auto leading-relaxed font-semibold uppercase tracking-wider">
            JNTU-GV College Records &amp; Document Management System
          </p>
          <div className="w-12 h-1 bg-[#D4AF37] mx-auto mt-3 rounded-full" />
        </div>

        {/* Register Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-[#cbd5e1] shadow-xl p-8 relative overflow-hidden">
          <h2 className="text-2xl font-bold text-[#0B3D91] mb-1.5 font-sans">Staff Registration</h2>
          <p className="text-sm text-[#8B6D10] font-semibold mb-6">Create a new institutional profile</p>

          {success && (
            <div className="bg-[#2e7d32]/10 border border-[#2e7d32] text-[#2e7d32] text-sm rounded-xl px-4 py-3 mb-5 font-semibold">
              Profile registered successfully! Redirecting to login...
            </div>
          )}

          {error && (
            <div className="bg-[#d32f2f]/10 border border-[#d32f2f] text-[#d32f2f] text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="label">Full Name *</label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field input-with-left-icon"
                  placeholder="Dean / Faculty / Staff name"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="label">Institutional Email *</label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field input-with-left-icon"
                  placeholder="you@jntugv.edu.in"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password *</label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Lock size={16} />
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field input-with-left-icon input-with-right-icon"
                  placeholder="Minimum 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="input-icon-right"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="label">Department Assignment *</label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <BookOpen size={16} />
                </span>
                <select
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="input-field input-with-left-icon cursor-pointer"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.department_name} ({d.department_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role Select */}
            <div>
              <label className="label">Institutional Role *</label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <ShieldCheck size={16} />
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-field input-with-left-icon cursor-pointer"
                  required
                >
                  <option value="staff">Department Staff (Upload Only)</option>
                  <option value="verifier">Document Verifier</option>
                  <option value="compliance_reviewer">Compliance Reviewer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4 shadow-sm cursor-pointer"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Creating Profile…' : 'Register Profile'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#8B6D10] text-xs mt-6 font-semibold">
          Already registered?{' '}
          <Link to="/login" className="text-[#0B3D91] font-bold hover:underline">
            Login Here
          </Link>
        </p>
      </div>
    </div>
  );
}
