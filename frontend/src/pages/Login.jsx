// pages/Login.jsx — University-style professional login page

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';

export default function Login() {
  const [email,    setEmail]    = useState('superadmin@crddms.edu');
  const [password, setPassword] = useState('Password@123');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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

      <div className="w-full max-w-md relative z-20">
        {/* Institution Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#cbd5e1] p-1.5 overflow-hidden">
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

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-[#cbd5e1] shadow-xl p-8 relative overflow-hidden">
          <h2 className="text-2xl font-bold text-[#0B3D91] mb-1.5">Welcome Back</h2>
          <p className="text-sm text-[#8B6D10] font-semibold mb-6">Sign in to your institutional account</p>

          {error && (
            <div className="bg-[#d32f2f]/10 border border-[#d32f2f] text-[#d32f2f] text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Mail size={16} />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field input-with-left-icon"
                  placeholder="you@institution.edu"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Lock size={16} />
                </span>
                <input
                  id="password"
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

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-[#cbd5e1] bg-[#F8FAFC] text-[#0B3D91] focus:ring-[#0B3D91]"
                />
                <span className="text-sm text-[#8B6D10] font-medium">Remember me</span>
              </label>
              <button type="button" className="text-sm text-[#0B3D91] hover:underline font-bold cursor-pointer">
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-btn"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2 shadow-sm cursor-pointer"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-3 bg-[#D4AF37]/10 border border-[#cbd5e1] rounded-xl">
            <p className="text-xs text-[#8B6D10] text-center leading-relaxed font-semibold">
              <span className="font-bold text-[#0B3D91]">Demo Credentials:</span>
              <br />
              superadmin@crddms.edu / Password@123
            </p>
          </div>
        </div>

        <p className="text-center text-[#8B6D10] text-xs mt-6 font-semibold">
          Don't have an institutional profile?{' '}
          <Link to="/register" className="text-[#0B3D91] font-bold hover:underline">
            Register Staff Here
          </Link>
          <br />
          <span className="opacity-70 mt-1 block font-normal">© 2026 CRDDMS • JNTU-GV Institutional Vault</span>
        </p>
      </div>
    </div>
  );
}
