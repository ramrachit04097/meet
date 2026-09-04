import React from 'react';
import { AppPage, UserRole } from '../types';
import { Logo } from './Logo';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Users,
  Bell,
  LogOut,
  X,
  FileText,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  activePage: AppPage;
  userRole: UserRole;
  unreadAlertsCount?: number;
  onNavigate: (page: AppPage) => void;
  onLogoutClick: () => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activePage,
  userRole,
  unreadAlertsCount = 0,
  onNavigate,
  onLogoutClick,
  onCloseMobile,
}) => {
  // Define items based on role
  const managerItems: { id: AppPage; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'transcripts', label: 'Transcripts', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'alerts', label: 'Alerts', icon: Bell },
  ];

  const employeeItems: { id: AppPage; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'alerts', label: 'Alerts', icon: Bell },
  ];

  const navItems = userRole === 'Manager' ? managerItems : employeeItems;

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="meetflow-sidebar"
        className={`
          fixed top-0 bottom-0 left-0 z-40 bg-[#110b24] text-violet-200
          flex flex-col justify-between transition-all duration-300 ease-in-out border-r border-violet-900/30 shadow-xl
          ${isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}
          lg:static lg:h-screen lg:shrink-0
        `}
      >
        {/* Top Logo branding */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-violet-900/30">
          <div className="flex items-center gap-3 overflow-hidden">
            <Logo size="sm" showText={isOpen} variant="violet" />
          </div>
          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-violet-400 hover:text-white hover:bg-violet-800/40 lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const isAlertItem = item.id === 'alerts';

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all select-none group relative cursor-pointer
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-md shadow-violet-950/50'
                      : 'text-violet-300/80 hover:bg-violet-800/30 hover:text-white'
                  }
                `}
                title={!isOpen ? item.label : undefined}
              >
                <div
                  className={`flex items-center justify-center shrink-0 ${
                    isActive ? 'text-white' : 'text-violet-400 group-hover:text-violet-200'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={isActive ? 2.3 : 1.9} />
                </div>

                {/* Label: shows when open or on mobile */}
                <div
                  className={`flex-1 flex items-center justify-between text-left overflow-hidden whitespace-nowrap transition-opacity ${
                    isOpen ? 'opacity-100' : 'lg:hidden'
                  }`}
                >
                  <span>{item.label}</span>

                  {/* Dynamic Alert Count Badge */}
                  {isAlertItem && unreadAlertsCount > 0 && (
                    <span
                      id="sidebar-alert-badge"
                      className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-500 text-white rounded-full shadow-xs animate-pulse"
                    >
                      {unreadAlertsCount}
                    </span>
                  )}
                </div>

                {/* Floating dot for closed sidebar when unread alerts exist */}
                {!isOpen && isAlertItem && unreadAlertsCount > 0 && (
                  <span className="hidden lg:block absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#110b24]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section - User role info & Logout */}
        <div className="p-3.5 mt-auto border-t border-violet-900/30 space-y-2">
          <button
            id="sidebar-logout-btn"
            onClick={onLogoutClick}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors group cursor-pointer"
            title="Sign out of MeetFlow"
          >
            <div className="flex items-center justify-center shrink-0 text-rose-400 group-hover:text-rose-300">
              <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={1.9} />
            </div>
            <span
              className={`whitespace-nowrap transition-opacity ${
                isOpen ? 'opacity-100' : 'lg:hidden'
              }`}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
