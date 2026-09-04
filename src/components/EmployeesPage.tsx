import React, { useState } from 'react';
import { EmployeeUser, AuthUser } from '../types';
import {
  Plus,
  Users,
  Trash2,
  X,
  Check,
  Eye,
  EyeOff,
  Shield,
  Loader2,
  Activity,
  Briefcase,
  Hash,
  User,
  Search,
} from 'lucide-react';
import { api } from '../services/api';

interface EmployeesPageProps {
  user: AuthUser;
  employees: EmployeeUser[];
  onRefreshEmployees: () => void;
  onShowToast: (title: string, description?: string, type?: 'info' | 'warning' | 'success') => void;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({
  user,
  employees,
  onRefreshEmployees,
  onShowToast,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [employeePost, setEmployeePost] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [empToDelete, setEmpToDelete] = useState<EmployeeUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Handle Add Employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !employeeId.trim() || !password) {
      onShowToast('Incomplete Fields', 'Please provide Employee Name, ID, and Password.', 'warning');
      return;
    }

    if (password.length < 4) {
      onShowToast('Weak Password', 'Password must be at least 4 characters long.', 'warning');
      return;
    }

    try {
      setSaving(true);
      await api.addEmployee({
        employeeName: employeeName.trim(),
        employeeId: employeeId.trim(),
        employeePost: employeePost.trim() || 'Team Member',
        password,
      });

      onShowToast('Employee Added', `${employeeName} was registered successfully.`, 'success');
      setShowAddForm(false);
      setEmployeeName('');
      setEmployeeId('');
      setEmployeePost('');
      setPassword('');
      onRefreshEmployees();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to register employee.';
      onShowToast('Error', msg, 'warning');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Employee
  const handleConfirmDelete = async () => {
    if (!empToDelete) return;
    try {
      setDeleting(true);
      await api.deleteEmployee(empToDelete.employeeId);
      onShowToast('Employee Removed', `${empToDelete.employeeName} was removed.`, 'info');
      setEmpToDelete(null);
      onRefreshEmployees();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete employee.';
      onShowToast('Error', msg, 'warning');
    } finally {
      setDeleting(false);
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeePost.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="employees-page-root" className="space-y-6 max-w-7xl mx-auto text-white">
      {/* Page Header */}
      <div id="employees-page-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Employees</h1>
          <p className="text-xs sm:text-sm text-violet-300/70 mt-1">
            Manage your company's registered employees for {user.companyName}.
          </p>
        </div>

        <button
          type="button"
          id="add-employee-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:from-violet-700 active:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-violet-950/40 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showAddForm ? 'Close Form' : '+ Add Employee'}</span>
        </button>
      </div>

      {/* Add Employee Form Panel */}
      {showAddForm && (
        <div
          id="add-employee-panel"
          className="bg-[#181135] border border-violet-700/50 rounded-2xl p-5 sm:p-6 shadow-xl animate-fadeIn"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-400" />
              <span>Register New Employee</span>
            </h3>
            <span className="text-[11px] text-violet-300/60">
              No employee email required. Employee will sign in with Company Email, User ID & Password.
            </span>
          </div>

          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Employee Name */}
              <div>
                <label htmlFor="emp-name-input" className="block text-[11px] font-bold text-violet-300 uppercase mb-1 tracking-wider">
                  Employee Name
                </label>
                <input
                  id="emp-name-input"
                  type="text"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#201646] border border-violet-800/50 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  required
                />
              </div>

              {/* 2. Employee ID */}
              <div>
                <label htmlFor="emp-id-input" className="block text-[11px] font-bold text-violet-300 uppercase mb-1 tracking-wider">
                  Employee ID
                </label>
                <input
                  id="emp-id-input"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-204"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#201646] border border-violet-800/50 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  required
                />
              </div>

              {/* 3. Employee Post / Designation */}
              <div>
                <label htmlFor="emp-post-input" className="block text-[11px] font-bold text-violet-300 uppercase mb-1 tracking-wider">
                  Employee Post (Role)
                </label>
                <input
                  id="emp-post-input"
                  type="text"
                  value={employeePost}
                  onChange={(e) => setEmployeePost(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#201646] border border-violet-800/50 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              {/* 4. Password */}
              <div>
                <label htmlFor="emp-pass-input" className="block text-[11px] font-bold text-violet-300 uppercase mb-1 tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="emp-pass-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 pr-10 text-xs rounded-xl bg-[#201646] border border-violet-800/50 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-violet-400/60 hover:text-violet-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-violet-900/30">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Add Employee</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-[#150f2f] border border-violet-800/40 p-3 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-violet-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees by name, ID or post..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#1c143d] border border-violet-800/40 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500"
          />
        </div>

        <span className="text-xs text-violet-300/70 hidden sm:inline">
          {filteredEmployees.length} of {employees.length} employee{employees.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Employees Table Container */}
      <div
        id="employees-table-container"
        className="bg-[#150f2f] rounded-2xl border border-violet-800/40 shadow-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table id="employees-table" className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1d1442] border-b border-violet-800/40 text-violet-300/80 font-bold uppercase text-[10px] tracking-wider">
                <th scope="col" className="px-5 py-4 whitespace-nowrap">Employee ID</th>
                <th scope="col" className="px-5 py-4 whitespace-nowrap">Employee Name</th>
                <th scope="col" className="px-5 py-4 whitespace-nowrap">Employee Post</th>
                <th scope="col" className="px-5 py-4 whitespace-nowrap">Status</th>
                <th scope="col" className="px-5 py-4 whitespace-nowrap">Assigned Tasks</th>
                <th scope="col" className="px-5 py-4 whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-900/20 text-violet-200">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-violet-800/10 transition">
                    <td className="px-5 py-3.5 font-mono text-violet-300 font-bold">{emp.employeeId}</td>
                    <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-[11px] font-bold text-violet-200">
                        {emp.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <span>{emp.employeeName}</span>
                    </td>
                    <td className="px-5 py-3.5 text-violet-300/90">{emp.employeePost}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          emp.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            emp.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-white bg-violet-800/30 px-2 py-0.5 rounded-md border border-violet-700/30">
                        {emp.assignedTasksCount || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setEmpToDelete(emp)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition cursor-pointer"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                /* EMPTY STATE (Zero employees) */
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-violet-800/20 rounded-2xl border border-violet-700/30 flex items-center justify-center text-violet-400 mb-3">
                        <Users className="w-6 h-6 text-violet-400" strokeWidth={1.8} />
                      </div>
                      <p className="text-base font-bold text-white">No employees registered</p>
                      <p className="text-xs text-violet-300/70 mt-1 max-w-sm leading-relaxed">
                        Add employees to assign tasks, monitor team execution, and track active sessions.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="mt-4 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
                      >
                        + Register First Employee
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          id="employees-table-footer"
          className="px-6 py-3.5 bg-[#120c29] border-t border-violet-800/40 flex items-center justify-between text-xs text-violet-300/70"
        >
          <span>
            {employees.length} team member{employees.length === 1 ? '' : 's'} in {user.companyName}
          </span>
          <span className="text-[11px] text-violet-400/60 font-medium">MeetFlow RBAC Access Security</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {empToDelete && (
        <div
          id="delete-emp-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setEmpToDelete(null)}
        >
          <div
            id="delete-emp-dialog"
            className="w-full max-w-sm bg-[#181133] border border-violet-800/40 rounded-2xl shadow-2xl p-6 text-white relative animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remove Employee?</h3>
                <p className="text-xs text-violet-300/70">Confirm employee deactivation</p>
              </div>
            </div>

            <p className="text-xs text-violet-200/90 leading-relaxed mb-6">
              Are you sure you want to remove <strong className="text-white">{empToDelete.employeeName}</strong> ({empToDelete.employeeId}) from your organization?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEmpToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#221747] hover:bg-[#2c1e5c] text-violet-200 text-xs font-semibold transition border border-violet-800/30 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition shadow-lg shadow-rose-950/40 cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
