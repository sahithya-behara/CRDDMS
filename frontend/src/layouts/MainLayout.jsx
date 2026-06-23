// layouts/MainLayout.jsx — Premium animated layout shell
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar  from '../components/TopBar';
import { useState, useEffect } from 'react';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pageKey, setPageKey] = useState(0);
  const location = useLocation();

  // Trigger re-animation on route change
  useEffect(() => {
    setPageKey(k => k + 1);
    // Scroll to top on navigation
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden" style={{
      background: 'linear-gradient(145deg, #F0F4FF 0%, #E8F0FE 50%, #EEF2FF 100%)'
    }}>
      {/* Decorative background orbs — very subtle */}
      <div className="fixed pointer-events-none z-0 overflow-hidden inset-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full deco-orb"
          style={{ background: 'radial-gradient(circle, rgba(11,61,145,0.06) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full deco-orb"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)', transform: 'translate(30%, -50%)' }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full deco-orb"
          style={{ background: 'radial-gradient(circle, rgba(11,61,145,0.04) 0%, transparent 70%)', transform: 'translateY(40%)' }} />
      </div>

      {/* Sidebar */}
      <div className="relative z-10 flex-shrink-0">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
          {/* Grid texture overlay */}
          <div className="absolute inset-0 pointer-events-none deco-grid-bg" style={{ zIndex: 0 }} />

          <div className="relative z-10 px-6 py-6 max-w-screen-xl mx-auto"
            key={pageKey}
            style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
