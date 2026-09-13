// components/ResponsiveTable.jsx — Responsive container for university data tables
import React from 'react';

export default function ResponsiveTable({
  children,
  className = '',
  scrollHint = true,
}) {
  return (
    <div className="w-full relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Visual mobile swipe indicator if wide table */}
      {scrollHint && (
        <div className="md:hidden flex items-center justify-between px-4 py-1.5 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B3D91]" />
            Scroll horizontally to view complete record details
          </span>
          <span className="font-mono text-[10px] text-slate-400">↔ Swipe</span>
        </div>
      )}

      {/* Overflow Container with smooth inertial touch scrolling */}
      <div className={`overflow-x-auto w-full max-w-full scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent ${className}`}>
        {children}
      </div>
    </div>
  );
}
