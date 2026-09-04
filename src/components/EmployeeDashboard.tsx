import React from 'react';
import { AuthUser, TaskStats, TaskItem, AppPage } from '../types';
import {
  User,
  Hash,
  Briefcase,
  Building2,
  Activity,
  ListTodo,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface EmployeeDashboardProps {
  user: AuthUser;
  stats: {
    taskStats: TaskStats;
    recentTasks: TaskItem[];
  };
  onNavigate: (page: AppPage) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  user,
  stats,
  onNavigate,
}) => {
  const {
    taskStats = { total: 0, pending: 0, completed: 0, overdue: 0 },
    recentTasks = [],
  } = stats;

  return (
    <div id="employee-dashboard-root" className="space-y-6 max-w-7xl mx-auto text-white">
      {/* Page Title & Subtitle */}
      <div id="employee-header-block" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>My Workspace</span>
          </h1>
          <p className="text-xs sm:text-sm text-violet-300/70 mt-1">
            Welcome back, {user.name}. Here is an overview of your assigned deliverables.
          </p>
        </div>

        <button
          type="button"
          id="emp-dash-view-tasks-btn"
          onClick={() => onNavigate('tasks')}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-950/40 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>My Assigned Tasks</span>
        </button>
      </div>

      {/* Row 1: Personal Info Card */}
      <div
        id="employee-info-card"
        className="bg-[#171033] border border-violet-800/40 rounded-2xl p-5 sm:p-6 shadow-lg relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Employee Profile</h2>
              <p className="text-xs text-violet-300/70">Personal credentials & team assignment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ACTIVE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-violet-900/30">
          <div className="bg-[#1d143f] p-3.5 rounded-xl border border-violet-800/30">
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" /> Full Name
            </span>
            <p className="text-sm font-bold text-white mt-1">{user.name}</p>
          </div>

          <div className="bg-[#1d143f] p-3.5 rounded-xl border border-violet-800/30">
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1">
              <Hash className="w-3 h-3" /> Employee ID
            </span>
            <p className="text-sm font-mono font-bold text-violet-200 mt-1">{user.userId}</p>
          </div>

          <div className="bg-[#1d143f] p-3.5 rounded-xl border border-violet-800/30">
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> Designation / Post
            </span>
            <p className="text-sm font-bold text-white mt-1">{user.post || 'Team Member'}</p>
          </div>

          <div className="bg-[#1d143f] p-3.5 rounded-xl border border-violet-800/30">
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Organization
            </span>
            <p className="text-sm font-bold text-white mt-1 truncate">{user.companyName}</p>
          </div>
        </div>
      </div>

      {/* Row 2: Personal Task Statistics */}
      <div id="employee-task-metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks (Violet) */}
        <div className="bg-[#171033] border border-violet-600/30 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-violet-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tasks</span>
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{taskStats.total}</div>
          <p className="text-[11px] text-violet-300/60 mt-1">Assigned to you</p>
        </div>

        {/* Pending Tasks (Amber) */}
        <div className="bg-[#171033] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400">{taskStats.pending}</div>
          <p className="text-[11px] text-amber-300/60 mt-1">Waiting on your action</p>
        </div>

        {/* Completed Tasks (Emerald) */}
        <div className="bg-[#171033] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-emerald-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">{taskStats.completed}</div>
          <p className="text-[11px] text-emerald-300/60 mt-1">Successfully finished</p>
        </div>

        {/* Overdue Tasks (Rose) */}
        <div className="bg-[#171033] border border-rose-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-rose-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Overdue</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400">{taskStats.overdue}</div>
          <p className="text-[11px] text-rose-300/60 mt-1">Deadline passed</p>
        </div>
      </div>

      {/* Row 3: Recent Tasks Assigned to Employee */}
      <div
        id="employee-recent-tasks-card"
        className="bg-[#171033] border border-violet-800/40 rounded-2xl p-5 sm:p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Your Recent Tasks</h3>
            <p className="text-xs text-violet-300/70">Latest assignments from your manager</p>
          </div>
          <button
            type="button"
            id="emp-view-all-tasks-link"
            onClick={() => onNavigate('tasks')}
            className="text-xs font-bold text-violet-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            <span>Update status in Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-violet-900/40 text-violet-300/70 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Task Subject</th>
                  <th className="py-3 px-3">Assigned Date</th>
                  <th className="py-3 px-3">Deadline</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-900/20 text-violet-200">
                {recentTasks.map((task) => {
                  const statusStyles: Record<string, string> = {
                    Pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                    'In Progress': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
                    Completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                    Overdue: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                  };
                  return (
                    <tr key={task.id} className="hover:bg-violet-800/10 transition">
                      <td className="py-3 px-3 font-semibold text-white max-w-[320px]">{task.subject}</td>
                      <td className="py-3 px-3 text-violet-300/80">{task.assignedDate}</td>
                      <td className="py-3 px-3 text-violet-300/80">{task.deadline}</td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            statusStyles[task.status] || 'bg-violet-500/20 text-violet-300'
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-violet-400/60">
            <ListTodo className="w-8 h-8 mx-auto text-violet-500/40 mb-2" />
            <p className="text-xs font-semibold text-violet-300">No tasks assigned yet</p>
            <p className="text-[11px] text-violet-400/60 mt-0.5">
              Tasks assigned to you by your manager will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
