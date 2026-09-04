import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Upload,
  FileText,
  Clock,
  Sparkles,
  AlertCircle,
  X,
  CheckCircle2,
  RefreshCw,
  Calendar,
  Volume2,
  Users,
} from 'lucide-react';
import { MeetingItem, EmployeeUser, AIAnalysisResult, TranscriptRecord } from '../types';
import { api } from '../services/api';
import { transcriptStorage } from '../services/transcriptStorage';

interface MeetingRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetings: MeetingItem[];
  employees: EmployeeUser[];
  onAnalysisReady?: (
    analysis: AIAnalysisResult,
    meetingTitle: string,
    meetingDate: string,
    transcriptId?: string
  ) => void;
  onTranscriptSaved?: (record: TranscriptRecord) => void;
  onNavigateToTranscripts?: () => void;
  onShowToast: (title: string, description?: string, type?: 'info' | 'warning' | 'success') => void;
}

type InputMode = 'record' | 'upload' | 'text';

export const MeetingRecorderModal: React.FC<MeetingRecorderModalProps> = ({
  isOpen,
  onClose,
  meetings,
  employees,
  onAnalysisReady,
  onTranscriptSaved,
  onNavigateToTranscripts,
  onShowToast,
}) => {
  const [inputMode, setInputMode] = useState<InputMode>('record');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [customMeetingTitle, setCustomMeetingTitle] = useState<string>('');
  const [meetingDate, setMeetingDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Live Speech Recognition Preview (Web Speech API)
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState<boolean>(false);

  // Uploaded Audio State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Direct Text State
  const [manualTranscriptText, setManualTranscriptText] = useState<string>('');

  // Processing Status & Saved Record
  const [processingState, setProcessingState] = useState<
    'idle' | 'transcribing' | 'saving' | 'done'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [savedRecord, setSavedRecord] = useState<TranscriptRecord | null>(null);

  // MediaRecorder Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check speech recognition support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechRecognitionSupported(true);
      }
    }
  }, []);

  // Format seconds to HH:MM:SS
  const formatDuration = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get active meeting title
  const getActiveTitle = (): string => {
    if (selectedMeetingId) {
      const found = meetings.find((m) => m.id === selectedMeetingId);
      if (found) return found.title;
    }
    return customMeetingTitle.trim() || 'Team Accountability Session';
  };

  // Start live microphone recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.start(1000); // chunk every second
      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);

      // Start elapsed timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Start Web Speech API live preview if available
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + ' ';
            }
            setLiveTranscript(fullText.trim());
          };

          recognition.onerror = (event: any) => {
            console.warn('Live speech recognition warning:', event.error);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn('Could not initialize SpeechRecognition:', e);
        }
      }

      onShowToast('Recording Started', 'Capturing meeting audio via microphone.', 'info');
    } catch (err) {
      console.error('Microphone access denied:', err);
      onShowToast(
        'Microphone Required',
        'Please allow microphone access in your browser to record meeting discussions.',
        'warning'
      );
    }
  };

  // Pause / Resume recording
  const handlePauseToggle = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
    setIsPaused(false);
    onShowToast('Recording Completed', 'Ready for transcription & analysis.', 'info');
  };

  // Discard & Reset Recording
  const handleResetRecording = () => {
    if (isRecording) {
      handleStopRecording();
    }
    setRecordedAudioBlob(null);
    setAudioUrl(null);
    setLiveTranscript('');
    setRecordingSeconds(0);
  };

  // File upload change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      onShowToast('Audio File Loaded', `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`, 'info');
    }
  };

  // Transcribe & Save: Audio -> AssemblyAI -> IndexedDB (7-day auto-expiration)
  // CRITICAL RULE: NEVER calls Gemini automatically!
  const handleTranscribeAndSave = async () => {
    const title = getActiveTitle();
    let transcriptText = '';
    let speakers: any[] = [];
    let durationSec = recordingSeconds;

    try {
      // 1. Obtain Transcript Text based on mode
      if (inputMode === 'text') {
        if (!manualTranscriptText.trim()) {
          onShowToast('Empty Transcript', 'Please enter or paste meeting notes to save.', 'warning');
          return;
        }
        transcriptText = manualTranscriptText.trim();
        speakers = [{ speaker: 'Meeting Notes', text: transcriptText }];
      } else {
        // Audio mode (Record or Upload)
        let audioBlobToProcess: Blob | null = null;

        if (inputMode === 'record') {
          if (!recordedAudioBlob && !liveTranscript.trim()) {
            onShowToast('No Audio Recorded', 'Please record audio or use live speech before transcribing.', 'warning');
            return;
          }
          audioBlobToProcess = recordedAudioBlob;
        } else if (inputMode === 'upload') {
          if (!uploadedFile) {
            onShowToast('No File Selected', 'Please select an audio file to transcribe.', 'warning');
            return;
          }
          audioBlobToProcess = uploadedFile;
        }

        setProcessingState('transcribing');
        setStatusMessage('Transcribing speech using AssemblyAI engine...');

        // Convert audio Blob to Base64
        let base64Audio = '';
        if (audioBlobToProcess) {
          base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = reader.result as string;
              const base64 = res.split(',')[1] || '';
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlobToProcess);
          });
        }

        // Call backend transcribe endpoint (AssemblyAI)
        const transcribeRes = await api.transcribeMeetingAudio({
          audioBase64: base64Audio || undefined,
          liveTranscript: liveTranscript.trim() || undefined,
          meetingTitle: title,
        });

        transcriptText = transcribeRes.transcriptText || liveTranscript.trim();
        speakers = transcribeRes.speakers || [];
        if (transcribeRes.durationSeconds) {
          durationSec = transcribeRes.durationSeconds;
        }

        if (transcribeRes.apiKeyNotice) {
          onShowToast('Browser Speech Captured', transcribeRes.apiKeyNotice, 'info');
        }
      }

      if (!transcriptText || transcriptText.trim().length === 0) {
        throw new Error('Transcription failed. Please try again.');
      }

      // 2. Save Raw Transcript to Local IndexedDB (7-day auto-expiration)
      setProcessingState('saving');
      setStatusMessage('Saving raw transcript locally (7-Day Auto-Expiration Policy)...');

      const saved = await transcriptStorage.saveTranscript({
        meetingId: selectedMeetingId || undefined,
        meetingTitle: title,
        meetingDate,
        companyId: 'current',
        rawTranscript: transcriptText,
        durationSeconds: durationSec,
        speakers,
      });

      setSavedRecord(saved);
      setProcessingState('done');
      setStatusMessage('');

      if (onTranscriptSaved) {
        onTranscriptSaved(saved);
      }

      onShowToast(
        'Transcript Saved',
        'Raw transcript saved locally (7-day retention). Open Transcripts to review and transcribe with AI.',
        'success'
      );
    } catch (err) {
      console.error('Transcription error:', err);
      const msg = err instanceof Error ? err.message : 'Transcription failed. Please try again.';
      onShowToast('Transcription Failed', msg, 'warning');
      setProcessingState('idle');
      setStatusMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="meeting-recorder-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        id="meeting-recorder-modal"
        className="bg-[#130b2b] border border-violet-800/40 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white animate-in fade-in duration-200"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-violet-950/80 via-[#180e38] to-[#130b2b] border-b border-violet-800/30 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                <Mic className="w-3.5 h-3.5 text-violet-400" />
                Live Session Capture & AI Analysis
              </span>
              <span className="text-xs text-slate-400">• 7-Day Local Storage Policy</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Capture Meeting Discussion
            </h2>
            <p className="text-xs text-violet-300/80">
              Record microphone audio, upload a recording, or paste meeting notes. MeetFlow will transcribe the discussion and extract accountable tasks for manager approval.
            </p>
          </div>

          <button
            onClick={() => {
              if (isRecording) handleStopRecording();
              onClose();
            }}
            className="p-2 text-violet-400 hover:text-white hover:bg-violet-900/40 rounded-xl transition cursor-pointer"
            aria-label="Close recorder"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {savedRecord ? (
            /* Completed State: Raw Transcript Saved locally */
            <div className="space-y-5 py-1 animate-in fade-in duration-200">
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-900/40 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-300">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Raw Transcript Saved Locally
                  </h3>
                  <p className="text-xs text-emerald-200/80 max-w-md mx-auto">
                    The meeting speech was transcribed via AssemblyAI and safely saved to your browser&apos;s local IndexedDB with 7-day retention.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-900/50 border border-violet-700/40 text-[11px] text-violet-300 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>AI Status: <strong className="text-amber-300">Not analyzed</strong> (Gemini is triggered manually in Transcripts)</span>
                </div>
              </div>

              {/* Meeting Details Card */}
              <div className="bg-[#160d33] border border-violet-800/40 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-violet-400 text-[10px] font-bold uppercase">Meeting</div>
                  <div className="font-semibold text-white truncate">{savedRecord.meetingTitle}</div>
                </div>
                <div>
                  <div className="text-violet-400 text-[10px] font-bold uppercase">Date</div>
                  <div className="font-semibold text-white">{savedRecord.meetingDate}</div>
                </div>
                <div>
                  <div className="text-violet-400 text-[10px] font-bold uppercase">Duration</div>
                  <div className="font-semibold text-white">{formatDuration(savedRecord.durationSeconds)}</div>
                </div>
                <div>
                  <div className="text-violet-400 text-[10px] font-bold uppercase">Retention</div>
                  <div className="font-semibold text-amber-300">Expires in 7 days</div>
                </div>
              </div>

              {/* Raw Transcript Preview */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-violet-300 uppercase tracking-wide">
                  Raw Transcript Preview
                </label>
                <div className="bg-[#0e0720] border border-violet-800/30 rounded-xl p-3.5 max-h-48 overflow-y-auto text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
                  {savedRecord.rawTranscript || savedRecord.transcriptText}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Meeting Selection & Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 bg-[#170e36]/60 p-4 rounded-xl border border-violet-800/30">
            <div className="sm:col-span-7 space-y-1">
              <label className="text-[11px] font-bold text-violet-300 uppercase tracking-wide">
                Link to Scheduled Meeting or Name Session
              </label>
              {meetings.length > 0 ? (
                <select
                  value={selectedMeetingId}
                  onChange={(e) => {
                    setSelectedMeetingId(e.target.value);
                    if (e.target.value) setCustomMeetingTitle('');
                  }}
                  className="w-full px-3 py-2 bg-[#0d071e] border border-violet-700/40 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-violet-400"
                >
                  <option value="">-- Custom / Ad-hoc Meeting --</option>
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.date} at {m.time})
                    </option>
                  ))}
                </select>
              ) : null}

              {(!selectedMeetingId || meetings.length === 0) && (
                <input
                  type="text"
                  value={customMeetingTitle}
                  onChange={(e) => setCustomMeetingTitle(e.target.value)}
                  placeholder="e.g. Q3 Sprint Planning & Deliverables Review"
                  className="w-full mt-1.5 px-3 py-2 bg-[#0d071e] border border-violet-700/40 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-violet-400 placeholder:text-violet-400/40"
                />
              )}
            </div>

            <div className="sm:col-span-5 space-y-1">
              <label className="text-[11px] font-bold text-violet-300 uppercase tracking-wide">
                Meeting Date
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d071e] border border-violet-700/40 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-violet-400"
              />
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-violet-800/30 gap-2">
            <button
              type="button"
              onClick={() => setInputMode('record')}
              className={`pb-2.5 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
                inputMode === 'record'
                  ? 'text-violet-300 border-violet-500'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Record Live Audio</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`pb-2.5 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
                inputMode === 'upload'
                  ? 'text-violet-300 border-violet-500'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Audio File</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`pb-2.5 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
                inputMode === 'text'
                  ? 'text-violet-300 border-violet-500'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Paste Notes / Transcript</span>
            </button>
          </div>

          {/* Tab Content: RECORD AUDIO */}
          {inputMode === 'record' && (
            <div className="space-y-4">
              <div className="bg-[#160d33] border border-violet-800/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                {/* Timer Display */}
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-mono font-bold tracking-wider text-white">
                    {formatDuration(recordingSeconds)}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs">
                    {isRecording ? (
                      <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                        {isPaused ? 'Recording Paused' : 'Recording in Progress...'}
                      </span>
                    ) : recordedAudioBlob ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Audio Ready for Transcription
                      </span>
                    ) : (
                      <span className="text-violet-300/70">Click to start microphone capture</span>
                    )}
                  </div>
                </div>

                {/* Pulsing Audio Waves Visualization when active */}
                {isRecording && !isPaused && (
                  <div className="flex items-center justify-center gap-1.5 h-8">
                    {[16, 28, 12, 32, 24, 18, 30, 14, 26, 32, 20].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gradient-to-t from-violet-500 to-indigo-400 rounded-full animate-pulse"
                        style={{
                          height: `${h}px`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.8s',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Recording Control Buttons */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      id="start-mic-recording-btn"
                      onClick={handleStartRecording}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-violet-600 hover:from-red-500 hover:to-violet-500 text-white text-sm font-bold shadow-lg shadow-red-950/40 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Mic className="w-5 h-5" />
                      <span>{recordedAudioBlob ? 'Record Again' : 'Start Recording'}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handlePauseToggle}
                        className="px-4 py-2.5 rounded-xl bg-violet-800/40 hover:bg-violet-700/50 text-violet-200 text-xs font-bold border border-violet-700/40 flex items-center gap-2 transition cursor-pointer"
                      >
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        <span>{isPaused ? 'Resume' : 'Pause'}</span>
                      </button>

                      <button
                        type="button"
                        id="stop-mic-recording-btn"
                        onClick={handleStopRecording}
                        className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow flex items-center gap-2 transition cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>Stop Recording</span>
                      </button>
                    </>
                  )}

                  {recordedAudioBlob && !isRecording && (
                    <button
                      type="button"
                      onClick={handleResetRecording}
                      className="px-3.5 py-2.5 rounded-xl border border-violet-800/40 text-violet-300 hover:text-white hover:bg-violet-900/30 text-xs transition cursor-pointer"
                    >
                      Discard
                    </button>
                  )}
                </div>

                {/* Audio playback preview if recorded */}
                {audioUrl && !isRecording && (
                  <div className="w-full max-w-md pt-2">
                    <audio src={audioUrl} controls className="w-full h-9 rounded-lg" />
                  </div>
                )}
              </div>

              {/* Real-time live transcript preview if available */}
              {liveTranscript && (
                <div className="bg-[#160d33]/60 border border-violet-800/30 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-300 uppercase tracking-wide">
                    <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                    <span>Live Spoken Preview (Captured in Real-time)</span>
                  </div>
                  <p className="text-xs text-slate-300 max-h-24 overflow-y-auto leading-relaxed italic">
                    &ldquo;{liveTranscript}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: UPLOAD AUDIO */}
          {inputMode === 'upload' && (
            <div className="space-y-3">
              <label
                htmlFor="audio-file-upload"
                className="border-2 border-dashed border-violet-700/50 hover:border-violet-400/80 bg-[#160d33]/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition"
              >
                <Upload className="w-10 h-10 text-violet-400 mb-2" />
                <span className="text-sm font-bold text-white">
                  {uploadedFile ? uploadedFile.name : 'Click to select or drag & drop meeting audio'}
                </span>
                <span className="text-xs text-violet-300/70 mt-1">
                  Supports MP3, WAV, WebM, M4A, AAC up to 50MB
                </span>
                {uploadedFile && (
                  <span className="mt-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-700/30">
                    File selected: {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                )}
                <input
                  id="audio-file-upload"
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.webm,.aac"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Tab Content: DIRECT NOTES / PASTE */}
          {inputMode === 'text' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-violet-300 uppercase tracking-wide">
                Paste Meeting Notes or External Transcript
              </label>
              <textarea
                rows={6}
                value={manualTranscriptText}
                onChange={(e) => setManualTranscriptText(e.target.value)}
                placeholder="Paste meeting discussion, transcripts with speaker names, or notes..."
                className="w-full px-3.5 py-3 bg-[#0d071e] border border-violet-700/40 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-400 placeholder:text-violet-400/40 resize-y"
              />
            </div>
          )}

          {/* Processing Indicator */}
          {processingState !== 'idle' && (
            <div className="bg-violet-950/60 border border-violet-700/50 rounded-xl p-4 flex items-center gap-3 animate-pulse">
              <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-white">Processing Session</div>
                <div className="text-violet-300">{statusMessage}</div>
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#100724] to-[#160d33] border-t border-violet-800/30 flex items-center justify-between gap-4">
          {savedRecord ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-violet-400/80">
                Stored locally in IndexedDB (7-day retention). No Gemini API call made.
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-violet-700/40 hover:bg-violet-900/30 text-violet-300 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateToTranscripts) {
                      onNavigateToTranscripts();
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg flex items-center gap-2 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Open in Transcripts</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-[11px] text-violet-400/80">
                <span>Powered by AssemblyAI Speech-to-Text • Local 7-Day Storage</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={processingState !== 'idle'}
                  className="px-4 py-2.5 rounded-xl border border-violet-700/40 hover:bg-violet-900/30 text-violet-300 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  id="process-meeting-btn"
                  onClick={handleTranscribeAndSave}
                  disabled={
                    processingState !== 'idle' ||
                    isRecording ||
                    (inputMode === 'record' && !recordedAudioBlob && !liveTranscript.trim()) ||
                    (inputMode === 'upload' && !uploadedFile) ||
                    (inputMode === 'text' && !manualTranscriptText.trim())
                  }
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-950/60 flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4 text-violet-200" />
                  <span>Transcribe & Save Raw Transcript</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
