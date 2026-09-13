// pages/Register.jsx — Professional institutional registration with two-step approval flow
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Eye, EyeOff, Lock, Mail, User, BookOpen, Loader2, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import Footer from '../components/Footer';

import { DEFAULT_DEPARTMENTS } from '../constants/departments';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [deptId, setDeptId] = useState('');
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.get('/departments')
      .then(r => {
        if (isMounted) {
          const list = r.data.departments;
          if (Array.isArray(list) && list.length > 0) {
            setDepartments(list);
          } else {
            setDepartments(DEFAULT_DEPARTMENTS);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch live departments from API, using institutional defaults:', err);
        if (isMounted) {
          setDepartments(DEFAULT_DEPARTMENTS);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingDepts(false);
      });
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your entries.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /\d/.test(password);
    if (!hasUpper || !hasLower || !hasNum) {
      setError('Password must contain uppercase, lowercase, and numeric characters.');
      return;
    }

    setLoading(true);

    try {
      const resData = await register(
        name.trim(),
        email.trim().toLowerCase(),
        password,
        confirmPassword,
        role,
        deptId ? parseInt(deptId, 10) : null
      );
      setRegisteredEmail(email.trim().toLowerCase());
      setPreviewUrl(resData?.emailPreviewUrl || '');
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please contact administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between relative overflow-x-hidden font-sans">
      {/* Background Entrance Watermark */}
      <div
        className="fixed inset-0 bg-cover bg-center pointer-events-none select-none"
        style={{
          backgroundImage: `url("https://jntugv.edu.in/static/media/JNTU_PIC.ae61eebb7dc963f0dd30.png")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center 35%',
          filter: 'grayscale(50%)',
          opacity: 0.40,
          zIndex: 0,
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-[#F8FAFC]/50 via-[#EBF3FC]/60 to-[#F8FAFC]/80 pointer-events-none z-10" />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative z-20 my-auto">
        <div className="w-full max-w-md my-4">
          {/* Institution Header */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block group" title="Return to Portal Home">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md border border-[#0B3D91]/20 p-1.5 overflow-hidden group-hover:scale-105 transition-transform">
                <img
                  src={`${import.meta.env.BASE_URL}jntugv_logo.jpg`}
                  alt="JNTU-GV Official Crest"
                  className="w-full h-full object-contain"
                />
              </div>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B3D91] tracking-tight">CRDDMS</h1>
            <p className="text-[#8B6D10] text-[11px] sm:text-xs mt-1 max-w-xs mx-auto leading-relaxed font-bold uppercase tracking-wider">
              JNTU-GV College Records &amp; Document Management System
            </p>
            <div className="w-12 h-1 bg-[#D4AF37] mx-auto mt-2 rounded-full" />
          </div>

          {/* Registration Card or Post-Submission Stepper Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#cbd5e1] shadow-2xl p-6 sm:p-8 relative overflow-hidden">
            {submitted ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <CheckCircle2 size={36} />
                  </div>
                  <h2 className="text-2xl font-bold text-[#0B3D91]">Registration Received!</h2>
                  <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
                    Institutional Email Verification Required
                  </p>
                </div>

                <div className="p-4 bg-[#f8fafc] border border-slate-200 rounded-xl space-y-3">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    An official verification link has been dispatched to:
                  </p>
                  <div className="p-2.5 bg-white border border-[#0B3D91]/20 rounded-lg text-center font-mono font-bold text-xs text-[#0B3D91] break-all">
                    {registeredEmail}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#0B3D91] text-white flex items-center justify-center font-bold text-[10px]">1</span>
                      <span>Open the email and click <strong>Verify My Email</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">2</span>
                      <span>Super Admin reviews and activates your account</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg text-xs text-amber-900 leading-relaxed">
                  <strong>Notice:</strong> In accordance with university policy, login access is denied until both email verification and Super Admin approval are completed.
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  {previewUrl && (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-[#0B3D91] bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-sm transition-all"
                    >
                      🔗 Open Real-Time Email in Browser (Live Test Inbox) ↗
                    </a>
                  )}

                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-[#0B3D91] to-[#1E5AA8] hover:from-[#093276] hover:to-[#174886] shadow-md transition-all"
                  >
                    Proceed to Login Screen <ArrowRight size={16} />
                  </Link>

                  <Link
                    to={`/verify-email?email=${encodeURIComponent(registeredEmail)}`}
                    className="text-center text-xs font-semibold text-[#0B3D91] hover:underline"
                  >
                    Resend Verification Link
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-[#0B3D91] mb-1 font-sans">Staff Registration</h2>
                <p className="text-xs text-[#8B6D10] font-semibold mb-6">Create a new institutional profile</p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-5 font-medium leading-relaxed">
                    ✕ {error}
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
                        placeholder="e.g. Dr. K. Ramesh"
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
                        placeholder="ramesh@jntugv.edu.in"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="label">Password * (Min. 8 chars, A-Z, a-z, 0-9)</label>
                    <div className="input-wrapper">
                      <span className="input-icon-left">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field input-with-left-icon input-with-right-icon"
                        placeholder="••••••••"
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

                  {/* Confirm Password */}
                  <div>
                    <label className="label">Confirm Password *</label>
                    <div className="input-wrapper">
                      <span className="input-icon-left">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field input-with-left-icon input-with-right-icon"
                        placeholder="Re-enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="input-icon-right"
                      >
                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
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
                        <option value="faculty">Faculty Member</option>
                        <option value="dept_head">Department Head (HOD)</option>
                        <option value="compliance_reviewer">Compliance Reviewer</option>
                      </select>
                    </div>
                  </div>

                  {/* Two-step notice */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed">
                    ℹ️ <strong>Security Requirement:</strong> Newly registered accounts require email verification followed by Super Admin approval before activation.
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2 shadow-sm cursor-pointer"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                    {loading ? 'Submitting Registration…' : 'Submit Registration'}
                  </button>
                </form>

                <p className="text-center text-[#8B6D10] text-xs mt-6 font-semibold">
                  Already registered?{' '}
                  <Link to="/login" className="text-[#0B3D91] font-bold hover:underline">
                    Login Here
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer className="relative z-20" />
    </div>
  );
}
