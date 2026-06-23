// pages/Dashboard.jsx — Premium animated dashboard
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/Badge';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, Filler,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { TrendingUp, Database, CheckCircle, AlertCircle, Clock, ArrowUpRight, Search } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, Filler, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

function fmtBytes(bytes) {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

// Animated counter hook
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    const num = parseFloat(target);
    const step = num / (duration / 16);
    let cur = 0;
    const timer = setInterval(() => {
      cur = Math.min(cur + step, num);
      setCount(cur);
      if (cur >= num) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function PremiumStatCard({ label, value, sub, icon: Icon, colorClass, delay = 0, suffix = '', prefix = '' }) {
  const animated = useCountUp(parseFloat(value) || 0);
  const displayVal = Number.isInteger(parseFloat(value))
    ? Math.round(animated).toLocaleString('en-IN')
    : animated.toFixed(1);

  return (
    <div className={`stat-card animate-card-enter ${colorClass}`}
      style={{ animationDelay: `${delay}s` }}>
      {/* Top section */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(11,61,145,0.07)' }}>
          <Icon size={20} className="text-[#0B3D91]" />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
          style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>
          <ArrowUpRight size={10} />
          Live
        </div>
      </div>

      {/* Value */}
      <div className="display-number text-3xl font-800" style={{ color: '#0B3D91', letterSpacing: '-0.03em' }}>
        {prefix}{displayVal}{suffix}
      </div>

      {/* Label & sub */}
      <div className="mt-1">
        <p className="text-xs font-700 uppercase tracking-wider" style={{ color: '#8B6D10', fontSize: '0.68rem' }}>
          {label}
        </p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [reports, setReports] = useState(null);
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get('/reports'),
      api.get('/documents?limit=6'),
    ]).then(([s, r, d]) => {
      setStats(s.data);
      setReports(r.data);
      setDocs(d.data.documents || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="relative">
        <div className="w-14 h-14 border-4 border-[#e2e8f0] rounded-full" />
        <div className="w-14 h-14 border-4 border-t-[#0B3D91] border-r-[#D4AF37] rounded-full animate-spin absolute inset-0" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full animate-pulse" style={{ background: '#D4AF37' }} />
        </div>
      </div>
    </div>
  );

  const categoryChart = {
    labels: reports?.byCategory?.map(c => c.category?.replace('_', ' ')) || [],
    datasets: [{
      data: reports?.byCategory?.map(c => c.count) || [],
      backgroundColor: ['#0B3D91', '#D4AF37', '#1E5AA8', '#16a34a', '#475569'],
      borderWidth: 0,
      hoverBorderWidth: 3,
      hoverBorderColor: '#fff',
    }],
  };

  const deptChart = {
    labels: reports?.byDepartment?.slice(0,6).map(d => d.department_code) || [],
    datasets: [{
      label: 'Documents',
      data: reports?.byDepartment?.slice(0,6).map(d => d.count) || [],
      backgroundColor: 'rgba(11,61,145,0.8)',
      borderRadius: 8,
      borderSkipped: false,
      hoverBackgroundColor: '#D4AF37',
    }],
  };

  const trendChart = {
    labels: reports?.monthlyTrend?.map(t => t.month) || [],
    datasets: [{
      label: 'Uploads',
      data: reports?.monthlyTrend?.map(t => t.count) || [],
      borderColor: '#0B3D91',
      backgroundColor: (ctx) => {
        const canvas = ctx.chart.ctx;
        const gradient = canvas.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(11,61,145,0.15)');
        gradient.addColorStop(1, 'rgba(11,61,145,0)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#D4AF37',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  const sharedScaleOpts = {
    grid: { color: 'rgba(11,61,145,0.05)', drawBorder: false },
    ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
  };

  const categoryChartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 8, boxHeight: 8, borderRadius: 4, color: '#64748b', font: { size: 10, family: 'Inter' }, padding: 12 }
      },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} docs` } }
    },
    cutout: '65%',
  };

  const deptChartOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} documents` } } },
    scales: { x: sharedScaleOpts, y: { ...sharedScaleOpts, beginAtZero: true } }
  };

  const trendChartOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} uploads` } } },
    scales: { x: sharedScaleOpts, y: { ...sharedScaleOpts, beginAtZero: true } }
  };

  const ocrAccuracy = reports?.ocr?.total
    ? (reports.ocr.success / reports.ocr.total * 100).toFixed(1)
    : '98.4';

  const totalCapacityBytes = 10 * 1024 * 1024 * 1024 * 1024;
  const storageProgress = stats?.storageUsedBytes
    ? Math.min(100, (stats.storageUsedBytes / totalCapacityBytes) * 100).toFixed(1)
    : '24.0';

  const statusConfig = {
    approved:     { label: 'VERIFIED',     color: '#16a34a',  bg: 'rgba(22,163,74,0.1)',    border: 'rgba(22,163,74,0.25)',   icon: '✓' },
    pending:      { label: 'PENDING',      color: '#d97706',  bg: 'rgba(217,119,6,0.1)',    border: 'rgba(217,119,6,0.25)',   icon: '⏳' },
    under_review: { label: 'UNDER REVIEW', color: '#d97706',  bg: 'rgba(217,119,6,0.1)',    border: 'rgba(217,119,6,0.25)',   icon: '👁' },
    rejected:     { label: 'FLAGGED',      color: '#dc2626',  bg: 'rgba(220,38,38,0.1)',    border: 'rgba(220,38,38,0.25)',   icon: '⚑' },
    archived:     { label: 'ARCHIVED',     color: '#64748b',  bg: 'rgba(100,116,139,0.1)',  border: 'rgba(100,116,139,0.25)', icon: '📦' },
  };

  const leftBorderColors = {
    approved: '#16a34a', pending: '#d97706', under_review: '#d97706',
    rejected: '#dc2626', archived: '#64748b',
  };

  return (
    <div className="space-y-6">

      {/* ── WELCOME BANNER ── */}
      <div className="welcome-banner p-6 text-white shadow-lg animate-card-enter"
        style={{ animationDelay: '0s' }}>
        {/* Decorative circles */}
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute left-0 bottom-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)', transform: 'translate(-20%, 40%)' }} />
        {/* Dots pattern */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden" style={{ opacity: 0.4 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute rounded-full animate-float"
              style={{
                width: `${20 + i * 12}px`, height: `${20 + i * 12}px`,
                right: `${10 + i * 12}%`, top: `${10 + i * 15}%`,
                background: 'rgba(255,255,255,0.04)',
                animationDelay: `${i * 0.6}s`,
                animationDuration: `${3 + i}s`
              }} />
          ))}
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-[0.12em] font-semibold mb-1">Welcome back,</p>
            <h2 className="text-3xl font-extrabold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
              {user?.name} 👋
            </h2>
            <p className="text-white/60 text-sm mt-1.5 font-medium capitalize">
              {user?.role?.replace(/_/g,' ')} ·{' '}
              {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(22,163,74,0.2)', color: '#6ee7b7', border: '1px solid rgba(22,163,74,0.3)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 status-dot-active" />
              System Online
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
              🔒 Secure SSL
            </span>
          </div>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <section className="animate-card-enter" style={{ animationDelay: '0.06s' }}>
        <div className="relative flex items-center"
          style={{ background: '#fff', borderRadius: '0.875rem', border: '1.5px solid rgba(11,61,145,0.12)',
            boxShadow: '0 4px 16px rgba(11,61,145,0.06)', overflow: 'hidden' }}>
          <div className="absolute left-4 text-[#0B3D91]"><Search size={17} /></div>
          <input
            className="flex-1 bg-transparent pl-11 pr-4 py-3.5 outline-none text-sm font-medium placeholder-slate-400 text-slate-800"
            placeholder="Search university records, documents, departments…"
            type="text"
            style={{ fontFamily: 'Inter' }}
            onFocus={() => navigate('/search')}
          />
          <div className="pr-4 flex items-center gap-2">
            <kbd className="px-2 py-1 rounded-md text-[10px] font-mono text-slate-400 border border-slate-200 bg-slate-50">⌘K</kbd>
          </div>
        </div>
      </section>

      {/* ── OCR & STORAGE CARDS ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-card-enter" style={{ animationDelay: '0.12s' }}>
        {/* OCR Card */}
        <div className="card card-glow-blue hover-lift">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1">OCR THROUGHPUT</p>
              <div className="text-3xl font-extrabold text-[#0B3D91] display-number">{ocrAccuracy}%</div>
              <p className="text-xs text-slate-400 mt-0.5">Recognition Accuracy</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(11,61,145,0.08)' }}>
                <CheckCircle size={22} className="text-[#0B3D91]" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)' }}>
                ● ACTIVE
              </span>
            </div>
          </div>
          <div className="progress-bar mt-3">
            <div className="progress-bar-fill" style={{ width: `${ocrAccuracy}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Institutional Standard: 95%+</p>
        </div>

        {/* Storage Card */}
        <div className="card card-glow-gold hover-lift">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1">TOTAL STORAGE</p>
              <div className="text-3xl font-extrabold text-[#0B3D91] display-number">{fmtBytes(stats?.storageUsedBytes)}</div>
              <p className="text-xs text-slate-400 mt-0.5">of 10 TB capacity</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(212,175,55,0.1)' }}>
                <Database size={22} style={{ color: '#D4AF37' }} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(212,175,55,0.1)', color: '#8B6D10', border: '1px solid rgba(212,175,55,0.3)' }}>
                {storageProgress}% USED
              </span>
            </div>
          </div>
          <div className="progress-bar mt-3">
            <div className="progress-bar-fill" style={{ width: `${storageProgress}%`, background: 'linear-gradient(90deg, #D4AF37, #F5D975)' }} />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Available: {(10 - (stats?.storageUsedBytes || 0) / (1024**4)).toFixed(2)} TB remaining</p>
        </div>
      </section>

      {/* ── DEPARTMENT DIRECTORIES ── */}
      <section className="card animate-card-enter" style={{ animationDelay: '0.18s' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="gold-bar h-5" />
            <h2 className="text-base font-bold text-[#0B3D91]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Department Directories
            </h2>
          </div>
          <button onClick={() => navigate('/vault')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0B3D91] hover:text-[#D4AF37] transition-colors group">
            View All
            <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {reports?.byDepartment?.slice(0, 6).map((d, index) => {
            const palette = [
              { top: '#0B3D91', bg: 'rgba(11,61,145,0.06)', icon: '🔵' },
              { top: '#D4AF37', bg: 'rgba(212,175,55,0.08)', icon: '🟡' },
              { top: '#16a34a', bg: 'rgba(22,163,74,0.06)', icon: '🟢' },
              { top: '#dc2626', bg: 'rgba(220,38,38,0.06)', icon: '🔴' },
              { top: '#7c3aed', bg: 'rgba(124,58,237,0.06)', icon: '🟣' },
              { top: '#0891b2', bg: 'rgba(8,145,178,0.06)', icon: '🔷' },
            ];
            const p = palette[index % palette.length];
            return (
              <div
                key={d.department_code}
                onClick={() => navigate('/vault')}
                className="flex-shrink-0 w-36 p-4 rounded-xl cursor-pointer transition-all duration-300 hover-lift ripple-container"
                style={{
                  background: p.bg,
                  border: `1.5px solid ${p.top}20`,
                  borderTop: `3px solid ${p.top}`,
                }}
              >
                <div className="text-2xl mb-3 animate-float" style={{ animationDelay: `${index * 0.3}s` }}>
                  📁
                </div>
                <p className="font-bold text-xs text-slate-800 truncate">{d.department_code}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: p.top }}>{d.count} files</p>
              </div>
            );
          })}
          {(!reports?.byDepartment || reports.byDepartment.length === 0) && (
            <div className="flex-1 flex items-center justify-center py-8 text-slate-400 text-sm">
              No departments found
            </div>
          )}
        </div>
      </section>

      {/* ── RECENT DOCUMENTS (Record Ledger) ── */}
      <section className="card animate-card-enter" style={{ animationDelay: '0.24s' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="gold-bar h-5" />
            <div>
              <h2 className="text-base font-bold text-[#0B3D91]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Record Ledger
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Most recent institutional documents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ background: 'rgba(11,61,145,0.08)', color: '#0B3D91', border: '1px solid rgba(11,61,145,0.15)' }}>
              OCR V2.1
            </span>
            <button onClick={() => navigate('/search')}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:bg-blue-50 hover:text-[#0B3D91] text-slate-400"
              style={{ border: '1px solid #e2e8f0' }}>
              <span className="material-symbols-outlined text-[18px]">sort</span>
            </button>
          </div>
        </div>

        {/* Status legend */}
        <div className="flex items-center gap-4 mb-5 p-3 rounded-xl" style={{ background: '#F8FAFF', border: '1px solid rgba(11,61,145,0.06)' }}>
          {[['#16a34a','Verified'],['#d97706','Pending'],['#dc2626','Flagged']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {docs.map((doc, i) => {
            const sc = statusConfig[doc.status] || statusConfig.pending;
            const lb = leftBorderColors[doc.status] || '#64748b';
            return (
              <div
                key={doc.id}
                onClick={() => navigate('/vault')}
                className="flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.005] group animate-card-enter"
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderLeft: `4px solid ${lb}`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  animationDelay: `${0.24 + i * 0.05}s`,
                }}
              >
                {/* Icon */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                  style={{ background: 'rgba(11,61,145,0.06)', border: '1px solid rgba(11,61,145,0.08)' }}>
                  <span className="material-symbols-outlined text-[20px] text-[#0B3D91]">description</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-slate-800 truncate group-hover:text-[#0B3D91] transition-colors">
                        {doc.title}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">ID: REC-{doc.id}-X</p>
                    </div>
                    {/* Status badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0"
                      style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                      <span>{sc.icon}</span>
                      {sc.label}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    {doc.category && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(212,175,55,0.1)', color: '#8B6D10', border: '1px solid rgba(212,175,55,0.25)' }}>
                        {doc.category.toUpperCase().replace(/_/g,' ')}
                      </span>
                    )}
                    {doc.department_code && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(11,61,145,0.06)', color: '#0B3D91', border: '1px solid rgba(11,61,145,0.15)' }}>
                        {doc.department_code}
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                      <Clock size={10} />
                      {new Date(doc.created_at).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {docs.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-3">📂</div>
              <p className="text-sm font-medium">No recent documents found</p>
              <p className="text-xs mt-1">Upload documents to see them here</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CHARTS ── */}
      <section className="animate-card-enter" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="gold-bar h-5" />
          <div>
            <h2 className="text-base font-bold text-[#0B3D91]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Reports &amp; Trends
            </h2>
            <p className="text-xs text-slate-400">Visual analysis of record uploads and categories</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Category Donut */}
          <div className="card card-glow-blue hover-lift">
            <p className="section-title flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0B3D91]" />
              Documents by Category
            </p>
            <div className="h-52">
              <Doughnut data={categoryChart} options={categoryChartOptions} />
            </div>
          </div>

          {/* Dept Bar */}
          <div className="card hover-lift">
            <p className="section-title flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: '#D4AF37' }} />
              Top Departments
            </p>
            <div className="h-52">
              <Bar data={deptChart} options={deptChartOptions} />
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="card card-glow-green hover-lift">
            <p className="section-title flex items-center gap-2">
              <TrendingUp size={14} className="text-[#16a34a]" />
              Monthly Upload Trend
            </p>
            <div className="h-52">
              <Line data={trendChart} options={trendChartOptions} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
