// components/StatCard.jsx — Premium animated stat widget
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'primary', trend, suffix = '', prefix = '' }) {
  const [displayed, setDisplayed] = useState(0);
  const numVal = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;

  useEffect(() => {
    if (!numVal) return;
    const duration = 1000;
    const step = numVal / (duration / 16);
    let cur = 0;
    const timer = setInterval(() => {
      cur = Math.min(cur + step, numVal);
      setDisplayed(cur);
      if (cur >= numVal) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [numVal]);

  const colorMap = {
    primary: { bg: 'rgba(11,61,145,0.08)',  text: '#0B3D91', border: 'rgba(11,61,145,0.12)',  top: '#0B3D91' },
    success: { bg: 'rgba(22,163,74,0.08)',  text: '#16a34a', border: 'rgba(22,163,74,0.12)',  top: '#16a34a' },
    warning: { bg: 'rgba(217,119,6,0.08)',  text: '#d97706', border: 'rgba(217,119,6,0.12)',  top: '#d97706' },
    danger:  { bg: 'rgba(220,38,38,0.08)',  text: '#dc2626', border: 'rgba(220,38,38,0.12)',  top: '#dc2626' },
    accent:  { bg: 'rgba(212,175,55,0.10)', text: '#8B6D10', border: 'rgba(212,175,55,0.2)',  top: '#D4AF37' },
  };
  const c = colorMap[color] || colorMap.primary;

  const isInt = Number.isInteger(numVal);
  const displayVal = isInt
    ? Math.round(displayed).toLocaleString('en-IN')
    : displayed.toFixed(1);

  return (
    <div className="stat-card animate-card-enter group"
      style={{ borderTop: `3px solid ${c.top}` }}>
      {/* Decorative bg blob */}
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: c.bg, filter: 'blur(16px)', opacity: 0.6 }} />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2">{title}</p>
          <p className="display-number text-3xl font-extrabold" style={{ color: '#0B3D91', letterSpacing: '-0.03em' }}>
            {prefix}{displayVal}{suffix}
          </p>
          {trend && (
            <p className={`text-[11px] mt-2 font-semibold flex items-center gap-1 ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend > 0
                ? <ArrowUpRight size={12} />
                : <ArrowDownRight size={12} />}
              {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ml-3 group-hover:scale-110 transition-transform duration-300"
          style={{ background: c.bg, border: `1px solid ${c.border}` }}>
          <Icon size={21} style={{ color: c.text }} />
        </div>
      </div>
    </div>
  );
}
