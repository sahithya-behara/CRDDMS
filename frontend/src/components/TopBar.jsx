import { Menu, Bell, Search, ChevronDown, Check, X, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/dashboard':  { title: 'Dashboard',          sub: 'Overview & Analytics' },
  '/vault':      { title: 'Department Vault',    sub: 'Browse institutional records' },
  '/upload':     { title: 'Upload Document',     sub: 'Add new records to the vault' },
  '/search':     { title: 'Search Documents',    sub: 'Find records instantly' },
  '/compliance': { title: 'Compliance Center',   sub: 'Monitor regulatory standards' },
  '/workflow':   { title: 'Approval Workflow',   sub: 'Manage pending approvals' },
  '/archive':    { title: 'Archive Center',      sub: 'Long-term document storage' },
  '/audit':      { title: 'Audit Logs',          sub: 'Full system activity trail' },
  '/users':      { title: 'User Management',     sub: 'Manage institutional accounts' },
  '/reports':    { title: 'Reports & Analytics', sub: 'Visual insights & trends' },
  '/profile':    { title: 'Profile Settings',    sub: 'Manage your account' },
};

export default function TopBar({ onMenuClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotif, setShowNotif]   = useState(false);
  const [showUser,  setShowUser]    = useState(false);
  const notifRef = useRef(null);
  const userRef  = useRef(null);

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('crddms_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to parse notifications:', err);
      }
    }
    return [
      { id: 1, icon: '📋', text: '3 documents pending approval', time: '2m ago', color: '#d97706', read: false },
      { id: 2, icon: '✅', text: 'OCR processing completed for 2 files', time: '15m ago', color: '#16a34a', read: false },
      { id: 3, icon: '🔔', text: 'Compliance review due tomorrow', time: '1h ago', color: '#0B3D91', read: false },
    ];
  });

  useEffect(() => {
    localStorage.setItem('crddms_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'CRDDMS', sub: 'JNTU-GV Document Portal' };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setShowUser(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <header className="topbar-premium h-[60px] flex items-center px-4 gap-3 z-20 flex-shrink-0">
      {/* Menu toggle */}
      <button onClick={onMenuClick} className="btn-icon">
        <Menu size={19} />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-200 hidden lg:block" />

      {/* Page title — dynamic */}
      <div className="hidden md:block">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{
            background: 'linear-gradient(180deg, #0B3D91, #D4AF37)'
          }} />
          <div>
            <p className="text-sm font-700 text-[#0B3D91] leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: '-0.01em' }}>
              {pageInfo.title}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">{pageInfo.sub}</p>
          </div>
        </div>
      </div>

      {/* Mobile: just the logo text */}
      <div className="md:hidden flex items-center gap-2">
        <img src={`${import.meta.env.BASE_URL}jntugv_logo.jpg`}
          alt="JNTU-GV" className="w-7 h-7 object-contain rounded-md" />
        <span className="font-bold text-sm text-[#0B3D91]">CRDDMS</span>
      </div>

      <div className="flex-1" />

      {/* ── RIGHT SIDE ACTIONS ── */}
      <div className="flex items-center gap-1.5">

        {/* Quick search pill */}
        <button
          onClick={() => navigate('/search')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-[#0B3D91] border border-transparent hover:border-blue-100"
        >
          <Search size={13} />
          <span>Quick search...</span>
          <kbd className="ml-1 px-1 py-0.5 rounded text-[10px] bg-slate-100 text-slate-400 font-mono border border-slate-200">⌘K</kbd>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="btn-icon relative"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="notif-dot absolute top-1 right-1" />
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-80 rounded-2xl z-50 animate-fade-in overflow-hidden"
              style={{
                background: '#fff',
                border: '1px solid rgba(11,61,145,0.1)',
                boxShadow: '0 24px 48px rgba(11,61,145,0.15), 0 6px 16px rgba(0,0,0,0.06)'
              }}>
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, #072558, #0B3D91)' }}>
                <div className="flex items-center gap-2">
                  <Bell size={13} style={{ color: '#D4AF37' }} />
                  <p className="text-sm font-semibold text-white">Notifications</p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] text-white hover:text-[#D4AF37] font-semibold transition-colors flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <CheckSquare size={10} /> Mark read
                    </button>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#D4AF37', color: '#072558' }}>
                    {unreadCount} NEW
                  </span>
                </div>
              </div>
              
              <div className="max-h-72 overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400">
                    <Bell size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold">All caught up!</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">No notifications at the moment.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      className={`px-4 py-3 flex items-start gap-3 border-b border-slate-50 last:border-0 group transition-all duration-200 ${
                        n.read ? 'bg-slate-50/50 hover:bg-slate-50' : 'bg-blue-50/20 hover:bg-blue-50/40'
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{n.icon}</span>
                      <div className="flex-1 min-w-0" onClick={() => !n.read && markAsRead(n.id)}>
                        <p className={`text-xs leading-snug cursor-pointer transition-colors ${
                          n.read ? 'text-slate-400 font-normal' : 'text-slate-700 font-semibold'
                        }`}>
                          {n.text}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                            className="p-1 rounded bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 hover:border-emerald-200 transition-colors"
                            title="Mark as read"
                          >
                            <Check size={11} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); clearNotification(n.id); }}
                          className="p-1 rounded bg-white hover:bg-red-50 text-red-500 border border-slate-200 hover:border-red-200 transition-colors"
                          title="Clear / Dismiss"
                        >
                          <X size={11} />
                        </button>
                      </div>
                      
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5 animate-pulse" style={{ background: n.color }} />
                      )}
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-500">
                  <button 
                    onClick={clearAllNotifications} 
                    className="hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                  <button 
                    onClick={() => { setShowNotif(false); navigate('/audit'); }}
                    className="text-[#0B3D91] hover:underline"
                  >
                    View audit logs
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200" />

        {/* User avatar dropdown */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUser(!showUser)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all duration-200 hover:bg-blue-50 group"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0 transition-transform group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #0B3D91, #1E5AA8)',
                color: '#D4AF37',
                boxShadow: '0 2px 8px rgba(11,61,145,0.3)'
              }}>
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[110px]">{user?.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role?.replace(/_/g,' ')}</p>
            </div>
            <ChevronDown size={12} className={`text-slate-400 hidden sm:block transition-transform duration-200 ${showUser ? 'rotate-180' : ''}`} />
          </button>

          {showUser && (
            <div className="absolute right-0 top-12 w-52 rounded-2xl z-50 animate-fade-in overflow-hidden"
              style={{
                background: '#fff',
                border: '1px solid rgba(11,61,145,0.1)',
                boxShadow: '0 24px 48px rgba(11,61,145,0.15)'
              }}>
              <div className="px-4 py-3 border-b border-slate-100"
                style={{ background: 'linear-gradient(135deg, #F0F4FF, #E8F0FE)' }}>
                <p className="text-xs font-bold text-[#0B3D91]">{user?.name}</p>
                <p className="text-[10px] text-slate-500 capitalize mt-0.5">{user?.email}</p>
              </div>
              <div className="p-1">
                {[
                  { label: 'Profile Settings', icon: '👤', action: () => { navigate('/profile'); setShowUser(false); } },
                  { label: 'My Documents',     icon: '📁', action: () => { navigate('/vault');   setShowUser(false); } },
                ].map((item, i) => (
                  <button key={i} onClick={item.action}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-[#0B3D91] transition-colors text-left">
                    <span>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
