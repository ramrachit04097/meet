import React from 'react';
import { Menu, LogOut, Building2, UserCircle2, Sparkles } from 'lucide-react';
import { AuthUser } from '../types';
import { Logo } from './Logo';

interface HeaderProps {
  user: AuthUser;
  onToggleSidebar: () => void;
  onLogoutClick: () => void;
  onOpenCtaFooter?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onToggleSidebar,
  onLogoutClick,
  onOpenCtaFooter,
}) => {
  return (
    <header
      id="meetflow-app-header"
      className="h-16 bg-[#130d29]/95 backdrop-blur-md border-b border-violet-900/30 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 select-none text-white"
    >
      <div className="flex items-center gap-4">
        {/* Toggle Sidebar Button */}
        <button
          id="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className="text-violet-300 hover:text-white p-2 rounded-xl hover:bg-violet-800/30 transition focus:outline-none focus:ring-2 focus:ring-violet-500/30 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* MeetFlow Logo on mobile / compact view */}
        <div className="lg:hidden">
          <Logo size="sm" showText={false} variant="violet" />
        </div>

        <div className="hidden sm:block h-5 w-px bg-violet-800/40" />

        {/* Company Name (Registered Company from Database) */}
        <div id="company-name-area" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-800/40 border border-violet-700/40 flex items-center justify-center text-violet-300">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm sm:text-base tracking-tight truncate max-w-[160px] sm:max-w-[280px]">
                {user.companyName}
              </span>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-violet-500/10 text-violet-300 rounded-md border border-violet-500/20">
                Workspace
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* User Identity Details */}
        <div id="user-role-badge" className="text-right hidden sm:block">
          <p className="text-xs font-bold text-white leading-tight">
            {user.name}
          </p>
          <div className="flex items-center justify-end gap-1.5 mt-0.5">
            <span
              className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                user.role === 'Manager'
                  ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                  : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
              }`}
            >
              {user.role}
            </span>
            {user.post && (
              <span className="text-[10px] text-violet-400/80 truncate max-w-[100px]">
                • {user.post}
              </span>
            )}
          </div>
        </div>

        {/* User Avatar Circle */}
        <div
          id="user-avatar-circle"
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 border border-violet-400/30 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-violet-950/50"
          title={`${user.name} (${user.role})`}
        >
          {user.name ? user.name.charAt(0).toUpperCase() : <UserCircle2 className="w-5 h-5" />}
        </div>

        <div className="h-5 w-px bg-violet-800/40 hidden sm:block" />

        {onOpenCtaFooter && (
          <button
            id="header-cta-preview-btn"
            onClick={onOpenCtaFooter}
            className="text-xs text-sky-300 hover:text-white px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 transition flex items-center gap-1.5 border border-sky-500/30 cursor-pointer"
            title="Preview Cinematic CTA & Footer Section"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline font-semibold">CTA & Footer</span>
          </button>
        )}

        {/* Logout Button */}
        <button
          id="header-logout-btn"
          onClick={onLogoutClick}
          className="text-xs text-violet-300 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-rose-500/15 hover:text-rose-300 transition flex items-center gap-1.5 border border-transparent hover:border-rose-500/30 cursor-pointer"
          title="Sign out of MeetFlow"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span className="hidden md:inline font-semibold">Logout</span>
        </button>
      </div>
    </header>
  );
};
