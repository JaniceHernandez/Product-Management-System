// src/components/layout/AppLayout.jsx
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    // Background: very soft pink-white, not gray
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#fdf6f9' }}>

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/25 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 lg:static lg:z-auto
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Mobile top bar ── */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-pink-100 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-pink-500 hover:bg-pink-50 transition-colors"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #ec4899, #d946ef)', boxShadow: '0 2px 8px rgba(236,72,153,0.35)' }}
            >
              <span className="text-white text-xs font-bold">H</span>
            </div>
            <span className="text-sm font-bold text-gray-800 tracking-tight">HopePMS</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            <span className="text-xs text-pink-300 font-medium">live</span>
          </div>
        </header>

        {/* ── Scrollable content ── */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}