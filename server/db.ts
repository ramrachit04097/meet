import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface DBCompany {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface DBManager {
  id: string;
  managerId: string;
  managerName: string;
  companyId: string;
  companyEmail: string;
  passwordHash: string;
  role: 'Manager';
  createdAt: string;
}

export interface DBEmployee {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePost: string;
  companyId: string;
  passwordHash: string;
  role: 'Employee';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  lastLogin?: string;
}

export interface DBTask {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  employeePost: string;
  subject: string;
  assignedDate: string; // YYYY-MM-DD
  deadline: string;     // YYYY-MM-DD
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  createdAt: string;
  updatedAt: string;
}

export interface DBMeeting {
  id: string;
  companyId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  createdAt: string;
}

export interface DBAlert {
  id: string;
  companyId: string;
  recipientRole: 'Manager' | 'Employee';
  recipientId?: string; // employeeId if employee-specific
  type: 'meeting' | 'task_deadline' | 'task_overdue' | 'task_completed';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'urgent';
  createdAt: string;
  read: boolean;
  relatedTaskId?: string;
  relatedMeetingId?: string;
}

export interface DBSession {
  token: string;
  userId: string;
  role: 'Manager' | 'Employee';
  companyId: string;
  employeeId?: string;
  createdAt: string;
  expiresAt: string;
}

export interface DatabaseSchema {
  companies: DBCompany[];
  managers: DBManager[];
  employees: DBEmployee[];
  tasks: DBTask[];
  meetings: DBMeeting[];
  alerts: DBAlert[];
  sessions: DBSession[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'meetflow-db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const initialData: DatabaseSchema = {
  companies: [],
  managers: [],
  employees: [],
  tasks: [],
  meetings: [],
  alerts: [],
  sessions: [],
};

function loadDB(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read db file, initializing fresh:', err);
  }
  saveDB(initialData);
  return initialData;
}

function saveDB(data: DatabaseSchema): void {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to save db file:', err);
  }
}

// Password hashing utilities using Node.js crypto
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, originalHash] = parts;
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

export class DataStore {
  private db: DatabaseSchema;

  constructor() {
    this.db = loadDB();
  }

  private persist(): void {
    saveDB(this.db);
  }

  // Companies
  findCompanyByEmail(email: string): DBCompany | undefined {
    return this.db.companies.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
  }

  findCompanyById(id: string): DBCompany | undefined {
    return this.db.companies.find((c) => c.id === id);
  }

  createCompany(name: string, email: string): DBCompany {
    const company: DBCompany = {
      id: `comp_${crypto.randomBytes(8).toString('hex')}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    };
    this.db.companies.push(company);
    this.persist();
    return company;
  }

  // Managers
  findManagerByManagerId(companyId: string, managerId: string): DBManager | undefined {
    return this.db.managers.find(
      (m) => m.companyId === companyId && m.managerId.toLowerCase() === managerId.trim().toLowerCase()
    );
  }

  findManagerById(id: string): DBManager | undefined {
    return this.db.managers.find((m) => m.id === id);
  }

  createManager(params: {
    managerId: string;
    managerName: string;
    companyId: string;
    companyEmail: string;
    passwordHash: string;
  }): DBManager {
    const manager: DBManager = {
      id: `mgr_${crypto.randomBytes(8).toString('hex')}`,
      managerId: params.managerId.trim(),
      managerName: params.managerName.trim(),
      companyId: params.companyId,
      companyEmail: params.companyEmail.trim().toLowerCase(),
      passwordHash: params.passwordHash,
      role: 'Manager',
      createdAt: new Date().toISOString(),
    };
    this.db.managers.push(manager);
    this.persist();
    return manager;
  }

  // Employees
  getEmployees(companyId: string): DBEmployee[] {
    return this.db.employees.filter((e) => e.companyId === companyId);
  }

  findEmployeeById(companyId: string, employeeId: string): DBEmployee | undefined {
    return this.db.employees.find(
      (e) => e.companyId === companyId && e.employeeId.toLowerCase() === employeeId.trim().toLowerCase()
    );
  }

  findEmployeeByDbId(id: string): DBEmployee | undefined {
    return this.db.employees.find((e) => e.id === id);
  }

  createEmployee(params: {
    employeeId: string;
    employeeName: string;
    employeePost: string;
    companyId: string;
    passwordHash: string;
  }): DBEmployee {
    const employee: DBEmployee = {
      id: `emp_${crypto.randomBytes(8).toString('hex')}`,
      employeeId: params.employeeId.trim(),
      employeeName: params.employeeName.trim(),
      employeePost: params.employeePost.trim() || 'Team Member',
      companyId: params.companyId,
      passwordHash: params.passwordHash,
      role: 'Employee',
      status: 'INACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.db.employees.push(employee);
    this.persist();
    return employee;
  }

  updateEmployeeStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): void {
    const emp = this.db.employees.find((e) => e.id === id);
    if (emp) {
      emp.status = status;
      if (status === 'ACTIVE') {
        emp.lastLogin = new Date().toISOString();
      }
      this.persist();
    }
  }

  deleteEmployee(companyId: string, employeeId: string): boolean {
    const idx = this.db.employees.findIndex(
      (e) => e.companyId === companyId && e.employeeId.toLowerCase() === employeeId.toLowerCase()
    );
    if (idx !== -1) {
      this.db.employees.splice(idx, 1);
      this.persist();
      return true;
    }
    return false;
  }

  // Tasks
  getTasks(companyId: string, employeeId?: string): DBTask[] {
    const today = new Date().toISOString().split('T')[0];
    let tasks = this.db.tasks.filter((t) => t.companyId === companyId);
    if (employeeId) {
      tasks = tasks.filter((t) => t.employeeId.toLowerCase() === employeeId.toLowerCase());
    }

    // Dynamic overdue check
    tasks = tasks.map((t) => {
      if (t.status !== 'Completed' && t.deadline < today) {
        return { ...t, status: 'Overdue' };
      }
      return t;
    });

    return tasks;
  }

  findTaskById(taskId: string): DBTask | undefined {
    return this.db.tasks.find((t) => t.id === taskId);
  }

  createTask(params: {
    companyId: string;
    employeeId: string;
    employeeName: string;
    employeePost: string;
    subject: string;
    assignedDate: string;
    deadline: string;
  }): DBTask {
    const now = new Date().toISOString();
    const task: DBTask = {
      id: `task_${crypto.randomBytes(8).toString('hex')}`,
      companyId: params.companyId,
      employeeId: params.employeeId,
      employeeName: params.employeeName,
      employeePost: params.employeePost,
      subject: params.subject.trim(),
      assignedDate: params.assignedDate,
      deadline: params.deadline,
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };
    this.db.tasks.unshift(task);
    this.persist();
    return task;
  }

  updateTask(taskId: string, companyId: string, updates: Partial<Pick<DBTask, 'deadline' | 'status'>>): DBTask | null {
    const task = this.db.tasks.find((t) => t.id === taskId && t.companyId === companyId);
    if (!task) return null;

    if (updates.deadline) {
      task.deadline = updates.deadline;
    }
    if (updates.status) {
      task.status = updates.status;
    }
    task.updatedAt = new Date().toISOString();
    this.persist();
    return task;
  }

  deleteTask(taskId: string, companyId: string): boolean {
    const idx = this.db.tasks.findIndex((t) => t.id === taskId && t.companyId === companyId);
    if (idx !== -1) {
      this.db.tasks.splice(idx, 1);
      this.persist();
      return true;
    }
    return false;
  }

  // Meetings
  getMeetings(companyId: string): DBMeeting[] {
    return this.db.meetings.filter((m) => m.companyId === companyId);
  }

  createMeeting(params: {
    companyId: string;
    title: string;
    date: string;
    time: string;
    durationMinutes: number;
  }): DBMeeting {
    const meeting: DBMeeting = {
      id: `mtg_${crypto.randomBytes(8).toString('hex')}`,
      companyId: params.companyId,
      title: params.title.trim(),
      date: params.date,
      time: params.time,
      durationMinutes: Number(params.durationMinutes) || 30,
      createdAt: new Date().toISOString(),
    };
    this.db.meetings.unshift(meeting);
    this.persist();
    return meeting;
  }

  // Dynamic Alerts Computation
  computeAlerts(companyId: string, role: 'Manager' | 'Employee', employeeId?: string): DBAlert[] {
    const alerts: DBAlert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = this.getTasks(companyId, role === 'Employee' ? employeeId : undefined);
    const meetings = this.getMeetings(companyId);

    // 1. Task deadline and overdue alerts
    for (const t of tasks) {
      const deadlineDate = new Date(t.deadline + 'T00:00:00');
      const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (t.status !== 'Completed') {
        if (diffDays < 0) {
          // Overdue
          alerts.push({
            id: `alert_overdue_${t.id}`,
            companyId,
            recipientRole: role,
            recipientId: role === 'Employee' ? t.employeeId : undefined,
            type: 'task_overdue',
            title: role === 'Manager' ? `${t.employeeName}'s task is overdue` : 'Your task is overdue',
            description: `Task "${t.subject}" passed deadline on ${t.deadline}.`,
            severity: 'urgent',
            createdAt: t.updatedAt || t.createdAt,
            read: this.isAlertRead(`alert_overdue_${t.id}`),
            relatedTaskId: t.id,
          });
        } else if (diffDays <= 2) {
          // Approaching deadline (tomorrow or 2 days)
          const daysText = diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : 'in 2 days';
          alerts.push({
            id: `alert_deadline_${t.id}_${diffDays}`,
            companyId,
            recipientRole: role,
            recipientId: role === 'Employee' ? t.employeeId : undefined,
            type: 'task_deadline',
            title: role === 'Manager' ? `Task deadline approaching: ${t.employeeName}` : 'Task deadline approaching',
            description: `Task "${t.subject}" is due ${daysText} (${t.deadline}).`,
            severity: diffDays <= 1 ? 'warning' : 'info',
            createdAt: t.updatedAt || t.createdAt,
            read: this.isAlertRead(`alert_deadline_${t.id}_${diffDays}`),
            relatedTaskId: t.id,
          });
        }
      }
    }

    // 2. Meeting alerts (for Manager or company-wide)
    if (role === 'Manager') {
      for (const m of meetings) {
        const meetingDate = new Date(m.date + 'T00:00:00');
        const diffDays = Math.ceil((meetingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 2) {
          const daysText = diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : 'in 2 days';
          alerts.push({
            id: `alert_mtg_${m.id}_${diffDays}`,
            companyId,
            recipientRole: 'Manager',
            type: 'meeting',
            title: `Upcoming meeting: ${m.title}`,
            description: `Meeting is scheduled ${daysText} at ${m.time} (${m.durationMinutes} mins).`,
            severity: 'info',
            createdAt: m.createdAt,
            read: this.isAlertRead(`alert_mtg_${m.id}_${diffDays}`),
            relatedMeetingId: m.id,
          });
        }
      }
    }

    return alerts;
  }

  private isAlertRead(alertId: string): boolean {
    const match = this.db.alerts.find((a) => a.id === alertId);
    return match ? match.read : false;
  }

  markAlertRead(alertId: string): void {
    const match = this.db.alerts.find((a) => a.id === alertId);
    if (match) {
      match.read = true;
    } else {
      this.db.alerts.push({
        id: alertId,
        companyId: '',
        recipientRole: 'Manager',
        type: 'task_deadline',
        title: '',
        description: '',
        severity: 'info',
        createdAt: new Date().toISOString(),
        read: true,
      });
    }
    this.persist();
  }

  // Sessions
  createSession(token: string, userId: string, role: 'Manager' | 'Employee', companyId: string, employeeId?: string): DBSession {
    // 7-day session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const session: DBSession = {
      token,
      userId,
      role,
      companyId,
      employeeId,
      createdAt: new Date().toISOString(),
      expiresAt,
    };
    this.db.sessions.push(session);
    this.persist();
    return session;
  }

  getSession(token: string): DBSession | undefined {
    const session = this.db.sessions.find((s) => s.token === token);
    if (!session) return undefined;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.deleteSession(token);
      return undefined;
    }
    return session;
  }

  deleteSession(token: string): void {
    const idx = this.db.sessions.findIndex((s) => s.token === token);
    if (idx !== -1) {
      this.db.sessions.splice(idx, 1);
      this.persist();
    }
  }
}

export const store = new DataStore();
