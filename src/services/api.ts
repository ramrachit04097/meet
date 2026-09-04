import {
  AuthUser,
  LoginFormData,
  ManagerRegisterFormData,
  EmployeeUser,
  TaskItem,
  MeetingItem,
  AlertItem,
  TaskStats,
  WorkloadData,
  MeetingDistributionData,
  SpeakerUtterance,
  AIAnalysisResult,
} from '../types';

const TOKEN_KEY = 'meetflow_auth_token';
const USER_KEY = 'meetflow_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }

  return data as T;
}

export const api = {
  // Auth
  async registerManager(formData: ManagerRegisterFormData): Promise<{ success: boolean; message: string }> {
    return fetchAPI('/api/auth/register-manager', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  async login(credentials: LoginFormData): Promise<{ token: string; user: AuthUser }> {
    const data = await fetchAPI<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setStoredSession(data.token, data.user);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetchAPI('/api/auth/logout', { method: 'POST' });
    } finally {
      clearStoredSession();
    }
  },

  async getMe(): Promise<AuthUser> {
    const data = await fetchAPI<{ user: AuthUser }>('/api/auth/me');
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  },

  // Employees
  async getEmployees(): Promise<EmployeeUser[]> {
    const data = await fetchAPI<{ employees: EmployeeUser[] }>('/api/employees');
    return data.employees;
  },

  async addEmployee(params: {
    employeeName: string;
    employeeId: string;
    employeePost: string;
    password: string;
  }): Promise<EmployeeUser> {
    const data = await fetchAPI<{ employee: EmployeeUser }>('/api/employees', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return data.employee;
  },

  async deleteEmployee(employeeId: string): Promise<void> {
    await fetchAPI(`/api/employees/${employeeId}`, {
      method: 'DELETE',
    });
  },

  // Tasks
  async getTasks(): Promise<TaskItem[]> {
    const data = await fetchAPI<{ tasks: TaskItem[] }>('/api/tasks');
    return data.tasks;
  },

  async addTask(params: {
    employeeId: string;
    subject: string;
    assignedDate: string;
    deadline: string;
  }): Promise<TaskItem> {
    const data = await fetchAPI<{ task: TaskItem }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return data.task;
  },

  async updateTask(
    taskId: string,
    updates: { deadline?: string; status?: string }
  ): Promise<TaskItem> {
    const data = await fetchAPI<{ task: TaskItem }>(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return data.task;
  },

  async deleteTask(taskId: string): Promise<void> {
    await fetchAPI(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  async bulkCreateTasks(
    tasks: Array<{
      employeeId: string;
      subject: string;
      assignedDate?: string;
      deadline: string;
      priority?: string;
    }>
  ): Promise<{ success: boolean; count: number; tasks: TaskItem[] }> {
    return fetchAPI('/api/tasks/bulk-create', {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    });
  },

  // Meetings
  async getMeetings(): Promise<MeetingItem[]> {
    const data = await fetchAPI<{ meetings: MeetingItem[] }>('/api/meetings');
    return data.meetings;
  },

  async addMeeting(params: {
    title: string;
    date: string;
    time: string;
    durationMinutes: number;
  }): Promise<MeetingItem> {
    const data = await fetchAPI<{ meeting: MeetingItem }>('/api/meetings', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return data.meeting;
  },

  // Audio & AI Analysis
  async transcribeMeetingAudio(params: {
    audioBase64?: string;
    liveTranscript?: string;
    meetingTitle?: string;
  }): Promise<{
    success: boolean;
    transcriptText: string;
    speakers: SpeakerUtterance[];
    durationSeconds?: number;
    apiKeyNotice?: string;
    apiKeyMissing?: boolean;
    message?: string;
  }> {
    return fetchAPI('/api/meetings/transcribe', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async analyzeTranscript(params: {
    meetingTitle: string;
    meetingDate?: string;
    transcriptText: string;
    attendees?: string[];
  }): Promise<AIAnalysisResult> {
    return fetchAPI<AIAnalysisResult>('/api/meetings/analyze-transcript', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Alerts
  async getAlerts(): Promise<AlertItem[]> {
    const data = await fetchAPI<{ alerts: AlertItem[] }>('/api/alerts');
    return data.alerts;
  },

  async markAlertRead(alertId: string): Promise<void> {
    await fetchAPI(`/api/alerts/${alertId}/read`, {
      method: 'POST',
    });
  },

  // Dashboard Stats
  async getStats(): Promise<{
    totalEmployees?: number;
    taskStats: TaskStats;
    upcomingMeeting?: MeetingItem | null;
    workload?: WorkloadData[];
    meetingDistribution?: MeetingDistributionData[];
    recentTasks: TaskItem[];
  }> {
    return fetchAPI('/api/stats');
  },
};
