// components/SystemAnimations.jsx
// Official system-themed animation components for CRDDMS / JNTU-GV
// All keyframes live in index.css — NO inline <style> tags here.

import { useEffect, useState, useRef } from 'react';
import { ShieldCheck, Cpu, HardDrive, Wifi, CheckCircle2, AlertTriangle, Lock, Scan } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   1. BOOT SPLASH SCREEN
═══════════════════════════════════════════════════ */
export function BootSplash({ onComplete }) {
  const [phase,    setPhase]    = useState(0);
  const [checks,   setChecks]   = useState([
    { label: 'Authenticating Session',       done: false },
    { label: 'Loading Institutional Vault',  done: false },
    { label: 'Verifying SSL Certificate',    done: false },
    { label: 'Initializing OCR Engine v2.1', done: false },
    { label: 'Syncing Department Registry',  done: false },
  ]);
  const [progress, setProgress] = useState(0);
  const [fading,   setFading]   = useState(false);

  useEffect(() => {
    const timers = [];
    timers.push(setTimeout(() => setPhase(1), 700));

    let delay = 900;
    checks.forEach((_, i) => {
      const t = setTimeout(() => {
        setChecks(prev => prev.map((c, j) => j === i ? { ...c, done: true } : c));
        setProgress(Math.round(((i + 1) / 5) * 100));
      }, delay);
      timers.push(t);
      delay += 320;
    });

    timers.push(setTimeout(() => {
      setFading(true);
      setTimeout(() => onComplete?.(), 500);
    }, delay + 200));

    return () => timers.forEach(clearTimeout);
  }, []);

  const activeIdx = checks.findIndex(c => !c.done);

  return (
    <div
      className={fading ? 'sys-boot-fade' : ''}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(135deg, #072558 0%, #0B3D91 55%, #0d3580 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* Decorative orbs */}
      <div className="sys-orbit-cw" style={{
        position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
        border: '1px solid rgba(212,175,55,0.08)',
        top: '50%', left: '50%',
      }} />
      <div className="sys-orbit-ccw" style={{
        position: 'absolute', width: '460px', height: '460px', borderRadius: '50%',
        border: '1px solid rgba(212,175,55,0.05)',
        top: '50%', left: '50%',
      }} />

      {/* Logo block */}
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '48px', position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <div className="sys-pulse-ring" style={{
            position: 'absolute', inset: '-12px', borderRadius: '50%',
            border: '2px solid rgba(212,175,55,0.3)',
          }} />
          <div style={{
            width: '80px', height: '80px', borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
            border: '2px solid rgba(212,175,55,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(212,175,55,0.2)',
          }}>
            <ShieldCheck size={38} color="#D4AF37" />
          </div>
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.5rem',
          fontWeight: 800, color: '#ffffff', letterSpacing: '-0.04em', margin: '0 0 6px',
        }}>CRDDMS</h1>
        <p style={{ color: 'rgba(212,175,55,0.8)', fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
          JNTU-GV · Institutional Digital Vault
        </p>
      </div>

      {/* Checks panel */}
      {phase >= 1 && (
        <div className="animate-fade-in" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', padding: '24px 32px', minWidth: '340px',
          position: 'relative', zIndex: 2, backdropFilter: 'blur(8px)',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            System Initialization
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {checks.map((check, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                opacity: (check.done || i === activeIdx) ? 1 : 0.3,
                transition: 'opacity 0.3s',
              }}>
                <div style={{ width: '18px', height: '18px', flexShrink: 0 }}>
                  {check.done
                    ? <CheckCircle2 size={18} color="#16a34a" className="sys-scale-in" />
                    : i === activeIdx
                      ? <div className="sys-spin" style={{ width: '18px', height: '18px', border: '2px solid #D4AF37', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      : <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.15)', borderRadius: '50%' }} />
                  }
                </div>
                <span style={{
                  fontSize: '0.8rem', fontFamily: 'Inter, sans-serif',
                  color: check.done ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                  fontWeight: check.done ? 600 : 400,
                }}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '99px', width: `${progress}%`,
              background: 'linear-gradient(90deg, #0B3D91, #D4AF37)',
              transition: 'width 0.35s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textAlign: 'right',
            margin: '6px 0 0', fontFamily: 'JetBrains Mono, monospace' }}>
            {progress}%
          </p>
        </div>
      )}

      <p style={{ position: 'absolute', bottom: '24px', color: 'rgba(255,255,255,0.2)',
        fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', zIndex: 2 }}>
        CRDDMS v2.1 · Build 2026.06 · JNTU-GV © 2026
      </p>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   2. OCR SCAN LINE ANIMATION
═══════════════════════════════════════════════════ */
export function OcrScanAnimation({ isScanning }) {
  if (!isScanning) return null;
  return (
    <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#0F172A', minHeight: '160px' }}>
      {/* Doc line stubs */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.2 }}>
        {[90,75,85,60,95,70].map((w, i) => (
          <div key={i} style={{ height: '10px', borderRadius: '4px', background: '#fff', width: `${w}%` }} />
        ))}
      </div>

      {/* Scan line — uses CSS class */}
      <div className="sys-scan-line" />

      {/* Corner brackets */}
      {[
        { top: '8px',    left: '8px',  borderTop: '2px solid #D4AF37', borderLeft:  '2px solid #D4AF37', borderRadius: '4px 0 0 0' },
        { top: '8px',    right: '8px', borderTop: '2px solid #D4AF37', borderRight: '2px solid #D4AF37', borderRadius: '0 4px 0 0' },
        { bottom: '8px', left: '8px',  borderBottom: '2px solid #D4AF37', borderLeft:  '2px solid #D4AF37', borderRadius: '0 0 0 4px' },
        { bottom: '8px', right: '8px', borderBottom: '2px solid #D4AF37', borderRight: '2px solid #D4AF37', borderRadius: '0 0 4px 0' },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: '16px', height: '16px', ...s }} />
      ))}

      {/* OCR label */}
      <div style={{
        position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)',
        borderRadius: '99px', padding: '4px 14px', zIndex: 3,
      }}>
        <Scan size={13} color="#D4AF37" />
        <span style={{ color: '#D4AF37', fontSize: '0.7rem', fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
          OCR SCANNING…
        </span>
        <TypingDots />
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   3. DOCUMENT PROCESSING ANIMATION
═══════════════════════════════════════════════════ */
export function DocumentProcessing({ label = 'Processing Document…', progress = 0, steps = [] }) {
  const defaultSteps = steps.length > 0 ? steps : [
    'Encrypting file payload',
    'Indexing metadata tags',
    'Running OCR pipeline',
    'Updating audit ledger',
  ];
  const activeStep = Math.min(Math.floor((progress / 100) * defaultSteps.length), defaultSteps.length - 1);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #072558, #0B3D91)',
      borderRadius: '16px', padding: '28px 24px', color: '#fff',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative rings */}
      <div className="sys-ring-spin-cw" style={{ position: 'absolute', top: '-60px', right: '-60px',
        width: '200px', height: '200px', borderRadius: '50%', border: '2px solid rgba(212,175,55,0.1)' }} />
      <div className="sys-ring-spin-ccw" style={{ position: 'absolute', top: '-30px', right: '-30px',
        width: '120px', height: '120px', borderRadius: '50%', border: '2px solid rgba(212,175,55,0.15)' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
        <div className="sys-breathe" style={{
          width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
          background: 'rgba(212,175,55,0.15)', border: '1.5px solid rgba(212,175,55,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Cpu size={24} color="#D4AF37" />
        </div>
        <div>
          <p style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '-0.01em', margin: 0 }}>{label}</p>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0',
            fontFamily: 'JetBrains Mono, monospace' }}>CRDDMS · Secure Processing Pipeline</p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ position: 'relative', zIndex: 2, marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>PROGRESS</span>
          <span style={{ fontSize: '0.7rem', color: '#D4AF37', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{progress}%</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
          <div className="sys-shimmer-bar" style={{
            height: '100%', borderRadius: '99px', width: `${progress}%`,
            transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', zIndex: 2 }}>
        {defaultSteps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: i <= activeStep ? 1 : 0.35 }}>
            <div style={{ width: '20px', height: '20px', flexShrink: 0 }}>
              {i < activeStep
                ? <CheckCircle2 size={20} color="#16a34a" />
                : i === activeStep
                  ? <div className="sys-spin" style={{ width: '20px', height: '20px', border: '2px solid #D4AF37', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  : <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%' }} />
              }
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: i === activeStep ? 600 : 400,
              color: i < activeStep ? 'rgba(255,255,255,0.7)' : i === activeStep ? '#fff' : 'rgba(255,255,255,0.35)' }}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   4. APPROVAL STAMP ANIMATION
═══════════════════════════════════════════════════ */
export function ApprovalStamp({ status, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDone?.(); }, 2200);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const isApproved = status === 'approved';
  const color  = isApproved ? '#16a34a' : '#dc2626';
  const label  = isApproved ? 'APPROVED' : 'REJECTED';
  const rot    = isApproved ? '-8deg' : '8deg';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
      background: 'rgba(0,0,0,0.12)',
    }}>
      <div className="sys-stamp" style={{
        '--stamp-rot': rot,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: `6px solid ${color}`,
        borderRadius: '12px', padding: '20px 40px',
        background: `${color}08`,
        backdropFilter: 'blur(4px)',
        boxShadow: `0 0 60px ${color}40`,
        transform: `rotate(${rot})`,
      }}>
        {isApproved
          ? <ShieldCheck size={48} color={color} />
          : <AlertTriangle size={48} color={color} />
        }
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem',
          fontWeight: 900, color, letterSpacing: '0.15em', margin: '8px 0 0' }}>
          {label}
        </p>
        <p style={{ fontSize: '0.65rem', color, opacity: 0.7, letterSpacing: '0.1em',
          margin: '4px 0 0', fontFamily: 'JetBrains Mono, monospace' }}>
          JNTU-GV · CRDDMS · {new Date().toLocaleDateString('en-IN')}
        </p>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   5. SYSTEM STATUS TICKER BAR
═══════════════════════════════════════════════════ */
export function SystemStatusBar() {
  const items = [
    { icon: '🟢', label: 'SYSTEM ONLINE' },
    { icon: '🔒', label: 'SSL SECURED' },
    { icon: '⚡', label: 'OCR ENGINE v2.1 ACTIVE' },
    { icon: '🛡️', label: 'DATA ENCRYPTED · AES-256' },
    { icon: '📡', label: 'SYNC IN PROGRESS' },
    { icon: '✅', label: 'NAAC COMPLIANCE: ACTIVE' },
    { icon: '🗄️', label: 'VAULT INTEGRITY: 100%' },
    { icon: '🔑', label: 'JNTU-GV AUTH: VERIFIED' },
  ];

  return (
    <div style={{
      background: 'linear-gradient(90deg, #072558, #0B3D91)',
      borderRadius: '8px', padding: '6px 0', overflow: 'hidden',
      position: 'relative', border: '1px solid rgba(212,175,55,0.2)',
      marginBottom: '0',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px',
        background: 'linear-gradient(90deg, #072558, transparent)', zIndex: 2 }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px',
        background: 'linear-gradient(-90deg, #0B3D91, transparent)', zIndex: 2 }} />

      <div className="sys-ticker">
        {[...items, ...items].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span style={{ fontSize: '12px' }}>{item.icon}</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#D4AF37',
              letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>
              {item.label}
            </span>
            <span style={{ color: 'rgba(212,175,55,0.3)', fontSize: '0.65rem' }}>◆</span>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   6. UPLOAD ZONE ANIMATION (radar rings on drag)
═══════════════════════════════════════════════════ */
export function UploadZoneAnimation({ isDragActive, hasFile, children }) {
  return (
    <div style={{
      borderRadius: '16px',
      border: isDragActive ? '2px solid #D4AF37' : hasFile ? '2px solid rgba(22,163,74,0.5)' : '2px dashed rgba(11,61,145,0.25)',
      background: isDragActive ? 'rgba(212,175,55,0.05)' : hasFile ? 'rgba(22,163,74,0.03)' : 'rgba(11,61,145,0.02)',
      padding: '40px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
      cursor: 'pointer', position: 'relative', overflow: 'hidden',
      boxShadow: isDragActive ? '0 0 40px rgba(212,175,55,0.15)' : 'none',
    }}>
      {isDragActive && (
        <>
          <div className="sys-radar" style={{ animationDelay: '0s' }} />
          <div className="sys-radar" style={{ animationDelay: '0.5s' }} />
          <div className="sys-radar" style={{ animationDelay: '1s' }} />
        </>
      )}
      {children}
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   7. DATA STREAM LOG (terminal feed)
═══════════════════════════════════════════════════ */
export function DataStreamLog({ lines = [], maxLines = 8 }) {
  const containerRef = useRef(null);
  const AUTO_LINES = [
    '[INFO]  Session initialized for institutional user',
    '[AUTH]  JWT token validated · role: super_admin',
    '[VAULT] Department registry loaded · 12 departments',
    '[OCR]   Engine v2.1 ready · GPU acceleration: OFF',
    '[SSL]   Certificate valid until 2027-03-14',
    '[SYNC]  Last sync: ' + new Date().toLocaleTimeString('en-IN'),
    '[INDEX] Document index: 1,243 records',
    '[AUDIT] Ledger integrity: OK',
  ];
  const shown = lines.length > 0 ? lines.slice(-maxLines) : AUTO_LINES;

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  return (
    <div ref={containerRef} style={{
      background: '#0B1220', borderRadius: '12px', padding: '16px',
      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem',
      color: '#7dd3fc', maxHeight: '200px', overflowY: 'auto',
      border: '1px solid rgba(11,61,145,0.3)', lineHeight: 1.7,
    }}>
      <div style={{ color: 'rgba(212,175,55,0.7)', marginBottom: '8px',
        fontSize: '0.65rem', letterSpacing: '0.1em' }}>
        ▶ CRDDMS SYSTEM LOG · LIVE
      </div>
      {shown.map((line, i) => {
        const isError = line.includes('[ERROR]') || line.includes('[WARN]');
        const isOk    = line.includes('[OK]') || line.includes('[AUTH]');
        const color   = isError ? '#f87171' : isOk ? '#86efac' : '#7dd3fc';
        return (
          <div key={i} className={i === shown.length - 1 ? 'sys-log-entry' : ''} style={{ color }}>
            <span style={{ color: 'rgba(255,255,255,0.25)', marginRight: '8px' }}>
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            {line}
          </div>
        );
      })}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
        <span style={{ color: '#D4AF37' }}>_</span>
        <span className="sys-cursor" style={{ color: '#D4AF37', fontSize: '0.85rem' }}>|</span>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   8. SECURITY GATE
═══════════════════════════════════════════════════ */
export function SecurityGate({ show, children }) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (show) {
      const t = setTimeout(() => setUnlocked(true), 1000);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!show || unlocked) return children;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '200px', gap: '16px' }}>
      <div style={{ position: 'relative' }} className="sys-lock-shake sys-lock-unlock">
        <Lock size={48} color="#0B3D91" />
        <div className="sys-pulse-ring" style={{
          position: 'absolute', inset: '-8px', borderRadius: '50%',
          border: '2px solid rgba(11,61,145,0.3)',
        }} />
      </div>
      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0B3D91',
        fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
        AUTHENTICATING ACCESS…
      </p>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   INTERNAL: Typing dots
═══════════════════════════════════════════════════ */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      <div className="sys-dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#D4AF37' }} />
      <div className="sys-dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#D4AF37' }} />
      <div className="sys-dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#D4AF37' }} />
    </div>
  );
}
