// layouts/MainLayout.jsx — Responsive University Portal Layout Shell
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar  from '../components/TopBar';
import Footer  from '../components/Footer';
import { useState, useEffect } from 'react';
import { LayoutDashboard, FolderOpen, Upload, Search, UserCircle } from 'lucide-react';

const MOBILE_NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vault',     label: 'Vault',     icon: FolderOpen },
  { to: '/upload',    label: 'Upload',    icon: Upload },
  { to: '/search',    label: 'Search',    icon: Search },
  { to: '/profile',   label: 'Profile',   icon: UserCircle },
];

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Scroll to top on navigation & close mobile drawer
  useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div
      className="flex h-screen overflow-hidden font-sans"
      style={{
        background: 'linear-gradient(145deg, #F0F4FF 0%, #E8F0FE 50%, #EEF2FF 100%)',
      }}
    >
      {/* Decorative background orbs — restrained institutional depth */}
      <div className="fixed pointer-events-none z-0 overflow-hidden inset-0">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full deco-orb"
          style={{ background: 'radial-gradient(circle, rgba(11,61,145,0.06) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 right-0 w-80 h-80 rounded-full deco-orb"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)', transform: 'translate(30%, -50%)' }}
        />
      </div>

      {/* Sidebar Drawer / Collapsible Sidebar */}
      <div className="relative z-30 flex-shrink-0">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden relative z-10 w-full min-w-0">
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main
          className="flex-1 overflow-y-auto flex flex-col justify-between w-full pb-16 md:pb-0"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Subtle Grid texture overlay */}
          <div className="absolute inset-0 pointer-events-none deco-grid-bg" style={{ zIndex: 0 }} />

          <div
            className="relative z-10 px-3 sm:px-6 py-4 sm:py-6 max-w-7xl w-full mx-auto flex-1"
            key={location.pathname}
            style={{ animation: 'fadeInUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards' }}
          >
            <Outlet />
          </div>

          {/* Mandated Institutional Footer at bottom of scrollable main area */}
          <Footer className="relative z-10 mt-8" />
        </main>

        {/* ── Mobile Bottom Navigation Bar (High-Priority Actions) ── */}
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1 flex items-center justify-around"
        >
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#0B3D91] font-bold'
                    : 'text-slate-500 hover:text-slate-700 font-medium'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-colors ${
                    isActive ? 'bg-[#0B3D91]/10 text-[#0B3D91]' : ''
                  }`}
                >
                  <Icon size={19} />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
