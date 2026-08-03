import React from 'react';
import { Outlet } from 'react-router-dom';
import GlobalChat from '../components/GlobalChat';
import LanguageSelector from '../components/LanguageSelector';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-pool-dark text-slate-100 font-body">
      {/* Sticky Glassmorphic Header */}
      <header className="sticky top-0 z-50 py-3.5 px-6 bg-pool-dark/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center px-4 md:px-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎱</span>
            <span className="font-display font-extrabold text-lg tracking-wider text-white">
              8-POOL ULTRA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector compact={true} />
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-slate-400 font-semibold tracking-wide uppercase">
                Online
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-grow flex flex-col justify-center max-w-[1440px] mx-auto w-full px-4 md:px-8 py-8">
        <React.Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="text-5xl mb-6 animate-bounce">🎱</div>
            <p className="text-slate-400 font-display text-xs font-bold tracking-widest uppercase animate-pulse">
              Loading screen assets...
            </p>
          </div>
        }>
          <Outlet />
        </React.Suspense>
      </main>

      {/* Floating Global Chat Engine */}
      <GlobalChat />

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-600 border-t border-white/5">
        &copy; 2026 Antigravity 8-Pool. Restructured client workspace.
      </footer>
    </div>
  );
};

export default MainLayout;
