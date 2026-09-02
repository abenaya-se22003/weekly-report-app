import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Shield, Menu } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, role, logout } = useAuth();

  return (
    <header className="h-16 bg-surface-900/80 backdrop-blur-md border-b border-surface-800/80 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-surface-400 hover:text-white rounded-lg hover:bg-surface-800 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <span className="text-white font-bold text-base">W</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
              Weekly Report<span className="text-primary-400">Sync</span>
            </h1>
            <span className="text-[11px] text-surface-400 font-medium">Team Dashboard</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="flex items-center gap-3 bg-surface-800/60 border border-surface-700/60 rounded-full py-1.5 px-3">
              <div className="w-7 h-7 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-white leading-tight">{user.name}</div>
                <div className="text-[10px] text-surface-400 font-mono">{user.email}</div>
              </div>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  role === 'MANAGER'
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    : 'bg-primary-500/10 text-primary-300 border-primary-500/30'
                }`}
              >
                {role === 'MANAGER' ? (
                  <span className="inline-flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" /> Manager
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <UserIcon className="w-2.5 h-2.5" /> Member
                  </span>
                )}
              </span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-surface-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};
