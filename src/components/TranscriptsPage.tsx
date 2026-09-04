import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Clock,
  Trash2,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Plus,
  Volume2,
  Copy,
  Check,
  X,
  Download,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { TranscriptRecord, EmployeeUser, MeetingItem, AIAnalysisResult, AuthUser } from '../types';
import { transcriptStorage } from '../services/transcriptStorage';
import { api } from '../services/api';

interface TranscriptsPageProps {
  user: AuthUser;
  employees: EmployeeUser[];
  meetings: MeetingItem[];
  onOpenRecorder: () => void;
  onOpenReview: (
    analysis: AIAnalysisResult,
    meetingTitle: string,
    meetingDate: string,
    transcriptId?: string
  ) => void;
  onShowToast: (title: string, description?: string, type?: 'info' | 'warning' | 'success') => void;
}

export const TranscriptsPage: React.FC<TranscriptsPageProps> = ({
  user,
  employees,
  meetings,
  onOpenRecorder,
  onOpenReview,
  onShowToast,
}) => {
  const [transcripts, setTranscripts] = useState<TranscriptRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Selected Transcript for Viewer Modal
  const [selectedTranscript, setSelectedTranscript] = useState<TranscriptRecord | null>(null);
  const [viewerModalOpen, setViewerModalOpen] = useState<boolean>(false);

  // Gemini Trigger Confirmation Dialog
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Copy & Download states
  const [copied, setCopied] = useState<boolean>(false);

  // Load transcripts from local IndexedDB (7-day auto-purge runs on load)
  const loadTranscripts = useCallback(async () => {
    try {
      setLoading(true);
      const items = await transcriptStorage.getTranscripts(user.companyId);
      setTranscripts(items);

      // If a transcript is currently open in viewer, sync its updated data
      if (selectedTranscript) {
        const updated = items.find((t) => t.id === selectedTranscript.id);
        if (updated) {
          setSelectedTranscript(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load local transcripts:', err);
      onShowToast('Storage Notice', 'Could not read transcripts from local IndexedDB.', 'warning');
    } finally {
      setLoading(false);
    }
  }, [user.companyId, onShowToast, selectedTranscript]);

  useEffect(() => {
    loadTranscripts();
  }, [loadTranscripts]);

  // Format seconds to MM:SS or HH:MM:SS
  const formatDuration = (totalSeconds: number): string => {
    if (!totalSeconds || totalSeconds <= 0) return '00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Delete transcript
  const handleDeleteTranscript = async (id: string, title: string) => {
    if (!window.confirm(`Delete transcript for "${title}" from your local browser storage?`)) {
      return;
    }
    try {
      await transcriptStorage.deleteTranscript(id);
      setTranscripts((prev) => prev.filter((t) => t.id !== id));
      if (selectedTranscript?.id === id) {
        setViewerModalOpen(false);
        setSelectedTranscript(null);
      }
      onShowToast('Transcript Deleted', `Removed "${title}" from local storage.`, 'info');
    } catch (err) {
      onShowToast('Delete Failed', 'Could not delete transcript.', 'warning');
    }
  };

  // Copy raw transcript to clipboard
  const handleCopyTranscript = (rawText: string) => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast('Copied to Clipboard', 'Raw transcript copied to clipboard.', 'success');
  };

  // Download raw transcript as .txt file
  const handleDownloadTxt = (transcript: TranscriptRecord) => {
    const rawText = transcript.rawTranscript || transcript.transcriptText;
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const sanitizedTitle = transcript.meetingTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `transcript-${sanitizedTitle}-${transcript.meetingDate}.txt`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onShowToast('Transcript Downloaded', `Saved raw transcript as ${filename}`, 'success');
  };

  // Step 1: Manager clicks "TRANSCRIBE WITH AI" or "ANALYZE AGAIN WITH AI" -> Open Confirmation Dialog
  const handlePromptGeminiConfirmation = () => {
    if (!selectedTranscript) return;
    setConfirmModalOpen(true);
  };

  // Step 2: Manager clicks CONTINUE inside confirmation dialog -> Run Gemini
  const handleExecuteGeminiAnalysis = async () => {
    if (!selectedTranscript) return;

    try {
      setIsAnalyzing(true);
      await transcriptStorage.setAIStatus(selectedTranscript.id, 'AI_ANALYZING');

      const rawText = selectedTranscript.rawTranscript || selectedTranscript.transcriptText;

      const analysis = await api.analyzeTranscript({
        meetingTitle: selectedTranscript.meetingTitle,
        meetingDate: selectedTranscript.meetingDate,
        transcriptText: rawText,
      });

      // Save AI analysis metadata separately in IndexedDB (rawTranscript remains untouched!)
      const updated = await transcriptStorage.saveAIAnalysis(selectedTranscript.id, {
        meetingSummary: analysis.meetingSummary,
        keyDiscussionPoints: analysis.keyDiscussionPoints,
        actionItems: analysis.actionItems,
      });

      if (updated) {
        setSelectedTranscript(updated);
        setTranscripts((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      }

      setConfirmModalOpen(false);
      onShowToast('AI Analysis Complete', 'Action items extracted from meeting transcript.', 'success');

      // Launch Task Review Modal for manager review
      onOpenReview(
        analysis,
        selectedTranscript.meetingTitle,
        selectedTranscript.meetingDate,
        selectedTranscript.id
      );
    } catch (err) {
      console.error('Gemini analysis failed:', err);
      // Raw transcript is safely preserved!
      await transcriptStorage.setAIStatus(selectedTranscript.id, 'AI_ANALYSIS_FAILED');

      const refreshed = await transcriptStorage.getTranscripts(user.companyId);
      setTranscripts(refreshed);
      const failedRecord = refreshed.find((t) => t.id === selectedTranscript.id);
      if (failedRecord) {
        setSelectedTranscript(failedRecord);
      }

      setConfirmModalOpen(false);
      onShowToast(
        'AI Analysis Failed',
        'AI analysis failed. Your raw transcript is safely saved.',
        'warning'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Open existing tasks for an analyzed transcript
  const handleOpenExistingTasks = (transcript: TranscriptRecord) => {
    const tasks = transcript.aiTasks || transcript.actionItems || [];
    const analysis: AIAnalysisResult = {
      meetingSummary: transcript.aiSummary || transcript.summary || 'Summary of session.',
      keyDiscussionPoints: transcript.aiKeyPoints || transcript.keyPoints || [],
      actionItems: tasks,
    };
    onOpenReview(analysis, transcript.meetingTitle, transcript.meetingDate, transcript.id);
  };

  // Search filter
  const filteredTranscripts = transcripts.filter(
    (t) =>
      t.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.rawTranscript && t.rawTranscript.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.transcriptText && t.transcriptText.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Check if transcripts exist but none have AI analysis
  const hasTranscripts = transcripts.length > 0;
  const anyHasAIAnalysis = transcripts.some((t) => t.aiAnalyzed);

  return (
    <div id="transcripts-page-root" className="space-y-6 max-w-7xl mx-auto text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">Meeting Transcripts</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-600/30 text-violet-300 border border-violet-500/30">
              7-Day Local Storage
            </span>
          </div>
          <p className="text-xs sm:text-sm text-violet-300/70 mt-1">
            Raw speech-to-text transcripts stored client-side in IndexedDB with 7-day retention. Gemini AI is strictly triggered on-demand.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadTranscripts}
            className="p-2.5 rounded-xl border border-violet-800/40 text-violet-300 hover:text-white hover:bg-violet-900/30 transition cursor-pointer"
            title="Refresh local transcripts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            id="open-meeting-recorder-btn"
            onClick={onOpenRecorder}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-950/50 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record / Transcribe Meeting</span>
          </button>
        </div>
      </div>

      {/* Storage Policy Notice Banner */}
      <div className="bg-gradient-to-r from-violet-950/40 via-[#180e38] to-[#120a2b] border border-violet-800/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-900/40 border border-violet-700/30 text-violet-300 shrink-0">
            <Clock className="w-5 h-5 text-violet-400" />
          </div>
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-violet-200">
              Client Data Sovereignty & 7-Day Auto-Purge Policy
            </span>
            <p className="text-violet-300/80">
              Transcripts are saved locally in browser IndexedDB and automatically expire after 7 days. AI analysis never runs automatically without explicit manager confirmation.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-mono font-semibold text-violet-300">
            {transcripts.length} Active Transcript{transcripts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* AI Status notice if transcripts exist but none are analyzed */}
      {hasTranscripts && !anyHasAIAnalysis && (
        <div className="bg-violet-950/30 border border-violet-800/30 rounded-xl px-4 py-2.5 text-xs text-violet-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
          <span>AI analysis has not been run on these transcripts. Open any transcript to transcribe with AI on-demand.</span>
        </div>
      )}

      {/* Search Bar */}
      {transcripts.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stored transcripts by meeting title or spoken words..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#140b2e] border border-violet-800/30 rounded-xl text-xs sm:text-sm text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 transition"
          />
        </div>
      )}

      {/* Transcripts List */}
      {loading ? (
        <div className="py-20 text-center text-violet-400 space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin" />
          <p className="text-xs font-medium">Loading local transcript storage...</p>
        </div>
      ) : transcripts.length === 0 ? (
        /* Empty State: No Transcripts */
        <div className="py-16 text-center bg-[#130b2c]/50 rounded-2xl border border-violet-900/30 p-8 space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-violet-900/30 border border-violet-700/30 flex items-center justify-center mx-auto text-violet-400">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No meeting transcripts available.</h3>
            <p className="text-xs text-violet-300/70">
              Record a meeting or upload meeting audio to create a raw transcript.
            </p>
          </div>
          <button
            onClick={onOpenRecorder}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow transition cursor-pointer"
          >
            + Record New Meeting
          </button>
        </div>
      ) : filteredTranscripts.length === 0 ? (
        <div className="py-12 text-center text-violet-300/70 text-xs">
          No transcripts match &quot;{searchQuery}&quot;.
        </div>
      ) : (
        /* Stored Transcripts Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTranscripts.map((transcript) => {
            const timeRemaining = transcriptStorage.formatTimeRemaining(transcript.expirationAt);
            const isAnalyzed = transcript.aiAnalyzed;
            const isFailed = transcript.aiStatus === 'AI_ANALYSIS_FAILED';
            const isAnalyzingThis = transcript.aiStatus === 'AI_ANALYZING';

            return (
              <div
                key={transcript.id}
                id={`transcript-card-${transcript.id}`}
                className="bg-[#140b2e] border border-violet-800/40 hover:border-violet-600/60 rounded-2xl p-5 shadow-lg shadow-violet-950/40 flex flex-col justify-between space-y-4 transition group"
              >
                <div className="space-y-3.5">
                  {/* Meeting Name & Date */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-violet-200 transition line-clamp-1">
                        {transcript.meetingTitle}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleDeleteTranscript(transcript.id, transcript.meetingTitle)}
                        className="p-1 text-violet-400/60 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition cursor-pointer"
                        title="Delete from local storage"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-violet-300/70">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-violet-400" />
                        {transcript.meetingDate}
                      </span>
                      {transcript.durationSeconds > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-violet-400" />
                          {formatDuration(transcript.durationSeconds)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata Box: AI Status, Created At, Expiration */}
                  <div className="bg-[#0e0720]/80 border border-violet-900/30 rounded-xl p-3 space-y-2 text-xs">
                    {/* AI Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-violet-400 text-[11px] font-medium">AI Status:</span>
                      {isAnalyzed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-700/40">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          AI analyzed
                        </span>
                      ) : isFailed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-950/70 text-red-300 border border-red-700/40">
                          <AlertCircle className="w-3 h-3 text-red-400" />
                          AI analysis failed
                        </span>
                      ) : isAnalyzingThis ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-violet-900/50 text-violet-300 border border-violet-700/40">
                          <RefreshCw className="w-3 h-3 animate-spin text-violet-300" />
                          Analyzing...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-violet-950/60 text-violet-300 border border-violet-800/40">
                          Not analyzed
                        </span>
                      )}
                    </div>

                    {/* Created At */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-violet-400 font-medium">Created At:</span>
                      <span className="text-slate-300">
                        {new Date(transcript.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Expiration */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-violet-400 font-medium">Expires:</span>
                      <span
                        className={`font-semibold ${
                          timeRemaining.isUrgent ? 'text-amber-300' : 'text-slate-300'
                        }`}
                      >
                        {timeRemaining.formattedDate}
                        <span className="text-[10px] text-violet-400/80 ml-1">
                          ({timeRemaining.text})
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Snippet preview */}
                  <p className="text-xs text-slate-300/90 line-clamp-2 italic font-mono bg-[#0c061d] p-2.5 rounded-lg border border-violet-950">
                    &quot;{(transcript.rawTranscript || transcript.transcriptText).slice(0, 140)}...&quot;
                  </p>
                </div>

                {/* Card Action Button: OPEN TRANSCRIPT */}
                <div className="pt-2 border-t border-violet-800/20 flex items-center gap-2">
                  <button
                    type="button"
                    id={`open-transcript-${transcript.id}-btn`}
                    onClick={() => {
                      setSelectedTranscript(transcript);
                      setViewerModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-violet-600/30 hover:bg-violet-600 border border-violet-500/40 hover:border-violet-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <FileText className="w-4 h-4 text-violet-300" />
                    <span>OPEN TRANSCRIPT</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. OPEN TRANSCRIPT VIEWER MODAL                                            */}
      {/* ========================================================================= */}
      {viewerModalOpen && selectedTranscript && (
        <div
          id="transcript-viewer-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          <div
            id="transcript-viewer-modal"
            className="bg-[#130b2b] border border-violet-800/50 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white animate-in fade-in duration-200"
          >
            {/* Header: Meeting Name, Date, Duration, Expiration */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-violet-950/80 via-[#180e38] to-[#120a2b] border-b border-violet-800/30 flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-900/40 px-2 py-0.5 rounded border border-violet-700/30">
                    Meeting Transcript Viewer
                  </span>
                  {selectedTranscript.aiAnalyzed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-950/70 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/40">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      AI Analyzed
                    </span>
                  ) : selectedTranscript.aiStatus === 'AI_ANALYSIS_FAILED' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-950/70 text-red-300 px-2 py-0.5 rounded border border-red-700/40">
                      <AlertCircle className="w-3 h-3 text-red-400" />
                      AI Analysis Failed
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-violet-300 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800/40">
                      Not Analyzed
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {selectedTranscript.meetingTitle}
                </h2>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-violet-300/80">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-violet-400" />
                    <strong>Date:</strong> {selectedTranscript.meetingDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-violet-400" />
                    <strong>Duration:</strong> {formatDuration(selectedTranscript.durationSeconds)}
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-300/90">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <strong>Expires:</strong> {transcriptStorage.formatTimeRemaining(selectedTranscript.expirationAt).formattedDate}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewerModalOpen(false)}
                className="p-2 text-violet-400 hover:text-white hover:bg-violet-900/40 rounded-xl transition cursor-pointer"
                aria-label="Close transcript viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Failure Alert Banner (if failed previously) */}
              {selectedTranscript.aiStatus === 'AI_ANALYSIS_FAILED' && (
                <div className="bg-red-950/40 border border-red-700/40 rounded-xl p-4 flex items-start gap-3 text-xs">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-red-200">
                      AI analysis failed. Your raw transcript is safely saved.
                    </div>
                    <p className="text-red-300/80">
                      The speech-to-text transcript was preserved without loss. You can retry AI analysis below whenever you are ready.
                    </p>
                  </div>
                </div>
              )}

              {/* RAW TRANSCRIPT SECTION */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                      Raw Transcript
                    </span>
                    <span className="text-[10px] text-violet-400/70">
                      (AssemblyAI Speech-to-Text Engine)
                    </span>
                  </div>

                  {/* Actions: COPY TRANSCRIPT & DOWNLOAD .TXT */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="copy-raw-transcript-btn"
                      onClick={() =>
                        handleCopyTranscript(
                          selectedTranscript.rawTranscript || selectedTranscript.transcriptText
                        )
                      }
                      className="px-3 py-1.5 rounded-lg border border-violet-700/40 hover:bg-violet-900/40 text-violet-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-violet-400" />
                      )}
                      <span>{copied ? 'Copied' : 'COPY TRANSCRIPT'}</span>
                    </button>

                    <button
                      type="button"
                      id="download-raw-txt-btn"
                      onClick={() => handleDownloadTxt(selectedTranscript)}
                      className="px-3 py-1.5 rounded-lg border border-violet-700/40 hover:bg-violet-900/40 text-violet-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Download complete raw transcript text file"
                    >
                      <Download className="w-3.5 h-3.5 text-violet-400" />
                      <span>DOWNLOAD .TXT</span>
                    </button>
                  </div>
                </div>

                {/* Raw Transcript Content Box (Scrollable & Readable) */}
                <div className="bg-[#0e0720] border border-violet-800/40 rounded-xl p-4 sm:p-5 max-h-72 overflow-y-auto text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
                  {selectedTranscript.rawTranscript || selectedTranscript.transcriptText}
                </div>
              </div>

              {/* SAVED AI ANALYSIS SECTION (if previously analyzed) */}
              {selectedTranscript.aiAnalyzed && (
                <div className="space-y-4 pt-2 border-t border-violet-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                        Saved AI Analysis & Extracted Items
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenExistingTasks(selectedTranscript)}
                      className="text-xs text-violet-300 hover:text-white underline font-semibold cursor-pointer"
                    >
                      Review Saved AI Tasks ({selectedTranscript.aiTasks?.length || 0})
                    </button>
                  </div>

                  {selectedTranscript.aiSummary && (
                    <div className="bg-[#180e38]/70 border border-violet-800/40 rounded-xl p-4 space-y-1 text-xs">
                      <div className="font-bold text-violet-200 text-[11px] uppercase tracking-wide">
                        Meeting Summary
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {selectedTranscript.aiSummary}
                      </p>
                    </div>
                  )}

                  {selectedTranscript.aiTasks && selectedTranscript.aiTasks.length > 0 && (
                    <div className="bg-[#150d31] border border-violet-800/30 rounded-xl p-3.5 text-xs space-y-2">
                      <div className="font-bold text-violet-300 text-[11px] uppercase tracking-wide flex items-center justify-between">
                        <span>Extracted Action Items ({selectedTranscript.aiTasks.length})</span>
                        <span className="text-[10px] text-violet-400">Raw transcript preserved intact</span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {selectedTranscript.aiTasks.map((t, idx) => (
                          <div
                            key={t.id || idx}
                            className="bg-[#0e0720]/80 p-2 rounded-lg border border-violet-900/30 flex items-center justify-between text-xs"
                          >
                            <span className="text-white font-medium truncate">{t.subject}</span>
                            <span className="text-violet-300 text-[11px] shrink-0 ml-2">
                              {t.suggestedEmployeeName || 'Not Assigned'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with Primary Action: TRANSCRIBE WITH AI or ANALYZE AGAIN WITH AI */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#100724] to-[#160d33] border-t border-violet-800/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-violet-400/80">
                AssemblyAI speech engine • Gemini AI analyzes on manager request
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setViewerModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-violet-700/40 hover:bg-violet-900/30 text-violet-300 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>

                {/* THE ONLY EVENT THAT TRIGGERS GEMINI: MANAGER CLICKS THIS BUTTON */}
                <button
                  type="button"
                  id="transcribe-with-ai-btn"
                  onClick={handlePromptGeminiConfirmation}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-950/60 flex items-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-violet-200" />
                  <span>
                    {selectedTranscript.aiStatus === 'AI_ANALYSIS_FAILED'
                      ? 'RETRY AI ANALYSIS'
                      : selectedTranscript.aiAnalyzed
                      ? 'ANALYZE AGAIN WITH AI'
                      : 'TRANSCRIBE WITH AI'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. CONFIRMATION DIALOG BEFORE GEMINI CALL                                  */}
      {/* ========================================================================= */}
      {confirmModalOpen && selectedTranscript && (
        <div
          id="confirm-gemini-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            id="confirm-gemini-modal"
            className="bg-[#140b2e] border border-violet-700/50 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5 text-white animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-violet-900/40 border border-violet-600/40 flex items-center justify-center text-violet-300 shrink-0">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {selectedTranscript.aiAnalyzed
                    ? 'Analyze this transcript again with AI?'
                    : 'Analyze this meeting transcript with AI?'}
                </h3>
                <p className="text-xs text-violet-300/80 leading-relaxed">
                  MeetFlow will examine the complete transcript and identify possible tasks, owners, assigned dates and deadlines.
                </p>
              </div>
            </div>

            <div className="bg-[#0e0720] p-3 rounded-xl border border-violet-900/40 text-xs text-violet-300/70 space-y-1">
              <div><strong>Meeting:</strong> {selectedTranscript.meetingTitle}</div>
              <div><strong>Date:</strong> {selectedTranscript.meetingDate}</div>
            </div>

            {isAnalyzing && (
              <div className="bg-violet-950/60 border border-violet-700/50 rounded-xl p-3 flex items-center gap-3 animate-pulse text-xs text-violet-200">
                <RefreshCw className="w-4 h-4 animate-spin text-violet-400 shrink-0" />
                <span>Analyzing complete transcript with Gemini AI...</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                id="cancel-gemini-btn"
                onClick={() => setConfirmModalOpen(false)}
                disabled={isAnalyzing}
                className="px-4 py-2 rounded-xl border border-violet-700/40 hover:bg-violet-900/30 text-violet-300 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                CANCEL
              </button>

              <button
                type="button"
                id="continue-gemini-btn"
                onClick={handleExecuteGeminiAnalysis}
                disabled={isAnalyzing}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>CONTINUE</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
