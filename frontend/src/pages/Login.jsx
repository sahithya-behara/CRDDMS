// pages/Login.jsx — Official JNTU-GV University Login Portal
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import Footer from '../components/Footer';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email.trim()) {
      setError('Please enter your institutional email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setError('Please enter your account password.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/dashboard');
    } catch (err) {
      const respData = err.response?.data;
      setErrorCode(respData?.code || '');
      setErrorReason(respData?.reason || '');
      setError(
        respData?.message ||
        'Authentication failed. Please verify your credentials or contact IT administration.'
      );
    } finally {
      setLoading(false);
    }
  };

  const [errorCode, setErrorCode] = useState('');
  const [errorReason, setErrorReason] = useState('');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between relative overflow-x-hidden font-sans">
      {/* Layer 1: College entrance background watermark */}
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
      {/* Layer 2: Subtle gradient overlay for readable contrast */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#F8FAFC]/50 via-[#EBF3FC]/60 to-[#F8FAFC]/80 pointer-events-none z-10" />

      {/* Main Login Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative z-20 my-auto">
        <div className="w-full max-w-md">
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
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B3D91] tracking-tight">
              JNTU-GV CRDDMS
            </h1>
            <p className="text-[#8B6D10] text-[11px] sm:text-xs mt-1 max-w-xs mx-auto leading-relaxed font-bold uppercase tracking-wider">
              College Records Digitalization &amp; Document Management System
            </p>
            <div className="w-14 h-1 bg-[#D4AF37] mx-auto mt-2.5 rounded-full" />
          </div>

          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xl p-6 sm:p-8 relative overflow-hidden transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0B3D91]">Sign In</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Access your institutional portal account</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#0B3D91]/10 flex items-center justify-center text-[#0B3D91]">
                <ShieldCheck size={20} />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className={`text-xs sm:text-sm rounded-xl p-3.5 mb-5 border-l-4 animate-shake ${
                  errorCode === 'AWAITING_SUPER_ADMIN_APPROVAL'
                    ? 'bg-amber-50 border-amber-500 text-amber-900'
                    : errorCode === 'EMAIL_NOT_VERIFIED'
                    ? 'bg-blue-50 border-[#0B3D91] text-[#0B3D91]'
                    : 'bg-red-50 border-red-500 text-red-700'
                }`}
              >
                <div className="font-bold mb-1">
                  {errorCode === 'AWAITING_SUPER_ADMIN_APPROVAL' && '⏳ Registration Under Review'}
                  {errorCode === 'EMAIL_NOT_VERIFIED' && '✉️ Email Verification Required'}
                  {errorCode === 'ACCOUNT_REJECTED' && '✕ Registration Not Approved'}
                  {errorCode === 'ACCOUNT_SUSPENDED' && '⚠️ Account Suspended'}
                </div>
                <div className="leading-relaxed">{error}</div>
                {errorReason && (
                  <div className="mt-1.5 text-xs text-red-800 bg-red-100/50 p-2 rounded">
                    <strong>Reason:</strong> {errorReason}
                  </div>
                )}
                {errorCode === 'EMAIL_NOT_VERIFIED' && (
                  <div className="mt-2.5 pt-2 border-t border-blue-200">
                    <Link
                      to={`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`}
                      className="inline-flex items-center gap-1 font-bold text-xs text-[#0B3D91] underline hover:text-[#082d6b]"
                    >
                      Click here to resend verification email →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Institutional Email / ID
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20 transition-all font-medium"
                    placeholder="name@crddms.edu"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20 transition-all font-medium"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0B3D91] focus:ring-[#0B3D91] cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#0B3D91] hover:text-[#D4AF37] font-bold hover:underline transition-colors cursor-pointer"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="login-btn"
                disabled={loading}
                className="w-full bg-[#0B3D91] hover:bg-[#1E5AA8] text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? 'Authenticating…' : 'Sign In to Portal'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs gap-2 text-slate-500 font-medium">
              <span>Need an authorized account?</span>
              <Link
                to="/register"
                className="text-[#0B3D91] font-bold hover:underline hover:text-[#D4AF37] transition-colors"
              >
                Register Staff Access
              </Link>
            </div>
          </div>

          <div className="text-center mt-4">
            <Link
              to="/"
              className="text-xs text-slate-500 hover:text-[#0B3D91] font-semibold transition-colors inline-flex items-center gap-1"
            >
              ← Back to University Home
            </Link>
          </div>
        </div>
      </div>

      {/* Official Mandatory Institutional Footer */}
      <Footer className="relative z-20" />
    </div>
  );
}
