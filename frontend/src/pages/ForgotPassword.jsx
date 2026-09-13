// pages/ForgotPassword.jsx — Official JNTU-GV Password Recovery Portal
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import Footer from '../components/Footer';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your registered institutional email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setPreviewUrl(res.data.emailPreviewUrl || '');
      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to process request. Please try again or contact the JNTU-GV IT helpdesk.'
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
              Password Recovery
            </h1>
            <p className="text-[#8B6D10] text-[11px] sm:text-xs mt-1 max-w-xs mx-auto leading-relaxed font-bold uppercase tracking-wider">
              JNTU-GV CRDDMS Account Access Management
            </p>
            <div className="w-14 h-1 bg-[#D4AF37] mx-auto mt-2.5 rounded-full" />
          </div>

          {/* Form / Confirmation Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xl p-6 sm:p-8 relative overflow-hidden transition-all">
            {!submitted ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#0B3D91]">Forgot Password?</h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                      Enter your registered email address to receive recovery instructions.
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

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="recovery-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400">
                        <Mail size={16} />
                      </span>
                      <input
                        id="recovery-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError('');
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20 transition-all font-medium"
                        placeholder="e.g. yourname@crddms.edu"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0B3D91] hover:bg-[#1E5AA8] text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                    {loading ? 'Submitting Request…' : 'Send Password Reset Link'}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                  <Link
                    to="/login"
                    className="text-xs text-[#0B3D91] hover:text-[#D4AF37] font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Back to Sign In
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-2 space-y-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-[#0B3D91]">
                  Recovery Request Submitted
                </h2>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2">
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    If an account is associated with <strong>{email}</strong>, a secure password recovery link has been dispatched.
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    ⏱️ For institutional security, the recovery link is valid for <strong>15 minutes</strong> and can only be used once.
                  </p>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Did not receive an email? Please check your junk or spam folder, or contact the JNTU-GV IT Department help desk.
                </p>

                <div className="pt-2 flex flex-col gap-2.5">
                  {previewUrl && (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#0B3D91] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-sm"
                    >
                      🔗 Open Real-Time Email in Browser (Live Test Inbox) ↗
                    </a>
                  )}

                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 w-full bg-[#0B3D91] hover:bg-[#1E5AA8] text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm"
                  >
                    <ArrowLeft size={16} />
                    Return to Sign In
                  </Link>
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
