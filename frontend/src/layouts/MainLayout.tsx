import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, CreditCard, Clock, Sparkles } from 'lucide-react';

const MainLayout = () => {
  const { token, logout } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const isActive = (path: string) => location.pathname === path;

  const navLink = (to: string, label: string, icon: React.ReactNode) => (
    <Link
      to={to}
      title={label}
      className={`text-[13px] font-medium px-2 sm:px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 ${
        isActive(to)
          ? 'bg-black text-white shadow-sm'
          : isHome
            ? 'text-neutral-300 hover:text-white hover:bg-white/10'
            : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Navbar — transparent on home, white elsewhere */}
      <nav className={`sticky top-0 z-50 transition-colors ${
        isHome
          ? 'bg-[#111]/80 backdrop-blur-xl border-b border-white/10'
          : 'bg-white/80 backdrop-blur-xl border-b border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-neutral-800 to-black rounded-xl flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className={`text-[16px] font-bold tracking-tight ${isHome ? 'text-white' : 'text-black'}`}>
              ResumeX
            </span>
          </Link>
          
          <div className="flex items-center gap-1">
            {token ? (
              <>
                {navLink('/dashboard', 'Analyze', <LayoutDashboard className="h-3.5 w-3.5" />)}
                {navLink('/history', 'History', <Clock className="h-3.5 w-3.5" />)}
                {navLink('/billing', 'Billing', <CreditCard className="h-3.5 w-3.5" />)}
                <div className={`w-px h-5 mx-2 ${isHome ? 'bg-white/20' : 'bg-neutral-200'}`} />
                <button
                  onClick={logout}
                  title="Logout"
                  className={`text-[13px] font-medium px-2 sm:px-3.5 py-2 rounded-full transition-colors flex items-center gap-1.5 ${
                    isHome ? 'text-neutral-400 hover:text-red-400' : 'text-neutral-400 hover:text-red-500'
                  }`}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`text-[13px] font-medium px-4 py-2 rounded-full transition-colors ${
                  isHome ? 'text-neutral-300 hover:text-white' : 'text-neutral-500 hover:text-black'
                }`}>
                  Log in
                </Link>
                <Link to="/register" className={`text-[13px] font-semibold px-5 py-2 rounded-full transition-all ${
                  isHome
                    ? 'bg-white text-black hover:bg-neutral-200'
                    : 'bg-black text-white hover:bg-neutral-800'
                }`}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="border-t border-neutral-200/60 bg-white/50">
        <div className="max-w-6xl mx-auto flex items-center justify-center h-14 px-6">
          <p className="text-xs text-neutral-400">
            © 2026 ResumeX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
