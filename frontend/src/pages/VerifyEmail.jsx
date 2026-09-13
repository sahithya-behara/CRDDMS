// pages/VerifyEmail.jsx — Institutional Email Verification Page
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle2, AlertTriangle, Loader2, ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import Footer from '../components/Footer';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';

  const [status, setStatus] = useState(token ? 'verifying' : 'missing_token');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState(emailParam);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');
  const [resendPreviewUrl, setResendPreviewUrl] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('missing_token');
      setMessage('No verification token provided in the URL. Please click the verification link in your email.');
      return;
    }

    let isMounted = true;
    api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!isMounted) return;
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully. Your registration is now awaiting Super Admin approval.');
      })
      .catch((err) => {
        if (!isMounted) return;
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link has expired or is invalid. Please request a new verification link.');
      });

    return () => { isMounted = false; };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendError('');
    setResendSuccess('');
    setResendPreviewUrl('');
    if (!resendEmail || !resendEmail.includes('@')) {
      setResendError('Please enter a valid institutional email address.');
      return;
    }

    setResending(true);
    try {
      const res = await api.post('/auth/resend-verification', { email: resendEmail.trim().toLowerCase() });
      setResendSuccess(res.data.message || 'If an account exists and is pending verification, a new link has been dispatched.');
      if (res.data?.emailPreviewUrl) {
        setResendPreviewUrl(res.data.emailPreviewUrl);
      }
    } catch (err) {
      setResendError(err.response?.data?.message || 'Failed to dispatch verification email. Please try again shortly.');
    } finally {
      setResending(false);
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
          opacity: 0.40,
          zIndex: 0,
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-[#F8FAFC]/50 via-[#EBF3FC]/60 to-[#F8FAFC]/80 pointer-events-none z-10" />

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative z-20 my-auto">
        <div className="w-full max-w-lg">
          {/* Institutional Header */}
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
              Institutional Email Verification
            </p>
            <div className="w-14 h-1 bg-[#D4AF37] mx-auto mt-2 rounded-full" />
          </div>

          {/* Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#cbd5e1] shadow-2xl p-6 sm:p-8 relative overflow-hidden">
            {/* Status 1: Verifying */}
            {status === 'verifying' && (
              <div className="text-center py-8 space-y-4">
                <div className="relative inline-flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-[#0B3D91]/20 border-t-[#0B3D91] rounded-full animate-spin" />
                  <Loader2 className="w-8 h-8 text-[#0B3D91] absolute animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-[#0B3D91]">Verifying Institutional Email…</h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Validating cryptographic token against the JNTU-GV security registry. Please hold…
                </p>
              </div>
            )}

            {/* Status 2: Success */}
            {status === 'success' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <CheckCircle2 size={36} />
                  </div>
                  <h2 className="text-2xl font-bold text-[#0B3D91]">Email Verified Successfully</h2>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Your institutional email ownership has been confirmed.
                  </p>
                </div>

                {/* Workflow Progression Stepper */}
                <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Approval Pipeline</p>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Step 1: Email Ownership Verified</p>
                      <p className="text-xs text-slate-500">Single-use cryptographic validation completed.</p>
                    </div>
                  </div>

                  <div className="w-0.5 h-4 bg-amber-300 ml-3" />

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 animate-pulse">
                      ⏳
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Step 2: Super Admin Review &amp; Approval</p>
                      <p className="text-xs text-amber-700 font-medium">Currently queued in the Super Admin Approval Queue.</p>
                    </div>
                  </div>

                  <div className="w-0.5 h-4 bg-slate-200 ml-3" />

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-400">Step 3: Portal Access Activation</p>
                      <p className="text-xs text-slate-400">You will receive an official notification email once approved.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    <strong>Next Steps:</strong> You will not be able to log in until the Super Administrator reviews and activates your account. You will receive an email confirmation once activated.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-[#0B3D91] to-[#1E5AA8] hover:from-[#093276] hover:to-[#174886] shadow-md transition-all"
                  >
                    Go to Portal Login <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )}

            {/* Status 3: Error / Expired / Missing Token */}
            {(status === 'error' || status === 'missing_token') && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <AlertTriangle size={34} />
                  </div>
                  <h2 className="text-xl font-bold text-[#0B3D91]">Verification Link Invalid or Expired</h2>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {message}
                  </p>
                </div>

                {/* Resend Verification Form */}
                <div className="border-t border-slate-200 pt-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Mail size={16} className="text-[#0B3D91]" /> Resend Verification Link
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Enter your registered institutional email address to receive a fresh verification link.
                  </p>

                  {resendSuccess && (
                    <div className="p-3 mb-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
                      ✓ {resendSuccess}
                    </div>
                  )}

                  {resendPreviewUrl && (
                    <div className="mb-4">
                      <a
                        href={resendPreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#0B3D91] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-sm"
                      >
                        🔗 Open Real-Time Email in Browser (Live Test Inbox) ↗
                      </a>
                    </div>
                  )}

                  {resendError && (
                    <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-medium">
                      ✕ {resendError}
                    </div>
                  )}

                  <form onSubmit={handleResend} className="space-y-3">
                    <div>
                      <input
                        type="email"
                        required
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        placeholder="e.g. staff.member@crddms.edu"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={resending}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#0B3D91] hover:bg-[#082d6b] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                    >
                      {resending ? <Loader2 size={16} className="animate-spin" /> : 'Send New Verification Link'}
                    </button>
                  </form>
                </div>

                <div className="text-center pt-2">
                  <Link to="/login" className="text-xs font-semibold text-[#0B3D91] hover:underline">
                    ← Return to Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
