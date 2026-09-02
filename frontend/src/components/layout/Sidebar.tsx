import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  Users,
  FileCheck2,
  History,
  type LucideIcon,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  highlight?: boolean;
  secondary?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role } = useAuth();

  const isManager = role === 'MANAGER';

  const memberLinks: NavItem[] = [
    {
      to: '/reports/new',
      label: 'New Weekly Report',
      icon: PlusCircle,
      highlight: true,
    },
    {
      to: '/reports/mine',
      label: 'My Reports History',
      icon: History,
    },
    {
      to: '/projects',
      label: 'Active Projects',
      icon: FolderKanban,
    },
  ];

  const managerLinks: NavItem[] = [
    {
      to: '/dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/reports',
      label: 'Team Reports & Review',
      icon: FileCheck2,
    },
    {
      to: '/team',
      label: 'Team Members',
      icon: Users,
    },
    {
      to: '/projects',
      label: 'Projects Management',
      icon: FolderKanban,
    },
    {
      to: '/reports/new',
      label: 'Create Test Report',
      icon: PlusCircle,
      secondary: true,
    },
  ];

  const links = isManager ? managerLinks : memberLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-surface-950/70 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-surface-900/90 backdrop-blur-md border-r border-surface-800/80 p-4 flex flex-col justify-between z-40 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold text-surface-400 uppercase tracking-wider">
              {isManager ? 'Management Workspace' : 'My Workspace'}
            </div>
            <nav className="space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30 font-semibold shadow-sm'
                          : link.highlight
                          ? 'bg-primary-600/10 text-primary-300 hover:bg-primary-600/20 border border-primary-500/20'
                          : link.secondary
                          ? 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                          : 'text-surface-300 hover:text-white hover:bg-surface-800/80'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Workspace Status Tag */}
        <div className="p-3 bg-surface-800/40 rounded-xl border border-surface-700/40">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-surface-200">System Connected</span>
          </div>
          <p className="text-[11px] text-surface-400">PostgreSQL · weekly_reports_db</p>
        </div>
      </aside>
    </>
  );
};
