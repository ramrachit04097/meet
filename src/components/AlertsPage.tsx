import React, { useState } from 'react';
import { AlertItem, AuthUser } from '../types';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Filter,
  Check,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { api } from '../services/api';

interface AlertsPageProps {
  user: AuthUser;
  alerts: AlertItem[];
  onRefreshAlerts: () => void;
  onShowToast: (title: string, description?: string, type?: 'info' | 'warning' | 'success') => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  user,
  alerts,
  onRefreshAlerts,
  onShowToast,
}) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'MEETINGS' | 'TASKS' | 'OVERDUE'>('ALL');

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await api.markAlertRead(alertId);
      onShowToast('Alert Dismissed', 'Notification marked as read.', 'info');
      onRefreshAlerts();
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'MEETINGS') return alert.type === 'meeting';
    if (activeCategory === 'TASKS') return alert.type === 'task_deadline' || alert.type === 'task_completed';
    if (activeCategory === 'OVERDUE') return alert.type === 'task_overdue';
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'urgent':
        return {
          badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
          glow: 'border-l-rose-500',
        };
      case 'warning':
        return {
          badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
          glow: 'border-l-amber-500',
        };
      default:
        return {
          badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
          icon: <Info className="w-4 h-4 text-violet-400" />,
          glow: 'border-l-violet-500',
        };
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Alerts' },
    { id: 'MEETINGS', label: 'Meetings' },
    { id: 'TASKS', label: 'Task Deadlines' },
    { id: 'OVERDUE', label: 'Overdue' },
  ];

  return (
    <div id="alerts-page-root" className="space-y-6 max-w-7xl mx-auto text-white">
      {/* Page Header */}
      <div id="alerts-page-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Alerts & Notifications</h1>
          <p className="text-xs sm:text-sm text-violet-300/70 mt-1">
            Stay updated on upcoming meetings and impending task deadlines for {user.companyName}.
          </p>
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                  : 'bg-[#181135] text-violet-300/70 hover:bg-[#221748] hover:text-white border border-violet-800/40'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length > 0 ? (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const config = getSeverityBadge(alert.severity);

            return (
              <div
                key={alert.id}
                className={`bg-[#150f2f] border border-violet-800/40 border-l-4 ${config.glow} rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition hover:border-violet-600/50 ${
                  alert.read ? 'opacity-60' : 'opacity-100'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5">{config.icon}</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-sm text-white">{alert.title}</span>
                      <span className={`px-2 py-0.2 text-[10px] font-extrabold uppercase rounded-full border ${config.badge}`}>
                        {alert.severity}
                      </span>
                      {alert.read && (
                        <span className="text-[10px] text-violet-400 bg-violet-900/30 px-2 py-0.5 rounded">
                          Read
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-violet-200/80 leading-relaxed">{alert.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 self-end sm:self-auto shrink-0">
                  {!alert.read ? (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#201543] hover:bg-[#281c54] text-violet-200 text-xs font-semibold flex items-center gap-1.5 border border-violet-800/40 transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-violet-400" />
                      <span>Mark as read</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-violet-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Acknowledged</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#150f2f] rounded-2xl border border-violet-800/40 p-16 text-center shadow-xl">
          <div className="w-12 h-12 bg-violet-800/20 rounded-2xl border border-violet-700/30 flex items-center justify-center text-violet-400 mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" strokeWidth={1.8} />
          </div>
          <p className="text-base font-bold text-white">All caught up!</p>
          <p className="text-xs text-violet-300/70 mt-1 max-w-sm mx-auto leading-relaxed">
            There are currently no urgent alerts, impending deadlines, or upcoming meeting warnings.
          </p>
        </div>
      )}
    </div>
  );
};
