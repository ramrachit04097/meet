import React from 'react';
import { AuthUser, TaskStats, MeetingItem, WorkloadData, MeetingDistributionData, TaskItem, AppPage } from '../types';
import { ManagerDashboard } from './ManagerDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';

interface DashboardProps {
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

export const Dashboard: React.FC<DashboardProps> = ({ user, stats, onNavigate }) => {
  if (user.role === 'Manager') {
    return <ManagerDashboard user={user} stats={stats} onNavigate={onNavigate} />;
  }

  return <EmployeeDashboard user={user} stats={stats} onNavigate={onNavigate} />;
};
