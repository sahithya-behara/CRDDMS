// pages/ResetPassword.jsx — Secure password update page
import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import Footer from '../components/Footer';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Password requirements
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNum = /\d/.test(password);
  const isMatch = password && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing security token. Please use the exact link sent to your email.');
      return;
    }
    if (!hasLength || !hasUpper || !hasLower || !hasNum) {
      setError('Password does not satisfy all institutional complexity requirements.');
      return;
    }
    if (!isMatch) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        email: emailParam,
        newPassword: password,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to reset password. The link may have expired or already been used.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between relative overflow-x-hidden font-sans">
      {/* Background Watermark */}
      <div
        className="fixed inset-0 bg-cover bg-center pointer-events-none select-none"
        style={{
          backgroundImage: `url("https://jntugv.edu.in/static/media/JNTU_PIC.ae61eebb7dc963f0dd30.png")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center 35%',
          filter: 'grayscale(50%)',
          opacity: 0.35,
          zIndex: 0,
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-[#F8FAFC]/60 via-[#EBF3FC]/70 to-[#F8FAFC]/90 pointer-events-none z-10" />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative z-20 my-auto">
        <div className="w-full max-w-md">
          {/* Header */}
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
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B3D91] tracking-tight">
              Reset Password
            </h1>
            <p className="text-[#8B6D10] text-[11px] sm:text-xs mt-1 max-w-xs mx-auto leading-relaxed font-bold uppercase tracking-wider">
              JNTU-GV CRDDMS Security Verification
            </p>
            <div className="w-14 h-1 bg-[#D4AF37] mx-auto mt-2.5 rounded-full" />
          </div>

          {/* Form Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xl p-6 sm:p-8 relative overflow-hidden transition-all">
            {!success ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#0B3D91]">Create New Password</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {emailParam ? `Account: ${emailParam}` : 'Set a strong new password for your account'}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-[#0B3D91]/10 flex items-center justify-center text-[#0B3D91]">
                    <ShieldCheck size={20} />
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="bg-red-50 border-l-4 border-red-500 text-red-700 text-xs sm:text-sm rounded-r-xl px-4 py-3 mb-5 flex items-start gap-2 animate-shake"
                  >
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1">{error}</div>
                  </div>
                )}

                {!token && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-4 mb-4">
                    <p className="font-semibold">Security Token Required</p>
                    <p className="mt-1">
                      This page requires a valid token link. Please check your email or request a new reset link.
                    </p>
                    <Link
                      to="/forgot-password"
                      className="inline-block mt-2 text-[#0B3D91] font-bold underline"
                    >
                      Request New Reset Link
                    </Link>
                  </div>
                )}

                {token && (
                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {/* New Password */}
                    <div>
                      <label htmlFor="new-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        New Password
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-slate-400">
                          <Lock size={16} />
                        </span>
                        <input
                          id="new-password"
                          type={showPass ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20 transition-all font-medium"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                        >
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-slate-400">
                          <Lock size={16} />
                        </span>
                        <input
                          id="confirm-password"
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20 transition-all font-medium"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                        >
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Password Requirements Checklist */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-[11px]">
                      <p className="font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-1">
                        Institutional Complexity Requirements:
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-slate-500">
                        <span className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-600 font-bold' : ''}`}>
                          {hasLength ? '✓' : '○'} 8+ Characters
                        </span>
                        <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 font-bold' : ''}`}>
                          {hasUpper ? '✓' : '○'} Uppercase (A-Z)
                        </span>
                        <span className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 font-bold' : ''}`}>
                          {hasLower ? '✓' : '○'} Lowercase (a-z)
                        </span>
                        <span className={`flex items-center gap-1.5 ${hasNum ? 'text-emerald-600 font-bold' : ''}`}>
                          {hasNum ? '✓' : '○'} Number (0-9)
                        </span>
                      </div>
                      {confirmPassword && (
                        <p className={`pt-1 font-semibold ${isMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !hasLength || !hasUpper || !hasLower || !hasNum || !isMatch}
                      className="w-full bg-[#0B3D91] hover:bg-[#1E5AA8] text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                      {loading ? 'Updating Password…' : 'Confirm Password Update'}
                    </button>
                  </form>
                )}

                <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                  <Link
                    to="/login"
                    className="text-xs text-[#0B3D91] hover:text-[#D4AF37] font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Return to Sign In
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-2 space-y-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-[#0B3D91]">
                  Password Successfully Reset
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Your institutional credentials have been updated securely. You can now access your account using your new password.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-[#0B3D91] hover:bg-[#1E5AA8] text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md cursor-pointer"
                  >
                    Sign In to Portal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer className="relative z-20" />
    </div>
  );
}
