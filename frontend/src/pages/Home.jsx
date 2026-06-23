import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Simple count up utility to animate statistics cleanly
function CountUp({ end, duration = 1200, suffix = "", decimals = 0 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = parseFloat(end);
    if (isNaN(target)) return;

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = progress * target;
      setCount(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  const targetClean = end.toString().replace(/%/g, '').replace(/\+/g, '');
  if (isNaN(parseFloat(targetClean))) {
    return <span>{end}</span>;
  }

  return (
    <span>
      {count.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      {suffix}
    </span>
  );
}

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  
  // Forms states
  const [antiraggingForm, setAntiraggingForm] = useState({ name: '', rollNumber: '', department: '', phone: '', details: '' });
  const [antiraggingSubmitted, setAntiraggingSubmitted] = useState(false);
  
  const [alumniForm, setAlumniForm] = useState({ name: '', email: '', phone: '', batch: '', department: '', company: '', role: '' });
  const [alumniSubmitted, setAlumniSubmitted] = useState(false);

  const [stats, setStats] = useState({
    departments: 10,
    students: 5,
    faculty: 5,
    documents: 10,
    ocrProcessed: 5,
    storageBytes: 4326724,
  });

  useEffect(() => {
    setIsLoaded(true);
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Fetch live system stats from public endpoint
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/public/stats`);
        const data = await response.json();
        if (data.success) {
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching live system stats:", error);
      }
    };
    fetchStats();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-[#0F172A] scroll-smooth relative overflow-x-hidden">
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-slide-up {
          animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes logoAppearance {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-logo-appearance {
          animation: logoAppearance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Layer 1: College entrance image covering the whole page with parallax */}
      <div
        className="fixed inset-0 bg-cover bg-center grayscale pointer-events-none select-none"
        style={{
          backgroundImage: `url("https://jntugv.edu.in/static/media/JNTU_PIC.ae61eebb7dc963f0dd30.png")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center 35%',
          filter: 'grayscale(60%)', // Watermark visible, grayscale adjusted, no blur
          transform: `translateY(${-scrollY * 0.12}px) scale(1.05)`, 
          opacity: isLoaded ? 0.60 : 0, // Opacity set to 60% for optimal visibility
          transition: 'opacity 1.5s ease-out',
          zIndex: 0,
        }}
      />

      {/* Announcements Marquee Ticker */}
      <div className="bg-[#D4AF37] text-[#0F172A] py-2 px-4 text-xs font-bold z-50 sticky top-0 border-b border-[#0B3D91]/10 overflow-hidden select-none">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <span className="bg-[#0B3D91] text-white px-2 py-0.5 text-[10px] uppercase rounded tracking-wider flex-shrink-0">
            📌 Announcements
          </span>
          <div className="relative flex-1 overflow-hidden h-5 flex items-center">
            <div className="animate-marquee hover:cursor-pointer">
              <span className="mx-8">🔔 CRDDMS System Update: Scheduled database migration successfully completed.</span>
              <span className="mx-8">🔔 OCR Performance: OCR extraction throughput optimized with upgraded engine configurations.</span>
              <span className="mx-8">🔔 Administrative Audit: Compliance check verification window now open for all departments.</span>
              <span className="mx-8">🔔 System Security: Multi-Factor Authentication (MFA) is now enforced for all admin roles.</span>
              <span className="mx-8">🔔 Maintenance Alert: CRDDMS server maintenance scheduled for Sunday, June 28, 2026, 02:00 AM - 04:00 AM IST.</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1 — UNIVERSITY HEADER */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-[#0B3D91]/10 h-20 px-6 flex justify-between items-center shadow-sm sticky top-9 z-50 animate-logo-appearance">
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}jntugv_logo.jpg`}
            alt="JNTU-GV Logo"
            className="w-10 h-10 object-contain"
          />
          <div className="flex flex-col justify-center">
            <h1 className="text-xs md:text-sm lg:text-base font-black text-[#0B3D91] leading-tight uppercase tracking-wider font-sans">
              JNTU Gurajada Vizianagaram
            </h1>
            <p className="text-[9px] md:text-[10px] lg:text-xs font-bold text-[#D4AF37] tracking-widest mt-0.5 font-sans uppercase">
              State Public University, Andhra Pradesh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden xl:flex items-center gap-5">
            <a href="#home" className="text-xs font-bold text-[#475569] hover:text-[#0B3D91] transition-colors font-sans">Home</a>
            <button onClick={() => setActiveModal('about')} className="text-xs font-bold text-[#475569] hover:text-[#0B3D91] transition-colors font-sans cursor-pointer">About Us</button>
            <button onClick={() => setActiveModal('administration')} className="text-xs font-bold text-[#475569] hover:text-[#0B3D91] transition-colors font-sans cursor-pointer">Administration</button>
            <button onClick={() => setActiveModal('cells')} className="text-xs font-bold text-[#475569] hover:text-[#0B3D91] transition-colors font-sans cursor-pointer">Cells & Committees</button>
            <button onClick={() => setActiveModal('acts')} className="text-xs font-bold text-[#475569] hover:text-[#0B3D91] transition-colors font-sans cursor-pointer">Acts</button>
            <button onClick={() => setActiveModal('facilities')} className="text-xs font-bold text-[#475569] hover:text-[#0B3D91] transition-colors font-sans cursor-pointer">Campus Node</button>
            <button onClick={() => setActiveModal('antiragging')} className="text-xs font-black text-red-500 hover:text-red-700 transition-colors font-sans flex items-center gap-0.5 cursor-pointer">
              <span className="material-symbols-outlined text-[13px]">gavel</span> Anti-Ragging
            </button>
            <button onClick={() => setActiveModal('alumni')} className="text-xs font-bold text-[#0B3D91] hover:text-[#1E5AA8] transition-colors font-sans cursor-pointer">Alumni Connect</button>
          </nav>
          <Link
            to="/login"
            className="bg-[#0B3D91] hover:bg-[#1E5AA8] text-white px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 text-center shadow-sm active:scale-95 font-sans"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* SECTION 2 — HERO */}
      <section id="home" className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-[#0B3D91]/10 px-6 py-20 z-10">
        {/* Layer 2: Soft gradient overlay (lighter to let the image show through clearly) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC]/30 via-[#EBF3FC]/40 to-[#F8FAFC]/70 pointer-events-none z-10" />

        {/* Layer 3: Hero content */}
        <div className="relative max-w-4xl mx-auto w-full text-center space-y-8 animate-fade-slide-up z-20">
          <div className="flex flex-col items-center space-y-4">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#0B3D91] tracking-tight leading-none font-sans">
              College Records Digitalization
              <span className="block text-xl md:text-3xl lg:text-4xl font-semibold text-[#1E5AA8] mt-2 tracking-wide font-sans">
                & Document Management System
              </span>
            </h1>
            <p className="text-sm font-semibold text-[#64748B] tracking-wider font-sans uppercase">
              Established by Andhra Pradesh Act No. 22 of 2021
            </p>
            <p className="text-base md:text-lg text-[#1E5AA8] font-bold leading-normal max-w-2xl mx-auto font-sans">
              Supporting academic administration, institutional governance, and information stewardship across JNTU-GV.
            </p>
            <p className="text-sm text-[#475569] leading-relaxed max-w-2xl mx-auto font-medium font-sans">
              CRDDMS provides a centralized environment for managing academic, administrative, and institutional records while supporting the continuity, accessibility, and preservation of university information.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link
              to="/login"
              className="bg-[#0B3D91] hover:bg-[#1E5AA8] text-white py-3.5 px-8 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 text-center flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto font-sans"
            >
              Access Portal
              <span className="material-symbols-outlined text-sm font-sans">login</span>
            </Link>
            <Link
              to="/register"
              className="bg-white hover:bg-slate-50 text-[#0B3D91] border border-[#0B3D91]/20 py-3.5 px-8 rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 text-center flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto font-sans"
            >
              Request Authorization
              <span className="material-symbols-outlined text-sm font-sans">how_to_reg</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 3 — INSTITUTIONAL PROFILE */}
      <section id="profile" className="relative z-10 py-20 bg-white/80 backdrop-blur-sm border-t border-b border-[#0B3D91]/10 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-[#0B3D91] font-sans">University Information Overview</h2>
            <p className="text-sm text-[#475569] font-semibold font-sans">Operational profile and capacity statistics of JNTU-GV</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Academic Departments */}
            <div className="bg-white/95 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#475569] tracking-wider uppercase font-sans">Academic Departments</span>
                <span className="material-symbols-outlined text-[#0B3D91] text-xl select-none">lan</span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-[#0B3D91] font-sans">
                  <CountUp end={stats.departments} />
                </div>
                <p className="text-xs text-[#64748B] mt-1 font-medium font-sans">Departments actively utilising digital archives</p>
              </div>
            </div>

            {/* Student Community */}
            <div className="bg-white/95 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#475569] tracking-wider uppercase font-sans">Student Community</span>
                <span className="material-symbols-outlined text-[#0B3D91] text-xl select-none">groups</span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-[#0B3D91] font-sans">
                  <CountUp end={stats.students} />
                </div>
                <p className="text-xs text-[#64748B] mt-1 font-medium font-sans">Enrolled student profiles managed</p>
              </div>
            </div>

            {/* Faculty Strength */}
            <div className="bg-white/95 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#475569] tracking-wider uppercase font-sans">Faculty Strength</span>
                <span className="material-symbols-outlined text-[#0B3D91] text-xl select-none">school</span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-[#0B3D91] font-sans">
                  <CountUp end={stats.faculty} />
                </div>
                <p className="text-xs text-[#64748B] mt-1 font-medium font-sans">Academic staff profiles and service histories</p>
              </div>
            </div>

            {/* Institutional Records */}
            <div className="bg-white/95 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#475569] tracking-wider uppercase font-sans">Institutional Records</span>
                <span className="material-symbols-outlined text-[#0B3D91] text-xl select-none">database</span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-[#0B3D91] font-sans">
                  <CountUp end={stats.documents} />
                </div>
                <p className="text-xs text-[#64748B] mt-1 font-medium font-sans">Academic and administrative records preserved</p>
              </div>
            </div>

            {/* OCR Processed Documents */}
            <div className="bg-white/95 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#475569] tracking-wider uppercase font-sans">OCR Processed Documents</span>
                <span className="material-symbols-outlined text-[#0B3D91] text-xl select-none">document_scanner</span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-[#0B3D91] font-sans">
                  <CountUp end={stats.ocrProcessed} />
                </div>
                <p className="text-xs text-[#64748B] mt-1 font-medium font-sans">Full-text searchable document indexes</p>
              </div>
            </div>

            {/* Storage Capacity Used */}
            <div className="bg-white/95 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#475569] tracking-wider uppercase font-sans">Digital Storage Used</span>
                <span className="material-symbols-outlined text-[#0B3D91] text-xl select-none">storage</span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-[#0B3D91] font-sans">
                  <span>{(stats.storageBytes / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <p className="text-xs text-[#64748B] mt-1 font-medium font-sans">Active repository media storage consumed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: UNIVERSITY GOVERNANCE & LEADERSHIP */}
      <section id="leadership" className="relative z-10 py-20 bg-[#F8FAFC]/80 backdrop-blur-sm border-b border-[#0B3D91]/10 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-[#0B3D91] font-sans">University Leadership & Governance</h2>
            <p className="text-sm text-[#475569] font-semibold font-sans">Distinguished administrators guiding the technological education landscape</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Chancellor */}
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-[#0B3D91]">
                <span className="material-symbols-outlined text-4xl select-none">account_balance_wallet</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] font-sans">Shri Justice(Retd.) S. Abdul Nazeer</h3>
                <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mt-0.5">Hon'ble Chancellor</p>
                <p className="text-xs text-[#64748B] font-semibold mt-1">Governor of Andhra Pradesh</p>
              </div>
              <div className="w-10 h-0.5 bg-[#D4AF37]/50 rounded" />
              <p className="text-xs text-[#475569] font-medium leading-relaxed">
                Guiding JNTU-GV as Chancellor and the chief executive head of the state administrative systems.
              </p>
            </div>

            {/* Vice-Chancellor */}
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-[#0B3D91]">
                <span className="material-symbols-outlined text-4xl select-none">person_apron</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] font-sans">Prof. V. V. Subba Rao</h3>
                <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mt-0.5">Hon'ble Vice-Chancellor</p>
                <p className="text-xs text-[#64748B] font-semibold mt-1">Ph.D. Mechanical Eng. (IIT Kharagpur)</p>
              </div>
              <div className="w-10 h-0.5 bg-[#D4AF37]/50 rounded" />
              <p className="text-xs text-[#475569] font-medium leading-relaxed">
                Directing the administrative and academic focus of JNTU-GV toward technical innovation and excellence.
              </p>
            </div>

            {/* Registrar */}
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-[#0B3D91]">
                <span className="material-symbols-outlined text-4xl select-none">feed</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] font-sans">Prof. D. Rajya Lakshmi</h3>
                <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mt-0.5">Registrar i/c</p>
                <p className="text-xs text-[#64748B] font-semibold mt-1">M.Tech, Ph.D.</p>
              </div>
              <div className="w-10 h-0.5 bg-[#D4AF37]/50 rounded" />
              <p className="text-xs text-[#475569] font-medium leading-relaxed">
                Managing central operations, regulatory frame coordination, and university registries across constituent units.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: CONSTITUENT COLLEGES */}
      <section id="colleges" className="relative z-10 py-20 bg-white/80 backdrop-blur-sm border-b border-[#0B3D91]/10 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-[#0B3D91] font-sans">Constituent Institutions</h2>
            <p className="text-sm text-[#475569] font-semibold font-sans">Serving engineering, pharmaceutical sciences, and technology domains</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* College 1 */}
            <div className="bg-white/95 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#0F172A] font-sans">JNTU-GV College of Engineering</h3>
                <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider">Vizianagaram Campus</p>
                <p className="text-xs text-[#475569] leading-relaxed font-medium">
                  DWARAPUDI, VIZIANAGARAM, ANDHRA PRADESH - 535003.
                </p>
              </div>
              <a href="https://jntugvcev.edu.in" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#0B3D91] hover:underline mt-6 inline-flex items-center gap-1">
                Visit Website <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>

            {/* College 2 */}
            <div className="bg-white/95 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#0F172A] font-sans">JNTU-GV Tribal College of Engineering</h3>
                <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider">Kurupam Campus</p>
                <p className="text-xs text-[#475569] leading-relaxed font-medium">
                  TEKHARAKHANDI VILLAGE, VIZIANAGARAM, ANDHRA PRADESH 535524.
                </p>
              </div>
              <span className="text-xs font-bold text-[#64748B] mt-6 inline-flex items-center gap-1">
                Academic Node Active
              </span>
            </div>

            {/* College 3 */}
            <div className="bg-white/95 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#0F172A] font-sans">JNTU-GV College of Pharmaceutical Sciences</h3>
                <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider">Vizianagaram Campus</p>
                <p className="text-xs text-[#475569] leading-relaxed font-medium">
                  DWARAPUDI, VIZIANAGARAM, ANDHRA PRADESH - 535003.
                </p>
              </div>
              <span className="text-xs font-bold text-[#64748B] mt-6 inline-flex items-center gap-1">
                Academic Node Active
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — RECOGNITION & REGULATORY FRAMEWORK */}
      <section id="framework" className="relative z-10 py-20 bg-[#F8FAFC]/80 backdrop-blur-sm border-b border-[#0B3D91]/10 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-[#0B3D91] font-sans">Recognition & Regulatory Framework</h2>
            <p className="text-sm text-[#475569] font-medium font-sans">Regulatory alignments and national accreditations of the institution</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* UGC */}
            <div className="bg-white border-t-4 border-t-[#D4AF37] border-l border-r border-b border-slate-100 p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col space-y-3">
              <span className="inline-block px-2.5 py-1 bg-[#0B3D91]/10 text-[#0B3D91] text-xs font-black tracking-widest uppercase rounded self-start font-sans">UGC</span>
              <h3 className="font-bold text-sm text-[#0F172A] font-sans">University Grants Commission</h3>
              <p className="text-xs text-[#475569] leading-relaxed font-sans font-medium">
                Recognized under the framework governing higher education institutions in India.
              </p>
            </div>

            {/* AICTE */}
            <div className="bg-white border-t-4 border-t-[#0B3D91] border-l border-r border-b border-slate-100 p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col space-y-3">
              <span className="inline-block px-2.5 py-1 bg-[#1E5AA8]/10 text-[#1E5AA8] text-xs font-black tracking-widest uppercase rounded self-start font-sans">AICTE</span>
              <h3 className="font-bold text-sm text-[#0F172A] font-sans">Technical Education Council</h3>
              <p className="text-xs text-[#475569] leading-relaxed font-sans font-medium">
                Programs operate in accordance with applicable technical education standards.
              </p>
            </div>

            {/* NBA */}
            <div className="bg-white border-t-4 border-t-[#D4AF37] border-l border-r border-b border-slate-100 p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col space-y-3">
              <span className="inline-block px-2.5 py-1 bg-[#0B3D91]/10 text-[#0B3D91] text-xs font-black tracking-widest uppercase rounded self-start font-sans">NBA</span>
              <h3 className="font-bold text-sm text-[#0F172A] font-sans">Board of Accreditation</h3>
              <p className="text-xs text-[#475569] leading-relaxed font-sans font-medium">
                Academic programs participate in established accreditation frameworks.
              </p>
            </div>

            {/* NAAC */}
            <div className="bg-white border-t-4 border-t-[#0B3D91] border-l border-r border-b border-slate-100 p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col space-y-3">
              <span className="inline-block px-2.5 py-1 bg-[#1E5AA8]/10 text-[#1E5AA8] text-xs font-black tracking-widest uppercase rounded self-start font-sans">NAAC</span>
              <h3 className="font-bold text-sm text-[#0F172A] font-sans">Assessment Council</h3>
              <p className="text-xs text-[#475569] leading-relaxed font-sans font-medium">
                Institutional quality assurance processes aligned with national assessment practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — UNIVERSITY RECORDS SERVICES */}
      <section id="services" className="relative z-10 py-20 bg-white/80 backdrop-blur-sm border-b border-[#0B3D91]/10 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-[#0B3D91] font-sans">Institutional Information Services</h2>
            <p className="text-sm text-[#475569] font-medium font-sans">Digital access and management of central central records directory services</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Student Records */}
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col space-y-4">
              <div className="w-12 h-12 bg-[#0B3D91]/10 rounded-xl flex items-center justify-center text-[#0B3D91]">
                <span className="material-symbols-outlined text-2xl select-none">badge</span>
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] font-sans">Student Records</h3>
              <p className="text-sm text-[#475569] leading-relaxed font-sans font-medium">
                Academic records, certificates, examination information, and student documentation.
              </p>
            </div>

            {/* Faculty Records */}
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col space-y-4">
              <div className="w-12 h-12 bg-[#0B3D91]/10 rounded-xl flex items-center justify-center text-[#0B3D91]">
                <span className="material-symbols-outlined text-2xl select-none">assignment_ind</span>
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] font-sans">Faculty Records</h3>
              <p className="text-sm text-[#475569] leading-relaxed font-sans font-medium">
                Faculty profiles, service information, qualifications, and academic contributions.
              </p>
            </div>

            {/* Administrative Records */}
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col space-y-4">
              <div className="w-12 h-12 bg-[#0B3D91]/10 rounded-xl flex items-center justify-center text-[#0B3D91]">
                <span className="material-symbols-outlined text-2xl select-none">history_edu</span>
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] font-sans">Administrative Records</h3>
              <p className="text-sm text-[#475569] leading-relaxed font-sans font-medium">
                Official notices, reports, governance documentation, and institutional correspondence.
              </p>
            </div>

            {/* Institutional Archives */}
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col space-y-4">
              <div className="w-12 h-12 bg-[#0B3D91]/10 rounded-xl flex items-center justify-center text-[#0B3D91]">
                <span className="material-symbols-outlined text-2xl select-none">inventory_2</span>
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] font-sans">Institutional Archives</h3>
              <p className="text-sm text-[#475569] leading-relaxed font-sans font-medium">
                Historical academic and administrative records preserving university legacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — AUTHORIZED ACCESS */}
      <section id="access" className="relative z-10 py-20 bg-[#F8FAFC]/80 backdrop-blur-sm px-6 border-b border-[#0B3D91]/10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="relative max-w-md mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/20 to-[#0B3D91]/20 rounded-3xl blur-lg pointer-events-none" />
            <div className="relative bg-white/90 backdrop-blur-lg border border-white/50 p-8 rounded-2xl shadow-xl flex flex-col space-y-6">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-[#0B3D91]/10 rounded-xl flex items-center justify-center text-[#0B3D91] mx-auto">
                  <span className="material-symbols-outlined text-2xl select-none">vpn_key</span>
                </div>
                <h3 className="text-xl font-bold text-[#0F172A] font-sans">Authorized Access Portal</h3>
                <p className="text-sm text-[#475569] leading-relaxed font-sans font-medium">
                  Access to institutional records and administrative services is restricted to authorized university personnel.
                </p>
              </div>
              <div className="flex flex-col gap-3 font-sans">
                <Link
                  to="/login"
                  className="bg-[#0B3D91] hover:bg-[#1E5AA8] text-white py-3.5 px-4 rounded-xl text-xs font-bold text-center transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  Authenticate Access
                  <span className="material-symbols-outlined text-sm font-sans">login</span>
                </Link>
                <Link
                  to="/register"
                  className="bg-white hover:bg-slate-50 text-[#0B3D91] border border-[#0B3D91]/20 py-3.5 px-4 rounded-xl text-xs font-bold text-center transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  Request Authorization
                  <span className="material-symbols-outlined text-sm font-sans">contact_support</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — FOOTER */}
      <footer className="relative z-20 bg-[#0F172A] text-slate-400 py-16 px-6 border-t border-slate-800 font-sans">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand/Logo Column */}
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-700 p-1">
                <img
                  src={`${import.meta.env.BASE_URL}jntugv_logo.jpg`}
                  alt="JNTU-GV Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base leading-none font-sans">CRDDMS</h4>
                <p className="text-[10px] text-[#D4AF37] font-semibold mt-0.5 tracking-wider uppercase font-sans">JNTU-GV</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-bold leading-tight font-sans">
              College Records Digitalization & Document Management System
            </p>
            <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
              Supporting the management, accessibility, and preservation of institutional records across JNTU-GV.
            </p>
            <div className="text-[10px] text-slate-500 space-y-1 font-mono pt-2 border-t border-slate-800">
              <p>JNTU Act 8 of 2006</p>
              <p>JNTU Act 30 of 2008</p>
              <p>JNTU Act 22 of 2021</p>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-sans">Quick Links & Cells</h4>
            <div className="flex flex-col space-y-2 text-center md:text-left text-xs font-semibold font-sans">
              <button onClick={() => setActiveModal('about')} className="hover:text-white text-left cursor-pointer font-sans">About JNTU-GV</button>
              <button onClick={() => setActiveModal('administration')} className="hover:text-white text-left cursor-pointer font-sans">Administration Portal</button>
              <button onClick={() => setActiveModal('cells')} className="hover:text-white text-left cursor-pointer font-sans">Cells & Committees</button>
              <button onClick={() => setActiveModal('acts')} className="hover:text-white text-left cursor-pointer font-sans">Legislative Acts</button>
              <button onClick={() => setActiveModal('alumni')} className="hover:text-white text-left cursor-pointer font-sans flex items-center gap-1 justify-center md:justify-start">
                Alumni Connect <span className="material-symbols-outlined text-[11px]">group</span>
              </button>
              <button onClick={() => setActiveModal('antiragging')} className="hover:text-red-400 text-left text-red-500 font-sans flex items-center gap-1 justify-center md:justify-start cursor-pointer">
                Anti-Ragging Compliance <span className="material-symbols-outlined text-[11px]">gavel</span>
              </button>
            </div>
          </div>

          {/* Info/Address Column */}
          <div className="flex flex-col items-center md:items-start space-y-4 text-xs font-medium leading-relaxed text-center md:text-left font-sans">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-sans">Contact JNTU-GV</h4>
            <p className="text-slate-400 font-sans">
              JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY GURAJADA VIZIANAGARAM<br />
              Dwarapudi, Vizianagaram, Andhra Pradesh - 535003, India
            </p>
            <p className="text-slate-500 font-sans font-mono text-[10px] uppercase">
              Established by AP Act No. 22 of 2021
            </p>
            <p className="text-slate-500 font-sans">
              Support Desk: support.crddms@jntugv.edu.in
            </p>
          </div>
        </div>

        {/* Copyright Line */}
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-slate-800 text-center text-xs font-semibold text-slate-500 font-sans space-y-2">
          <p>© Jawaharlal Nehru Technological University Gurajada Vizianagaram. All Rights Reserved.</p>
          <p className="text-[10px] text-slate-600 font-sans">
            Designed, Developed and Maintained by Digital Monitoring Cell, JNTU-GV
          </p>
        </div>
      </footer>

      {/* Dynamic Overlays Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#0B3D91]/15 max-w-2xl w-full rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[85vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0B3D91] text-2xl">
                  {activeModal === 'about' && 'info'}
                  {activeModal === 'administration' && 'group'}
                  {activeModal === 'cells' && 'lan'}
                  {activeModal === 'acts' && 'gavel'}
                  {activeModal === 'facilities' && 'widgets'}
                  {activeModal === 'antiragging' && 'shield'}
                  {activeModal === 'alumni' && 'school'}
                </span>
                <h3 className="text-lg font-bold text-[#0B3D91] font-sans uppercase tracking-wide">
                  {activeModal === 'about' && 'About JNTU Gurajada Vizianagaram'}
                  {activeModal === 'administration' && 'University Administration'}
                  {activeModal === 'cells' && 'University Cells & Committees'}
                  {activeModal === 'acts' && 'Legislative Framework & Acts'}
                  {activeModal === 'facilities' && 'Campus Facilities & Student Corner'}
                  {activeModal === 'antiragging' && 'Anti-Ragging Compliance Portal'}
                  {activeModal === 'alumni' && 'Alumni Association Registration'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setActiveModal(null);
                  setAntiraggingSubmitted(false);
                  setAlumniSubmitted(false);
                }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto pr-2 mt-4 space-y-4 text-xs md:text-sm text-[#475569] leading-relaxed">
              
              {/* 1. ABOUT MODAL */}
              {activeModal === 'about' && (
                <div className="space-y-4">
                  <p className="font-semibold text-slate-800">
                    Established by Andhra Pradesh Act No. 22 of 2021
                  </p>
                  <p>
                    JNTU College of Engineering, Vizianagaram was established in the year 2007 as a constituent College of JNTU Hyderabad. JNTU Hyderabad was trifurcated into three Universities by the Andhra Pradesh Act No. 30 of 2008 and since 24th August 2008, the College has become the constituent college of JNTU Kakinada.
                  </p>
                  <p>
                    Vide University Act No.22 of 2021, JNTU Kakinada was bifurcated and Jawaharlal Nehru Technological University Gurajada, Vizianagaram came into existence as a separate State Public University vide G.O.Ms.No.3, dated: 12-01-2022.
                  </p>
                  <p>
                    The university is spread across six districts: **Vizianagaram, Visakhapatnam, Srikakulam, Parvathipuram Manyam, Alluri Sitharama Raju, and Anakapalli**.
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-xl font-bold text-[#0B3D91]">6</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Districts</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-xl font-bold text-[#0B3D91]">3</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Constituent</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-xl font-bold text-[#0B3D91]">37</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Affiliated</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ADMINISTRATION MODAL */}
              {activeModal === 'administration' && (
                <div className="space-y-4">
                  <p className="font-semibold text-slate-800">Governance structure of JNTU-GV:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0B3D91]/5 p-3.5 rounded-xl border border-[#0B3D91]/10">
                      <div className="font-bold text-slate-850 text-[11px] uppercase tracking-wider text-[#0B3D91]">Chancellor</div>
                      <div className="font-bold text-sm text-slate-900 mt-1">Shri Justice(Retd.) S. Abdul Nazeer</div>
                      <div className="text-xs text-slate-500 mt-0.5">Hon'ble Governor of Andhra Pradesh</div>
                    </div>
                    <div className="bg-[#0B3D91]/5 p-3.5 rounded-xl border border-[#0B3D91]/10">
                      <div className="font-bold text-slate-850 text-[11px] uppercase tracking-wider text-[#0B3D91]">Vice Chancellor</div>
                      <div className="font-bold text-sm text-slate-900 mt-1">Prof. V. V. Subba Rao</div>
                      <div className="text-xs text-slate-500 mt-0.5">Mechanical Engineering (IIT Kharagpur)</div>
                    </div>
                    <div className="bg-[#0B3D91]/5 p-3.5 rounded-xl border border-[#0B3D91]/10">
                      <div className="font-bold text-slate-850 text-[11px] uppercase tracking-wider text-[#0B3D91]">Registrar i/c</div>
                      <div className="font-bold text-sm text-slate-900 mt-1">Prof. D. Rajya Lakshmi</div>
                      <div className="text-xs text-slate-500 mt-0.5">M.Tech, Ph.D</div>
                    </div>
                    <div className="bg-[#0B3D91]/5 p-3.5 rounded-xl border border-[#0B3D91]/10">
                      <div className="font-bold text-slate-850 text-[11px] uppercase tracking-wider text-[#0B3D91]">Administration Officers</div>
                      <div className="font-bold text-sm text-slate-900 mt-1">OSD & Board Coordinators</div>
                      <div className="text-xs text-slate-500 mt-0.5">University Chairpersons & Directors</div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <p className="font-bold text-slate-800 mb-1.5">Constituent Campus Units:</p>
                    <p>• JNTU-GV College of Engineering, Vizianagaram (CEV)</p>
                    <p>• JNTU-GV College of Pharmaceutical Sciences, Vizianagaram (CPSV)</p>
                    <p>• JNTU-GV Tribal College of Engineering, Kurupam (TECK)</p>
                  </div>
                </div>
              )}

              {/* 3. CELLS MODAL */}
              {activeModal === 'cells' && (
                <div className="space-y-4">
                  <p className="font-semibold text-slate-800">Active university directorates, cells and administrative committees:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="font-bold text-[#0B3D91] text-xs">Digital Monitoring Cell (DMC)</div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">Maintains university network nodes, system code bases, security configurations, and centralized IT setups.</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="font-bold text-[#0B3D91] text-xs">Research & Development (R&D) Cell</div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">Oversees extramural research schemes, PhD supervisor allocation, research review meetings (RRMs), and journals.</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="font-bold text-[#0B3D91] text-xs">IQAC Cell</div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">Coordinates quality audit standards, NAAC files consolidation, and peer assessment frameworks.</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="font-bold text-[#0B3D91] text-xs">Incubation & Startup Center</div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">Mentors student startups, incubation spaces, innovation hackathons, and corporate collaborations.</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="font-bold text-[#0B3D91] text-xs">Training & Placement Cell</div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">Organizes skill development workshops, placement fairs, IT domain certifications, and industry nodes.</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="font-bold text-[#0B3D91] text-xs">Dr. YSR Central Library</div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">Manages subscriptions for online learning, UGC MOOCs, IEEE Xplore, ACM Digital Library, and Springer nodes.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. ACTS MODAL */}
              {activeModal === 'acts' && (
                <div className="space-y-4">
                  <p className="font-semibold text-slate-800">Legislative acts governing JNTU-GV establishing framework limits:</p>
                  <div className="space-y-3">
                    <div className="bg-white border border-slate-150 p-3.5 rounded-xl flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#D4AF37] mt-0.5">gavel</span>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">JNTU Act 8 of 2006 (and Act 8 of 2026)</div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">The original enactment creating the multi-campus technological university structures, granting statutory rights for technical syllabus curation.</p>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-150 p-3.5 rounded-xl flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#D4AF37] mt-0.5">gavel</span>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">JNTU Act 30 of 2008</div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">Trifurcated JNTU into distinct regional university structures (JNTU Hyderabad, JNTU Kakinada, JNTU Anantapur) to serve regional college affiliates.</p>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-150 p-3.5 rounded-xl flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#0B3D91] mt-0.5">gavel</span>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">JNTU Act 22 of 2021</div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">The governing legislation establishing JNTU-GV Vizianagaram as an independent State Public University in Andhra Pradesh, separating it from JNTU Kakinada.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. FACILITIES MODAL */}
              {activeModal === 'facilities' && (
                <div className="space-y-4">
                  <p className="font-semibold text-slate-800">Campus facilities, student support cells, and physical infrastructures:</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0B3D91] text-lg">home</span>
                      <span className="font-bold text-slate-850">University Hostels (Boys & Girls)</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0B3D91] text-lg">engineering</span>
                      <span className="font-bold text-slate-850">University Engineering Cell</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0B3D91] text-lg">hotel</span>
                      <span className="font-bold text-slate-850">Guest House & Staff Quarters</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0B3D91] text-lg">local_dining</span>
                      <span className="font-bold text-slate-850">Canteen & Dining Hall</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0B3D91] text-lg">account_balance</span>
                      <span className="font-bold text-slate-850">State Bank & Campus ATMs</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0B3D91] text-lg">medical_services</span>
                      <span className="font-bold text-slate-850">Campus Dispensary Node</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0B3D91] text-lg">sports_soccer</span>
                      <span className="font-bold text-slate-850">Sports Complex & NSS Cell</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0B3D91] text-lg">music_note</span>
                      <span className="font-bold text-slate-850">Music & Student Activity Club</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. ANTI-RAGGING COMPLIANCE MODAL */}
              {activeModal === 'antiragging' && (
                <div className="space-y-4">
                  <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
                    <div>
                      <h4 className="font-bold text-sm">Strict Zero-Tolerance Policy</h4>
                      <p className="text-xs mt-1 leading-normal">
                        JNTU-GV enforces a strict zero-tolerance policy against ragging in any form. Ragging is a criminal offense under Andhra Pradesh prohibition of ragging act and UGC regulations.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">National Helpline (Toll-Free)</div>
                      <div className="text-base font-black text-red-600 font-mono">1800-180-5522</div>
                      <div className="text-[10px] text-slate-400">Available 24x7. Free support desk.</div>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">National Support Email</div>
                      <div className="text-sm font-black text-slate-700 font-mono">helpline@antiragging.in</div>
                      <div className="text-[10px] text-slate-400">Direct registry contact node.</div>
                    </div>
                  </div>

                  {!antiraggingSubmitted ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        setAntiraggingSubmitted(true);
                      }} 
                      className="border-t border-slate-100 pt-4 space-y-3"
                    >
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Report Grievance / Ragging Incident</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Your Name (Optional)" 
                          value={antiraggingForm.name} 
                          onChange={(e) => setAntiraggingForm({...antiraggingForm, name: e.target.value})}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#0B3D91]"
                        />
                        <input 
                          type="text" 
                          placeholder="Roll Number" 
                          required
                          value={antiraggingForm.rollNumber} 
                          onChange={(e) => setAntiraggingForm({...antiraggingForm, rollNumber: e.target.value})}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#0B3D91]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Department" 
                          required
                          value={antiraggingForm.department} 
                          onChange={(e) => setAntiraggingForm({...antiraggingForm, department: e.target.value})}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#0B3D91]"
                        />
                        <input 
                          type="tel" 
                          placeholder="Contact Phone Number" 
                          required
                          value={antiraggingForm.phone} 
                          onChange={(e) => setAntiraggingForm({...antiraggingForm, phone: e.target.value})}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#0B3D91]"
                        />
                      </div>
                      <textarea 
                        placeholder="Incident Details (Date, Location, Persons involved, Description)" 
                        required
                        rows={3}
                        value={antiraggingForm.details} 
                        onChange={(e) => setAntiraggingForm({...antiraggingForm, details: e.target.value})}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#0B3D91] w-full resize-none"
                      />
                      <button 
                        type="submit" 
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-2.5 rounded-lg text-xs cursor-pointer active:scale-98 transition-all"
                      >
                        Submit Anonymous Report
                      </button>
                    </form>
                  ) : (
                    <div className="bg-green-50 text-green-700 border border-green-150 p-6 rounded-xl text-center space-y-3 animate-logo-appearance">
                      <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
                      <h4 className="font-bold text-sm">Grievance Submitted Successfully</h4>
                      <p className="text-xs max-w-sm mx-auto leading-normal">
                        Your report has been securely sent to the JNTU-GV Anti-Ragging Committee Squad. Confidentiality is fully protected. Necessary inspection steps will be triggered immediately.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 7. ALUMNI CONNECT MODAL */}
              {activeModal === 'alumni' && (
                <div className="space-y-4">
                  <p className="font-semibold text-slate-800">
                    Connect with the Alumni Association of JNTU Gurajada Vizianagaram.
                  </p>
                  
                  {!alumniSubmitted ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        setAlumniSubmitted(true);
                      }} 
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Full Name" 
                          required
                          value={alumniForm.name} 
                          onChange={(e) => setAlumniForm({...alumniForm, name: e.target.value})}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#0B3D91]"
                        />
                        <input 
                          type="email" 
                          placeholder="Email Address" 
                          required
                          value={alumniForm.email} 
                          onChange={(e) => setAlumniForm({...alumniForm, email: e.target.value})}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#0B3D91]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="tel" 
                          placeholder="Contact Number" 
                          required
                          value={alumniForm.phone} 
                          onChange={(e) => setAlumniForm({...alumniForm, phone: e.target.value})}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#0B3D91]"
                        />
                        <input 
                          type="text" 
                          placeholder="Graduation Year (e.g. 2021)" 
                          required
                          value={alumniForm.batch} 
                          onChange={(e) => setAlumniForm({...alumniForm, batch: e.target.value})}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#0B3D91]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Department (e.g. CSE)" 
                          required
                          value={alumniForm.department} 
                          onChange={(e) => setAlumniForm({...alumniForm, department: e.target.value})}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#0B3D91]"
                        />
                        <input 
                          type="text" 
                          placeholder="Current Organization" 
                          required
                          value={alumniForm.company} 
                          onChange={(e) => setAlumniForm({...alumniForm, company: e.target.value})}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#0B3D91]"
                        />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Current Designation/Role" 
                        required
                        value={alumniForm.role} 
                        onChange={(e) => setAlumniForm({...alumniForm, role: e.target.value})}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#0B3D91] w-full"
                      />
                      <button 
                        type="submit" 
                        className="w-full bg-[#0B3D91] hover:bg-[#1E5AA8] text-white font-bold p-2.5 rounded-lg text-xs cursor-pointer active:scale-98 transition-all"
                      >
                        Submit Alumni Information
                      </button>
                    </form>
                  ) : (
                    <div className="bg-green-50 text-green-700 border border-green-150 p-6 rounded-xl text-center space-y-3 animate-logo-appearance">
                      <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
                      <h4 className="font-bold text-sm">Alumni Profile Connected</h4>
                      <p className="text-xs max-w-sm mx-auto leading-normal">
                        Thank you for connecting! Your profile details have been sent to the JNTU-GV Alumni Association database. You will receive convocation updates, meet details, and networking links directly in your email.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 mt-4 border-t border-slate-100 gap-2">
              <button 
                onClick={() => {
                  setActiveModal(null);
                  setAntiraggingSubmitted(false);
                  setAlumniSubmitted(false);
                }} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs cursor-pointer transition-colors"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
