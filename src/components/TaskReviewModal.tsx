import React, { useState } from 'react';
import {
  AITaskSuggestion,
  EmployeeUser,
  MeetingItem,
  AIAnalysisResult,
  TranscriptRecord,
} from '../types';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Trash2,
  Plus,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Calendar,
  FileText,
  Quote,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { transcriptStorage } from '../services/transcriptStorage';

interface TaskReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingTitle: string;
  meetingDate?: string;
  analysisResult: AIAnalysisResult;
  transcriptId?: string;
  employees: EmployeeUser[];
  onTasksApproved: (count: number) => void;
  onShowToast: (title: string, description?: string, type?: 'info' | 'warning' | 'success') => void;
}

export const TaskReviewModal: React.FC<TaskReviewModalProps> = ({
  isOpen,
  onClose,
  meetingTitle,
  meetingDate = new Date().toISOString().split('T')[0],
  analysisResult,
  transcriptId,
  employees,
  onTasksApproved,
  onShowToast,
}) => {
  const [tasks, setTasks] = useState<AITaskSuggestion[]>(analysisResult.actionItems || []);
  const [summaryExpanded, setSummaryExpanded] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const selectedCount = tasks.filter((t) => t.selected).length;

  const handleToggleSelectAll = () => {
    const allSelected = tasks.every((t) => t.selected);
    setTasks((prev) => prev.map((t) => ({ ...t, selected: !allSelected })));
  };

  const handleToggleTaskSelect = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleUpdateTask = (id: string, updates: Partial<AITaskSuggestion>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };
        if (updates.suggestedEmployeeId !== undefined) {
          const matchedEmp = employees.find(
            (e) => e.employeeId.toLowerCase() === updates.suggestedEmployeeId?.toLowerCase()
          );
          if (matchedEmp) {
            updated.suggestedEmployeeName = matchedEmp.employeeName;
          }
        }
        return updated;
      })
    );
  };

  const handleRemoveTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddNewTask = () => {
    const newTask: AITaskSuggestion = {
      id: `manual_task_${Date.now()}`,
      subject: '',
      description: 'Action item agreed upon in meeting.',
      suggestedEmployeeId: employees.length > 0 ? employees[0].employeeId : '',
      suggestedEmployeeName: employees.length > 0 ? employees[0].employeeName : '',
      suggestedDeadline: meetingDate,
      priority: 'Medium',
      confidence: 100,
      transcriptQuote: 'Manually added by manager during review.',
      selected: true,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleApproveAndSend = async () => {
    const tasksToCreate = tasks.filter((t) => t.selected);

    if (tasksToCreate.length === 0) {
      onShowToast('No Tasks Selected', 'Please select at least one task to approve.', 'warning');
      return;
    }

    // Validate that each task has a subject and an employee assigned
    for (const t of tasksToCreate) {
      if (!t.subject.trim()) {
        onShowToast('Missing Subject', 'All selected tasks must have a subject.', 'warning');
        return;
      }
      if (!t.suggestedEmployeeId) {
        onShowToast(
          'Missing Assignee',
          `Please assign an employee for task "${t.subject}".`,
          'warning'
        );
        return;
      }
      if (!t.suggestedDeadline) {
        onShowToast('Missing Deadline', `Please specify a deadline for task "${t.subject}".`, 'warning');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const payload = tasksToCreate.map((t) => ({
        employeeId: t.suggestedEmployeeId,
        subject: t.subject.trim(),
        assignedDate: meetingDate,
        deadline: t.suggestedDeadline,
        priority: t.priority,
      }));

      const res = await api.bulkCreateTasks(payload);

      // Update transcript status in IndexedDB if transcriptId provided
      if (transcriptId) {
        try {
          await transcriptStorage.updateTranscript(transcriptId, {
            status: 'reviewed',
            actionItems: tasks,
          });
        } catch (storageErr) {
          console.warn('Could not update transcript status in IndexedDB:', storageErr);
        }
      }

      onShowToast(
        'Tasks Approved & Dispatched',
        `Successfully delegated ${res.count} task${res.count > 1 ? 's' : ''} to team members.`,
        'success'
      );
      onTasksApproved(res.count);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to approve and assign tasks.';
      onShowToast('Approval Failed', msg, 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="task-review-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        id="task-review-modal-container"
        className="bg-[#130b2b] border border-violet-800/40 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white animate-in fade-in duration-200"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-violet-950/80 via-[#180e38] to-[#130b2b] border-b border-violet-800/30 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                AI Suggested Action Items
              </span>
              <span className="text-xs text-slate-400">• Manager Review Required</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Review & Assign Tasks: {meetingTitle}
            </h2>
            <p className="text-xs text-violet-300/80">
              AI suggests commitments extracted from the meeting. Review, edit details, select assignees, and approve before sending to employees.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-violet-400 hover:text-white hover:bg-violet-900/40 rounded-xl transition cursor-pointer"
            aria-label="Close review modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Executive Summary & Key Points Collapsible Card */}
          <div className="bg-[#1a0f3b]/70 border border-violet-800/30 rounded-xl p-4 transition">
            <button
              type="button"
              onClick={() => setSummaryExpanded(!summaryExpanded)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-violet-200">
                  Meeting Summary & Key Discussion Points
                </span>
              </div>
              {summaryExpanded ? (
                <ChevronUp className="w-4 h-4 text-violet-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-violet-400" />
              )}
            </button>

            {summaryExpanded && (
              <div className="mt-3.5 pt-3 border-t border-violet-800/20 space-y-3 text-xs sm:text-sm">
                <p className="text-slate-300 leading-relaxed">
                  {analysisResult.meetingSummary || 'No executive summary provided.'}
                </p>

                {analysisResult.keyDiscussionPoints && analysisResult.keyDiscussionPoints.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-violet-300 uppercase tracking-wide">
                      Key Takeaways:
                    </span>
                    <ul className="mt-1.5 space-y-1 text-slate-300 list-disc list-inside">
                      {analysisResult.keyDiscussionPoints.map((point, i) => (
                        <li key={i} className="text-xs">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Items List Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-violet-800/20">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-violet-200">
                  Extracted Action Items ({tasks.length})
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-600/30 text-violet-300 border border-violet-500/30">
                  {selectedCount} Selected for Delegation
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="px-3 py-1.5 rounded-lg bg-violet-900/30 hover:bg-violet-800/40 text-violet-300 hover:text-white text-xs font-semibold border border-violet-700/30 transition cursor-pointer"
                >
                  {tasks.every((t) => t.selected) ? 'Deselect All' : 'Select All'}
                </button>

                <button
                  type="button"
                  onClick={handleAddNewTask}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Action Item</span>
                </button>
              </div>
            </div>

            {/* Empty State */}
            {tasks.length === 0 ? (
              <div className="text-center py-10 bg-[#160d33]/50 rounded-xl border border-violet-900/30 p-6 space-y-3">
                <AlertCircle className="w-8 h-8 text-violet-400 mx-auto" />
                <p className="text-sm text-slate-300">No action items detected in this transcript.</p>
                <button
                  onClick={handleAddNewTask}
                  className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 cursor-pointer"
                >
                  + Add Custom Task
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task, index) => {
                  return (
                    <div
                      key={task.id}
                      id={`task-review-card-${task.id}`}
                      className={`
                        rounded-xl border p-4 sm:p-5 transition-all
                        ${
                          task.selected
                            ? 'bg-[#180e3b] border-violet-600/60 shadow-md shadow-violet-950/50'
                            : 'bg-[#120a27]/60 border-violet-900/30 opacity-70'
                        }
                      `}
                    >
                      {/* Top bar of card: Selection checkbox, confidence, delete */}
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-violet-800/20">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!task.selected}
                            onChange={() => handleToggleTaskSelect(task.id)}
                            className="w-4 h-4 rounded text-violet-600 bg-violet-950 border-violet-700 focus:ring-violet-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-violet-200">
                            Task #{index + 1} {task.selected ? '(Selected for Approval)' : '(Excluded)'}
                          </span>
                        </label>

                        <div className="flex items-center gap-2">
                          {task.confidence && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-700/40">
                              AI Confidence: {task.confidence}%
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveTask(task.id)}
                            className="p-1.5 text-violet-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition cursor-pointer"
                            title="Discard this task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Editable Task Fields */}
                      <div className="mt-3.5 grid grid-cols-1 md:grid-cols-12 gap-3.5">
                        {/* Task Subject */}
                        <div className="md:col-span-7 space-y-1">
                          <label className="text-[11px] font-bold text-violet-300 uppercase tracking-wide">
                            Task Subject / Commitment
                          </label>
                          <input
                            type="text"
                            value={task.subject}
                            onChange={(e) => handleUpdateTask(task.id, { subject: e.target.value })}
                            placeholder="e.g. Finalize Q3 analytics report"
                            className="w-full px-3 py-2 bg-[#0e0720] border border-violet-700/40 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-violet-400 placeholder:text-violet-400/40"
                          />
                        </div>

                        {/* Assignee Selection */}
                        <div className="md:col-span-5 space-y-1">
                          <label className="text-[11px] font-bold text-violet-300 uppercase tracking-wide flex items-center justify-between">
                            <span>Assignee</span>
                            {task.suggestedEmployeeName && (
                              <span className="text-[10px] font-normal text-emerald-400">
                                Matched: {task.suggestedEmployeeName}
                              </span>
                            )}
                          </label>
                          <select
                            value={task.suggestedEmployeeId}
                            onChange={(e) => {
                              const empId = e.target.value;
                              const matched = employees.find((emp) => emp.employeeId === empId);
                              handleUpdateTask(task.id, {
                                suggestedEmployeeId: empId,
                                suggestedEmployeeName: matched ? matched.employeeName : 'Not Assigned',
                              });
                            }}
                            className="w-full px-3 py-2 bg-[#0e0720] border border-violet-700/40 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-violet-400"
                          >
                            <option value="">Not Assigned</option>
                            {employees.map((emp) => (
                              <option key={emp.employeeId} value={emp.employeeId}>
                                {emp.employeeName} — {emp.employeeId} ({emp.employeePost || 'Employee'})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Deadline */}
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[11px] font-bold text-violet-300 uppercase tracking-wide">
                            Deadline
                          </label>
                          <input
                            type="date"
                            value={task.suggestedDeadline}
                            onChange={(e) =>
                              handleUpdateTask(task.id, { suggestedDeadline: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-[#0e0720] border border-violet-700/40 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-violet-400"
                          />
                        </div>

                        {/* Priority */}
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[11px] font-bold text-violet-300 uppercase tracking-wide">
                            Priority
                          </label>
                          <select
                            value={task.priority}
                            onChange={(e) =>
                              handleUpdateTask(task.id, {
                                priority: e.target.value as 'High' | 'Medium' | 'Low',
                              })
                            }
                            className="w-full px-3 py-2 bg-[#0e0720] border border-violet-700/40 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-violet-400"
                          >
                            <option value="High">High Priority</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </div>

                        {/* Context / Notes */}
                        <div className="md:col-span-5 space-y-1">
                          <label className="text-[11px] font-bold text-violet-300 uppercase tracking-wide">
                            Context & Deliverables
                          </label>
                          <input
                            type="text"
                            value={task.description}
                            onChange={(e) => handleUpdateTask(task.id, { description: e.target.value })}
                            placeholder="Deliverable details discussed in meeting"
                            className="w-full px-3 py-2 bg-[#0e0720] border border-violet-700/40 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-violet-400 placeholder:text-violet-400/40"
                          />
                        </div>
                      </div>

                      {/* Verbatim Transcript Quote Snippet */}
                      {task.transcriptQuote && (
                        <div className="mt-3 pt-2.5 border-t border-violet-800/20 flex items-start gap-2 text-[11px] text-violet-300/80 bg-violet-950/30 p-2 rounded-lg">
                          <Quote className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                          <span className="italic">
                            Meeting Quote: &ldquo;{task.transcriptQuote}&rdquo;
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Accountability Notice and Actions */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#100724] to-[#160d33] border-t border-violet-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-violet-300/90">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Strict Human-in-the-Loop: Tasks are only created after your explicit review and approval.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-violet-700/40 hover:bg-violet-900/30 text-violet-300 text-xs font-bold transition cursor-pointer"
            >
              Review Later
            </button>

            <button
              type="button"
              id="approve-send-tasks-btn"
              onClick={handleApproveAndSend}
              disabled={isSubmitting || selectedCount === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-950/60 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Delegating Tasks...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>SEND SELECTED TASKS ({selectedCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
