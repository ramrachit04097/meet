import React, { useState } from 'react';
import { MeetingItem, AuthUser } from '../types';
import {
  Plus,
  Calendar,
  Clock,
  Video,
  X,
  Check,
  Loader2,
  CalendarDays,
  Search,
  Mic,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';

interface MeetingsPageProps {
  user: AuthUser;
  meetings: MeetingItem[];
  onRefreshMeetings: () => void;
  onOpenRecorder?: (meetingId?: string) => void;
  onShowToast: (title: string, description?: string, type?: 'info' | 'warning' | 'success') => void;
}

export const MeetingsPage: React.FC<MeetingsPageProps> = ({
  user,
  meetings,
  onRefreshMeetings,
  onOpenRecorder,
  onShowToast,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [saving, setSaving] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) {
      onShowToast('Incomplete Fields', 'Please provide a title, date, and time.', 'warning');
      return;
    }

    try {
      setSaving(true);
      await api.addMeeting({
        title: title.trim(),
        date,
        time,
        durationMinutes: Number(durationMinutes) || 30,
      });

      onShowToast('Meeting Scheduled', `"${title}" was added to your calendar.`, 'success');
      setShowAddForm(false);
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('10:00');
      onRefreshMeetings();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to schedule meeting.';
      onShowToast('Error', msg, 'warning');
    } finally {
      setSaving(false);
    }
  };

  const filteredMeetings = meetings.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div id="meetings-page-root" className="space-y-6 max-w-7xl mx-auto text-white">
      {/* Page Header */}
      <div id="meetings-page-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Meetings</h1>
          <p className="text-xs sm:text-sm text-violet-300/70 mt-1">
            Schedule sessions and convert discussions into accountable action for {user.companyName}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onOpenRecorder && (
            <button
              type="button"
              id="record-meeting-header-btn"
              onClick={() => onOpenRecorder()}
              className="px-4 py-2.5 rounded-xl bg-violet-900/40 hover:bg-violet-800/50 text-violet-200 hover:text-white text-xs font-bold border border-violet-700/40 flex items-center gap-2 transition cursor-pointer"
            >
              <Mic className="w-4 h-4 text-violet-400" />
              <span>Record & Transcribe</span>
            </button>
          )}

          <button
            type="button"
            id="schedule-meeting-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:from-violet-700 active:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-violet-950/40 flex items-center gap-2 transition cursor-pointer"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showAddForm ? 'Close Form' : '+ Schedule Meeting'}</span>
          </button>
        </div>
      </div>

      {/* Add Meeting Form Panel */}
      {showAddForm && (
        <div
          id="add-meeting-panel"
          className="bg-[#181135] border border-violet-700/50 rounded-2xl p-5 sm:p-6 shadow-xl animate-fadeIn"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              <span>Schedule New Session</span>
            </h3>
            <span className="text-[11px] text-violet-300/60">
              Meetings appear in upcoming cards and distribution metrics
            </span>
          </div>

          <form onSubmit={handleAddMeeting} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Meeting Title */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label htmlFor="mtg-title-input" className="block text-[11px] font-bold text-violet-300 uppercase mb-1 tracking-wider">
                  Meeting Title / Purpose
                </label>
                <input
                  id="mtg-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Roadmap Review & Delegation"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#201646] border border-violet-800/50 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  required
                />
              </div>

              {/* 2. Date */}
              <div>
                <label htmlFor="mtg-date-input" className="block text-[11px] font-bold text-violet-300 uppercase mb-1 tracking-wider">
                  Date
                </label>
                <input
                  id="mtg-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#201646] border border-violet-800/50 text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                  required
                />
              </div>

              {/* 3. Time */}
              <div>
                <label htmlFor="mtg-time-input" className="block text-[11px] font-bold text-violet-300 uppercase mb-1 tracking-wider">
                  Time
                </label>
                <input
                  id="mtg-time-input"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#201646] border border-violet-800/50 text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                  required
                />
              </div>

              {/* 4. Duration */}
              <div>
                <label htmlFor="mtg-duration-select" className="block text-[11px] font-bold text-violet-300 uppercase mb-1 tracking-wider">
                  Duration
                </label>
                <select
                  id="mtg-duration-select"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#201646] border border-violet-800/50 text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                >
                  <option value={15} className="bg-[#181135] text-white">15 minutes</option>
                  <option value={30} className="bg-[#181135] text-white">30 minutes</option>
                  <option value={45} className="bg-[#181135] text-white">45 minutes</option>
                  <option value={60} className="bg-[#181135] text-white">60 minutes (1 hr)</option>
                  <option value={90} className="bg-[#181135] text-white">90 minutes (1.5 hrs)</option>
                </select>
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
                <span>Confirm Meeting</span>
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
            placeholder="Search meetings by title..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#1c143d] border border-violet-800/40 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500"
          />
        </div>

        <span className="text-xs text-violet-300/70 hidden sm:inline">
          {filteredMeetings.length} meeting{filteredMeetings.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Meetings Grid / Cards */}
      {filteredMeetings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeetings.map((mtg) => {
            const isUpcoming = mtg.date >= todayStr;

            return (
              <div
                key={mtg.id}
                className="bg-[#150f2f] border border-violet-800/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-violet-600/50 transition group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isUpcoming
                          ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                          : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {isUpcoming ? 'Scheduled' : 'Past Session'}
                    </span>
                    <span className="text-xs font-mono text-violet-300 font-semibold bg-violet-800/30 px-2 py-0.5 rounded-md border border-violet-700/30">
                      {mtg.durationMinutes} mins
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white group-hover:text-violet-200 transition line-clamp-2">
                    {mtg.title}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-violet-900/30 flex items-center justify-between text-xs text-violet-300/80">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-violet-400" />
                      <span>{mtg.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-violet-400" />
                      <span>{mtg.time}</span>
                    </div>
                  </div>

                  {onOpenRecorder && (
                    <button
                      type="button"
                      onClick={() => onOpenRecorder(mtg.id)}
                      className="px-2.5 py-1 rounded-lg bg-violet-800/40 hover:bg-violet-700/60 text-violet-200 hover:text-white text-[11px] font-semibold border border-violet-700/30 flex items-center gap-1 transition cursor-pointer"
                      title="Record audio and extract tasks for this meeting"
                    >
                      <Mic className="w-3 h-3 text-violet-400" />
                      <span>Record</span>
                    </button>
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
            <CalendarDays className="w-6 h-6 text-violet-400" strokeWidth={1.8} />
          </div>
          <p className="text-base font-bold text-white">No meetings scheduled yet</p>
          <p className="text-xs text-violet-300/70 mt-1 max-w-sm mx-auto leading-relaxed">
            Schedule a meeting to track your team's agenda, monitor session duration, and delegate accountable action items.
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mt-5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
          >
            + Schedule First Meeting
          </button>
        </div>
      )}
    </div>
  );
};
