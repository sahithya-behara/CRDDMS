// components/Sidebar.jsx — Premium dark glassmorphism sidebar
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FolderOpen, Upload, Search, ScanText,
  ShieldCheck, CheckSquare, Archive, ScrollText, Users,
  BarChart3, UserCircle, LogOut, X, GraduationCap, ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',         group: 'main' },
  { to: '/vault',      icon: FolderOpen,       label: 'Department Vault',  group: 'main' },
  { to: '/upload',     icon: Upload,           label: 'Upload Document',   group: 'main' },
  { to: '/search',     icon: Search,           label: 'Search Documents',  group: 'main' },
  { to: '/compliance', icon: ShieldCheck,      label: 'Compliance Center', group: 'workflow' },
  { to: '/workflow',   icon: CheckSquare,      label: 'Approval Workflow', group: 'workflow' },
  { to: '/archive',    icon: Archive,          label: 'Archive Center',    group: 'workflow' },
  { to: '/audit',      icon: ScrollText,       label: 'Audit Logs',        group: 'admin',    roles: ['admin','super_admin','compliance_reviewer'] },
  { to: '/users',      icon: Users,            label: 'User Management',   group: 'admin',    roles: ['admin','super_admin'] },
  { to: '/reports',    icon: BarChart3,        label: 'Reports & Analytics', group: 'admin' },
  { to: '/profile',    icon: UserCircle,       label: 'Profile Settings',  group: 'account' },
];

const GROUP_LABELS = {
  main:     'NAVIGATION',
  workflow: 'WORKFLOW',
  admin:    'ADMINISTRATION',
  account:  'ACCOUNT',
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  // Group items
  const grouped = visibleItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});
  const groupOrder = ['main', 'workflow', 'admin', 'account'];

  const initials = user?.name
    ? user.name.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(7,37,88,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 flex flex-col
          sidebar-glass
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* ── HEADER ─── */}
        <div className="px-4 pt-5 pb-4 border-b border-white/10 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full"
            style={{ background: 'rgba(212,175,55,0.07)', filter: 'blur(20px)' }} />

          <div className="flex items-center gap-3 relative z-10">
            {/* Logo */}
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-white/20 shadow-lg"
              style={{ boxShadow: '0 0 16px rgba(212,175,55,0.25)' }}>
              <img
                src={`${import.meta.env.BASE_URL}jntugv_logo.jpg`}
                alt="JNTU-GV Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm leading-tight"
                style={{ color: '#D4AF37', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
                CRDDMS
              </p>
              <p className="text-[10px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                JNTU-GV Digital Vault
              </p>
            </div>
            <button onClick={onClose}
              className="ml-auto lg:hidden w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)' }}>
              <X size={14} />
            </button>
          </div>

          {/* Live clock */}
          <div className="mt-3 flex items-center gap-2 relative z-10">
            <div className="status-dot status-dot-active flex-shrink-0" />
            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>
              System Online · {time.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true })}
            </span>
          </div>
        </div>

        {/* ── USER CARD ─── */}
        <div className="mx-3 my-3 p-3 rounded-xl relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="absolute inset-0 rounded-xl" style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, transparent 60%)'
          }} />
          <div className="flex items-center gap-3 relative z-10">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #8B6D10)',
                color: '#072558',
                boxShadow: '0 4px 12px rgba(212,175,55,0.3)'
              }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {user?.name}
              </p>
              <p className="text-[10px] capitalize mt-0.5"
                style={{ color: 'rgba(212,175,55,0.8)', fontWeight: 600 }}>
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="w-2 h-2 rounded-full flex-shrink-0 status-dot-active"
              style={{ background: '#16a34a' }} />
          </div>
        </div>

        {/* ── NAVIGATION ─── */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3 no-scrollbar"
          style={{ scrollbarWidth: 'none' }}>
          {groupOrder.map(group => {
            const items = grouped[group];
            if (!items || items.length === 0) return null;
            return (
              <div key={group} className="mb-4">
                <p className="px-2 py-1.5 text-[9px] font-bold tracking-[0.12em]"
                  style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>
                  {GROUP_LABELS[group]}
                </p>
                <div className="space-y-0.5">
                  {items.map(({ to, icon: Icon, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => window.innerWidth < 1024 && onClose()}
                      className={({ isActive }) =>
                        `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-all duration-200"
                            style={{
                              background: isActive
                                ? 'rgba(212,175,55,0.2)'
                                : 'rgba(255,255,255,0.05)',
                            }}>
                            <Icon size={15} />
                          </div>
                          <span className="truncate flex-1">{label}</span>
                          {isActive && (
                            <ChevronRight size={12} style={{ color: '#D4AF37', opacity: 0.7 }} />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── LOGOUT ─── */}
        <div className="px-3 pb-4 pt-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="sidebar-item w-full"
            style={{ color: 'rgba(252,165,165,0.8)' }}
          >
            <div className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-all"
              style={{ background: 'rgba(220,38,38,0.12)' }}>
              <LogOut size={15} />
            </div>
            <span>Sign Out</span>
          </button>
          {/* Version tag */}
          <p className="text-center text-[9px] mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
            CRDDMS v2.1 · JNTU-GV © 2026
          </p>
        </div>
      </aside>
    </>
  );
}
