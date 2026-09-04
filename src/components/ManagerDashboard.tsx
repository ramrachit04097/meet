import React from 'react';
import {
  AuthUser,
  TaskStats,
  MeetingItem,
  WorkloadData,
  MeetingDistributionData,
  TaskItem,
  AppPage,
} from '../types';
import {
  User,
  Mail,
  Shield,
  Hash,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock3,
  ListTodo,
  ArrowRight,
  Plus,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface ManagerDashboardProps {
  user: AuthUser;
  stats: {
    totalEmployees?: number;
    taskStats: TaskStats;
    upcomingMeeting?: MeetingItem | null;
    workload?: WorkloadData[];
    meetingDistribution?: MeetingDistributionData[];
    recentTasks: TaskItem[];
  };
  onNavigate: (page: AppPage) => void;
}

const PIE_COLORS = ['#8b5cf6', '#6366f1', '#a855f7', '#ec4899', '#38bdf8', '#10b981'];

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  user,
  stats,
  onNavigate,
}) => {
  const {
    totalEmployees = 0,
    taskStats = { total: 0, pending: 0, completed: 0, overdue: 0 },
    upcomingMeeting,
    workload = [],
    meetingDistribution = [],
    recentTasks = [],
  } = stats;

  return (
    <div id="manager-dashboard-root" className="space-y-6 max-w-7xl mx-auto text-white">
      {/* Page Title & Subtitle */}
      <div id="dashboard-header-block" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Workspace Overview</span>
          </h1>
          <p className="text-xs sm:text-sm text-violet-300/70 mt-1">
            Real-time meeting intelligence and task execution metrics for {user.companyName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="dash-quick-add-task-btn"
            onClick={() => onNavigate('tasks')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-950/40 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
          <button
            type="button"
            id="dash-quick-schedule-mtg-btn"
            onClick={() => onNavigate('meetings')}
            className="px-3.5 py-2 rounded-xl bg-[#201543] hover:bg-[#281c54] text-violet-200 border border-violet-800/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-violet-400" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* Row 1: Manager Details, Upcoming Meeting, and Total Employees */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Card 1: Manager Details */}
        <div
          id="manager-details-card"
          className="md:col-span-12 lg:col-span-5 bg-[#171033] border border-violet-800/40 rounded-2xl p-5 shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">Manager Profile</h2>
            </div>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-full">
              {user.role}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-violet-900/30">
              <span className="text-violet-300/70 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-violet-400" />
                Manager Name
              </span>
              <span className="font-bold text-white text-sm">{user.name}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-violet-900/30">
              <span className="text-violet-300/70 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-violet-400" />
                Manager ID
              </span>
              <span className="font-mono text-violet-200 font-semibold">{user.userId}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-violet-900/30">
              <span className="text-violet-300/70 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-violet-400" />
                Company Email
              </span>
              <span className="font-mono text-violet-300 truncate max-w-[200px]">{user.companyEmail}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-violet-300/70 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-violet-400" />
                Access Level
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                Full Administrative Access
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Upcoming Meeting */}
        <div
          id="upcoming-meeting-card"
          className="md:col-span-7 lg:col-span-4 bg-[#171033] border border-violet-800/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-white tracking-wide uppercase">Upcoming Meeting</h2>
              </div>
              {upcomingMeeting && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                  Next Up
                </span>
              )}
            </div>

            {upcomingMeeting ? (
              <div className="space-y-3 bg-[#1d143f] p-4 rounded-xl border border-violet-800/30">
                <h3 className="font-bold text-base text-white truncate">{upcomingMeeting.title}</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-violet-200">
                    <Calendar className="w-3.5 h-3.5 text-violet-400" />
                    <span>{upcomingMeeting.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-violet-200">
                    <Clock className="w-3.5 h-3.5 text-violet-400" />
                    <span>{upcomingMeeting.time}</span>
                  </div>
                </div>
                <div className="text-[11px] text-violet-300/80 pt-1 border-t border-violet-800/30 flex items-center justify-between">
                  <span>Duration:</span>
                  <span className="font-bold text-white">{upcomingMeeting.durationMinutes} mins</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-violet-400/70 space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-violet-500/50 mb-1" />
                <p className="text-xs font-semibold text-violet-300">No upcoming meetings</p>
                <p className="text-[11px] text-violet-400/60 max-w-xs mx-auto">
                  Schedule a meeting to track agenda, notes, and delegated tasks.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            id="dash-view-meetings-btn"
            onClick={() => onNavigate('meetings')}
            className="mt-4 w-full py-2 rounded-xl bg-[#201543] hover:bg-[#281c54] text-violet-200 text-xs font-semibold transition border border-violet-800/30 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{upcomingMeeting ? 'View All Meetings' : 'Schedule Meeting'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Total Employees */}
        <div
          id="total-employees-card"
          className="md:col-span-5 lg:col-span-3 bg-[#171033] border border-violet-800/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">Team Size</h2>
            </div>

            <div className="py-2">
              <div className="text-4xl font-black text-white tracking-tight">
                {totalEmployees}
              </div>
              <p className="text-xs text-violet-300/70 mt-1">
                {totalEmployees === 1 ? 'Registered employee' : 'Registered employees'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="dash-manage-employees-btn"
            onClick={() => onNavigate('employees')}
            className="mt-4 w-full py-2 rounded-xl bg-[#201543] hover:bg-[#281c54] text-violet-200 text-xs font-semibold transition border border-violet-800/30 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-violet-400" />
            <span>Manage Employees</span>
          </button>
        </div>
      </div>

      {/* Row 2: Task Statistics (4 Metric Cards) */}
      <div id="task-statistics-metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks (Violet) */}
        <div className="bg-[#171033] border border-violet-600/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-violet-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tasks</span>
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{taskStats.total}</div>
          <p className="text-[11px] text-violet-300/60 mt-1">Across all team projects</p>
        </div>

        {/* Pending Tasks (Amber) */}
        <div className="bg-[#171033] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400">{taskStats.pending}</div>
          <p className="text-[11px] text-amber-300/60 mt-1">Awaiting execution</p>
        </div>

        {/* Completed Tasks (Emerald) */}
        <div className="bg-[#171033] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">{taskStats.completed}</div>
          <p className="text-[11px] text-emerald-300/60 mt-1">Successfully delivered</p>
        </div>

        {/* Overdue Tasks (Rose) */}
        <div className="bg-[#171033] border border-rose-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Overdue</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400">{taskStats.overdue}</div>
          <p className="text-[11px] text-rose-300/60 mt-1">Passed scheduled deadline</p>
        </div>
      </div>

      {/* Row 3: Analytics Charts (Meeting Distribution + Employee Workload) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart 1: Meeting Time Distribution */}
        <div
          id="meeting-distribution-chart-card"
          className="lg:col-span-6 bg-[#171033] border border-violet-800/40 rounded-2xl p-5 shadow-lg flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Meeting Time Distribution</h3>
                <p className="text-[11px] text-violet-300/70">Duration allocated per scheduled session</p>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[240px] flex items-center justify-center">
            {meetingDistribution.length > 0 ? (
              <div className="w-full h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={meetingDistribution}
                      dataKey="durationMinutes"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {meetingDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#1b123d',
                        borderColor: '#4c1d95',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#fff',
                      }}
                      formatter={(value: any, name: any) => [`${value} minutes`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-violet-400/60">
                <PieChartIcon className="w-9 h-9 mx-auto text-violet-500/30 mb-2" />
                <p className="text-xs font-semibold text-violet-300">No meeting data available</p>
                <p className="text-[11px] text-violet-400/60 mt-1 max-w-xs mx-auto">
                  Schedule meetings to view session distribution and time investments.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Employee Workload (Bar Chart) */}
        <div
          id="employee-workload-chart-card"
          className="lg:col-span-6 bg-[#171033] border border-violet-800/40 rounded-2xl p-5 shadow-lg flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Employee Workload</h3>
                <p className="text-[11px] text-violet-300/70">Assigned task distribution across team members</p>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[240px] flex items-center justify-center">
            {workload.length > 0 && workload.some((w) => w.taskCount > 0) ? (
              <div className="w-full h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workload} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a1d56" vertical={false} />
                    <XAxis
                      dataKey="employeeName"
                      stroke="#8b5cf6"
                      fontSize={11}
                      tickLine={false}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis stroke="#8b5cf6" fontSize={11} allowDecimals={false} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#1b123d',
                        borderColor: '#4c1d95',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#fff',
                      }}
                      formatter={(val: any) => [`${val} tasks`, 'Assigned Tasks']}
                    />
                    <Bar dataKey="taskCount" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-violet-400/60">
                <BarChart3 className="w-9 h-9 mx-auto text-violet-500/30 mb-2" />
                <p className="text-xs font-semibold text-violet-300">No workload data available</p>
                <p className="text-[11px] text-violet-400/60 mt-1 max-w-xs mx-auto">
                  Add employees and assign tasks to view workload distribution.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Tasks Table (Latest 3) */}
      <div
        id="recent-tasks-card"
        className="bg-[#171033] border border-violet-800/40 rounded-2xl p-5 sm:p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Tasks</h3>
            <p className="text-xs text-violet-300/70">Latest task assignments and active status</p>
          </div>
          <button
            type="button"
            id="dash-view-all-tasks-btn"
            onClick={() => onNavigate('tasks')}
            className="text-xs font-bold text-violet-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            <span>View all tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-violet-900/40 text-violet-300/70 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Employee Name</th>
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
                      <td className="py-3 px-3 font-semibold text-white">{task.employeeName}</td>
                      <td className="py-3 px-3 font-medium max-w-[280px] truncate">{task.subject}</td>
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
            <p className="text-xs font-semibold text-violet-300">No recent tasks</p>
            <p className="text-[11px] text-violet-400/60 mt-0.5">
              Tasks created for employees will appear here in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
