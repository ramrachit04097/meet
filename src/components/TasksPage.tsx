import React, { useState } from 'react';
import { TaskItem, EmployeeUser, AuthUser } from '../types';
import {
  Plus,
  Check,
  X,
  Edit2,
  Trash2,
  CheckSquare,
  AlertCircle,
  Clock3,
  Calendar,
  User,
  Loader2,
  Filter,
  Search,
} from 'lucide-react';
import { api } from '../services/api';

interface TasksPageProps {
  user: AuthUser;
  tasks: TaskItem[];
  employees: EmployeeUser[];
  onRefreshTasks: () => void;
  onShowToast: (title: string, description?: string, type?: 'info' | 'warning' | 'success') => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  user,
  tasks,
  employees,
  onRefreshTasks,
  onShowToast,
}) => {
  const isManager = user.role === 'Manager';

  // Add Task Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [subject, setSubject] = useState('');
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  // Edit Deadline State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDeadlineValue, setEditDeadlineValue] = useState('');

  // Delete Task Modal State
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Handle Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !subject.trim() || !assignedDate || !deadline) {
      onShowToast('Incomplete Fields', 'Please complete all required task fields.', 'warning');
      return;
    }

    if (deadline < assignedDate) {
      onShowToast('Invalid Deadline', 'Deadline cannot be earlier than assigned date.', 'warning');
      return;
    }

    try {
      setSavingTask(true);
      await api.addTask({
        employeeId: selectedEmployeeId,
        subject: subject.trim(),
        assignedDate,
        deadline,
      });

      onShowToast('Task Created', `Task assigned successfully.`, 'success');
      setShowAddForm(false);
      setSubject('');
      setDeadline('');
      setSelectedEmployeeId('');
      onRefreshTasks();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create task.';
      onShowToast('Error', msg, 'warning');
    } finally {
      setSavingTask(false);
    }
  };

  // Handle Save Deadline Edit
  const handleSaveDeadline = async (taskId: string) => {
    if (!editDeadlineValue) {
      setEditingTaskId(null);
      return;
    }
    try {
      await api.updateTask(taskId, { deadline: editDeadlineValue });
      onShowToast('Deadline Updated', 'The task deadline was modified successfully.', 'success');
      setEditingTaskId(null);
      onRefreshTasks();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update deadline.';
      onShowToast('Error', msg, 'warning');
    }
  };

  // Handle Employee Status Change
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      onShowToast('Status Updated', `Task status changed to ${newStatus}.`, 'success');
      onRefreshTasks();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to change status.';
      onShowToast('Error', msg, 'warning');
    }
  };

  // Handle Delete Task
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      setDeletingTask(true);
      await api.deleteTask(taskToDelete.id);
      onShowToast('Task Deleted', 'The task was removed.', 'info');
      setTaskToDelete(null);
      onRefreshTasks();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete task.';
      onShowToast('Error', msg, 'warning');
    } finally {
      setDeletingTask(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'In Progress':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Overdue':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
    }
  };

  return (
    <div id="tasks-page-root" className="space-y-6 max-w-7xl mx-auto text-white">
      {/* Page Header */}
      <div id="tasks-page-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Tasks</h1>
          <p className="text-xs sm:text-sm text-violet-300/70 mt-1">
            {isManager ? 'Manage and track employee tasks.' : 'View and update your assigned deliverables.'}
          </p>
        </div>

        {isManager && (
          <button
            type="button"
            id="add-task-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:from-violet-700 active:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-violet-950/40 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showAddForm ? 'Close Form' : '+ Add Task'}</span>
          </button>
        )}
      </div>

      {/* Add Task Form Panel (Manager Only) */}
      {isManager && showAddForm && (
        <div
          id="add-task-panel"
          className="bg-[#181135] border border-violet-700/50 rounded-2xl p-5 sm:p-6 shadow-xl animate-fadeIn"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-400" />
              <span>Assign New Task</span>
            </h3>
            <span className="text-[11px] text-violet-300/60">Initial status will be set to Pending</span>
          </div>

          {employees.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>No employees registered yet. Please add an employee first from the Employees tab to assign tasks.</span>
            </div>
          ) : (
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Employee Name Dropdown */}
                <div>
                  <label htmlFor="task-employee-select" className="block text-[11px] font-bold text-violet-300 uppercase mb-1 tracking-wider">
                    Employee Name
                  </label>
                  <select
                    id="task-employee-select"
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#201646] border border-violet-800/50 text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                    required
                  >
                    <option value="" disabled className="bg-[#181135] text-violet-400">
                      Select an employee...
                    </option>
                    {employees.map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId} className="bg-[#181135] text-white">
                        {emp.employeeName} ({emp.employeeId} • {emp.employeePost})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Task Subject */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label htmlFor="task-subject-input" className="block text-[11px] font-bold text-violet-300 uppercase mb-1 tracking-wider">
                    Task Subject
                  </label>
                  <input
                    id="task-subject-input"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Audit Q3 compliance report"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#201646] border border-violet-800/50 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    required
                  />
                </div>

                {/* 3. Assigned Date */}
                <div>
                  <label htmlFor="task-assigned-date" className="block text-[11px] font-bold text-violet-300 uppercase mb-1 tracking-wider">
                    Assigned Date
                  </label>
                  <input
                    id="task-assigned-date"
                    type="date"
                    value={assignedDate}
                    onChange={(e) => setAssignedDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#201646] border border-violet-800/50 text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                    required
                  />
                </div>

                {/* 4. Deadline */}
                <div>
                  <label htmlFor="task-deadline-date" className="block text-[11px] font-bold text-violet-300 uppercase mb-1 tracking-wider">
                    Deadline
                  </label>
                  <input
                    id="task-deadline-date"
                    type="date"
                    value={deadline}
                    min={assignedDate}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#201646] border border-violet-800/50 text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons: Green Tick / Red Cross */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-violet-900/30">
                <button
                  type="button"
                  id="cancel-add-task-btn"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>

                <button
                  type="submit"
                  id="save-add-task-btn"
                  disabled={savingTask}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-60"
                  title="Save Task"
                >
                  {savingTask ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                  <span>Save Task</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#150f2f] border border-violet-800/40 p-3 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-violet-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, employees..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#1c143d] border border-violet-800/40 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[11px] text-violet-300 font-semibold uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg bg-[#1c143d] border border-violet-800/40 text-white focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Task Table Container */}
      <div
        id="tasks-table-container"
        className="bg-[#150f2f] rounded-2xl border border-violet-800/40 shadow-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table id="tasks-table" className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1d1442] border-b border-violet-800/40 text-violet-300/80 font-bold uppercase text-[10px] tracking-wider">
                {isManager && <th scope="col" className="px-5 py-4 whitespace-nowrap">Employee ID</th>}
                {isManager && <th scope="col" className="px-5 py-4 whitespace-nowrap">Employee Name</th>}
                {isManager && <th scope="col" className="px-5 py-4 whitespace-nowrap">Employee Post</th>}
                <th scope="col" className="px-5 py-4 whitespace-nowrap">Task Subject</th>
                <th scope="col" className="px-5 py-4 whitespace-nowrap">Assigned Date</th>
                <th scope="col" className="px-5 py-4 whitespace-nowrap">Deadline</th>
                <th scope="col" className="px-5 py-4 whitespace-nowrap">Status</th>
                <th scope="col" className="px-5 py-4 whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-900/20 text-violet-200">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const isEditingThis = editingTaskId === task.id;

                  return (
                    <tr key={task.id} className="hover:bg-violet-800/10 transition">
                      {isManager && (
                        <td className="px-5 py-3.5 font-mono text-violet-300 font-semibold">{task.employeeId}</td>
                      )}
                      {isManager && (
                        <td className="px-5 py-3.5 font-bold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-violet-400" />
                          <span>{task.employeeName}</span>
                        </td>
                      )}
                      {isManager && (
                        <td className="px-5 py-3.5 text-violet-300/80">{task.employeePost}</td>
                      )}
                      <td className="px-5 py-3.5 font-medium text-white max-w-[280px]">
                        {task.subject}
                      </td>
                      <td className="px-5 py-3.5 text-violet-300/80">{task.assignedDate}</td>

                      {/* Deadline column with inline edit support for manager */}
                      <td className="px-5 py-3.5">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="date"
                              value={editDeadlineValue}
                              onChange={(e) => setEditDeadlineValue(e.target.value)}
                              className="px-2 py-1 text-xs rounded bg-[#201646] border border-violet-600 text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveDeadline(task.id)}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                              title="Save Deadline"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTaskId(null)}
                              className="p-1 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-300"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-violet-200 font-medium">{task.deadline}</span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="px-5 py-3.5">
                        {!isManager ? (
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${getStatusBadge(
                              task.status
                            )} bg-[#1c143d]`}
                          >
                            <option value="Pending" className="bg-[#181135] text-amber-300">Pending</option>
                            <option value="In Progress" className="bg-[#181135] text-indigo-300">In Progress</option>
                            <option value="Completed" className="bg-[#181135] text-emerald-300">Completed</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {isManager ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTaskId(task.id);
                                setEditDeadlineValue(task.deadline);
                              }}
                              className="p-1.5 rounded-lg text-violet-300 hover:text-white hover:bg-violet-800/30 transition"
                              title="Edit Deadline"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setTaskToDelete(task)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-violet-400">Personal Task</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* EMPTY STATE (Zero tasks) */
                <tr>
                  <td colSpan={isManager ? 8 : 5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-violet-800/20 rounded-2xl border border-violet-700/30 flex items-center justify-center text-violet-400 mb-3">
                        <CheckSquare className="w-6 h-6 text-violet-400" strokeWidth={1.8} />
                      </div>
                      <p className="text-base font-bold text-white">No tasks available</p>
                      <p className="text-xs text-violet-300/70 mt-1 max-w-sm leading-relaxed">
                        {isManager
                          ? 'Add a task or approve tasks from a meeting.'
                          : 'You currently have no tasks assigned to your account.'}
                      </p>
                      {isManager && (
                        <button
                          type="button"
                          onClick={() => setShowAddForm(true)}
                          className="mt-4 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
                        >
                          + Create First Task
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info showing count */}
        <div
          id="tasks-table-footer"
          className="px-6 py-3.5 bg-[#120c29] border-t border-violet-800/40 flex items-center justify-between text-xs text-violet-300/70"
        >
          <span>
            Showing {filteredTasks.length} of {tasks.length} task{tasks.length === 1 ? '' : 's'}
          </span>
          <span className="text-[11px] text-violet-400/60 font-medium">MeetFlow Task Orchestration Engine</span>
        </div>
      </div>

      {/* Delete Task Confirmation Modal */}
      {taskToDelete && (
        <div
          id="delete-task-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setTaskToDelete(null)}
        >
          <div
            id="delete-task-dialog"
            className="w-full max-w-sm bg-[#181133] border border-violet-800/40 rounded-2xl shadow-2xl p-6 text-white relative animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Task?</h3>
                <p className="text-xs text-violet-300/70">Confirm permanent removal</p>
              </div>
            </div>

            <p className="text-xs text-violet-200/90 leading-relaxed mb-6">
              Are you sure you want to delete the task <strong className="text-white">"{taskToDelete.subject}"</strong> assigned to <strong className="text-white">{taskToDelete.employeeName}</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#221747] hover:bg-[#2c1e5c] text-violet-200 text-xs font-semibold transition border border-violet-800/30 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingTask}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition shadow-lg shadow-rose-950/40 cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {deletingTask && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
