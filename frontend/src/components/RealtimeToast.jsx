// components/RealtimeToast.jsx — Accessible live update institutional toast notifications
import React from 'react';
import { X, CheckCircle2, AlertCircle, Info, ShieldCheck, FileText, Bell } from 'lucide-react';

const ICON_MAP = {
  document: FileText,
  approval: CheckCircle2,
  compliance: ShieldCheck,
  user: Info,
  alert: AlertCircle,
  default: Bell,
};

export default function RealtimeToast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const IconComponent = ICON_MAP[toast.category] || ICON_MAP.default;
        const isUrgent = toast.type === 'error' || toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 animate-slide-in-right"
            style={{
              backgroundColor: isUrgent ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: isUrgent ? 'rgba(220, 38, 38, 0.3)' : 'rgba(11, 61, 145, 0.2)',
              boxShadow: '0 10px 25px -5px rgba(7, 37, 88, 0.2), 0 8px 10px -6px rgba(7, 37, 88, 0.1)',
            }}
          >
            {/* Left Accent Pillar */}
            <div
              className="w-1 self-stretch rounded-full flex-shrink-0"
              style={{
                backgroundColor: toast.type === 'success' ? '#16a34a' : toast.type === 'warning' ? '#d97706' : toast.type === 'error' ? '#dc2626' : '#0B3D91',
              }}
            />

            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                backgroundColor: toast.type === 'success' ? 'rgba(22, 163, 74, 0.1)' : toast.type === 'warning' ? 'rgba(217, 119, 6, 0.1)' : toast.type === 'error' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(11, 61, 145, 0.1)',
                color: toast.type === 'success' ? '#16a34a' : toast.type === 'warning' ? '#d97706' : toast.type === 'error' ? '#dc2626' : '#0B3D91',
              }}
            >
              <IconComponent size={16} />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B3D91]">
                  {toast.title || 'Live System Update'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {toast.time || 'Just now'}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium mt-0.5 leading-snug break-words">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Close notification"
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors -mr-1 -mt-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
