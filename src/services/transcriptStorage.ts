/**
 * MeetFlow Local Transcript Storage Engine
 * Utilizes client-side IndexedDB for local data sovereignty.
 * Enforces strict 7-Day Auto-Expiration policy as specified.
 */

import { TranscriptRecord, TranscriptAIStatus, AITaskSuggestion } from '../types';

const DB_NAME = 'meetflow_transcripts_db';
const DB_VERSION = 1;
const STORE_NAME = 'transcripts';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('companyId', 'companyId', { unique: false });
        store.createIndex('expirationAt', 'expirationAt', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

export const transcriptStorage = {
  /**
   * Save a newly transcribed meeting immediately to local IndexedDB.
   * Default state: aiAnalyzed = false, aiStatus = 'NOT_AI_ANALYZED'.
   * Sets strict 7-day expiration timestamp from createdAt.
   * NEVER requires or runs Gemini.
   */
  async saveTranscript(
    data: {
      id?: string;
      meetingId?: string;
      companyId: string;
      meetingTitle: string;
      meetingDate?: string;
      rawTranscript: string;
      durationSeconds?: number;
      speakers?: any[];
    }
  ): Promise<TranscriptRecord> {
    const db = await openDB();
    const id = data.id || `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const createdAt = nowIso;
    const meetingDate = data.meetingDate || nowIso.split('T')[0];
    const expirationAt = new Date(Date.now() + SEVEN_DAYS_MS).toISOString();

    const record: TranscriptRecord = {
      id,
      transcriptId: id,
      meetingId: data.meetingId,
      companyId: data.companyId,
      meetingTitle: data.meetingTitle,
      meetingDate,
      createdAt,
      recordedAt: createdAt,
      expirationAt,
      expiresAt: expirationAt,
      rawTranscript: data.rawTranscript,
      transcriptText: data.rawTranscript,
      durationSeconds: data.durationSeconds || 0,
      speakers: data.speakers || [],
      audioMetadata: {
        durationSeconds: data.durationSeconds || 0,
        speakers: data.speakers || [],
      },
      aiAnalyzed: false,
      aiStatus: 'NOT_AI_ANALYZED',
      status: 'pending_review',
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putRequest = store.put(record);

      putRequest.onsuccess = () => resolve(record);
      putRequest.onerror = () => reject(putRequest.error || new Error('Failed to save raw transcript to IndexedDB'));
    });
  },

  /**
   * Retrieve all unexpired transcripts for the specified company.
   * Automatically executes purge on expired records older than 7 days.
   */
  async getTranscripts(companyId?: string): Promise<TranscriptRecord[]> {
    const db = await openDB();
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const all: any[] = getAllRequest.result || [];
        const valid: TranscriptRecord[] = [];
        const expiredIds: string[] = [];

        for (const item of all) {
          const expiryIso = item.expirationAt || item.expiresAt;
          const itemExpiry = expiryIso ? new Date(expiryIso).getTime() : 0;

          if (itemExpiry > 0 && itemExpiry <= now) {
            expiredIds.push(item.id);
          } else if (!companyId || !item.companyId || item.companyId === companyId || item.companyId === 'current') {
            // Normalize record structure
            const normalized: TranscriptRecord = {
              ...item,
              rawTranscript: item.rawTranscript || item.transcriptText || '',
              transcriptText: item.transcriptText || item.rawTranscript || '',
              expirationAt: expiryIso || new Date(Date.now() + SEVEN_DAYS_MS).toISOString(),
              expiresAt: expiryIso || new Date(Date.now() + SEVEN_DAYS_MS).toISOString(),
              createdAt: item.createdAt || item.recordedAt || new Date().toISOString(),
              meetingDate: item.meetingDate || (item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
              aiAnalyzed: Boolean(item.aiAnalyzed),
              aiStatus: item.aiStatus || (item.aiAnalyzed ? 'AI_ANALYZED' : 'NOT_AI_ANALYZED'),
            };
            valid.push(normalized);
          }
        }

        // Clean up expired records in the background
        if (expiredIds.length > 0) {
          for (const expId of expiredIds) {
            store.delete(expId);
          }
        }

        // Sort newest first
        valid.sort((a, b) => {
          const timeA = new Date(a.createdAt || a.recordedAt || 0).getTime();
          const timeB = new Date(b.createdAt || b.recordedAt || 0).getTime();
          return timeB - timeA;
        });

        resolve(valid);
      };

      getAllRequest.onerror = () => reject(getAllRequest.error || new Error('Failed to fetch transcripts'));
    });
  },

  /**
   * Get a single transcript by ID if not expired.
   */
  async getTranscriptById(id: string): Promise<TranscriptRecord | null> {
    const db = await openDB();
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item: any = getReq.result;
        if (!item) {
          resolve(null);
          return;
        }

        const expiryIso = item.expirationAt || item.expiresAt;
        if (expiryIso && new Date(expiryIso).getTime() <= now) {
          // Delete expired record
          store.delete(id);
          resolve(null);
          return;
        }

        const normalized: TranscriptRecord = {
          ...item,
          rawTranscript: item.rawTranscript || item.transcriptText || '',
          transcriptText: item.transcriptText || item.rawTranscript || '',
          expirationAt: expiryIso || new Date(Date.now() + SEVEN_DAYS_MS).toISOString(),
          expiresAt: expiryIso || new Date(Date.now() + SEVEN_DAYS_MS).toISOString(),
          createdAt: item.createdAt || item.recordedAt || new Date().toISOString(),
          meetingDate: item.meetingDate || (item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
          aiAnalyzed: Boolean(item.aiAnalyzed),
          aiStatus: item.aiStatus || (item.aiAnalyzed ? 'AI_ANALYZED' : 'NOT_AI_ANALYZED'),
        };

        resolve(normalized);
      };

      getReq.onerror = () => reject(getReq.error || new Error('Failed to get transcript'));
    });
  },

  /**
   * Update AI Analysis results separately without altering rawTranscript or expirationAt.
   */
  async saveAIAnalysis(
    id: string,
    analysis: {
      meetingSummary: string;
      keyDiscussionPoints: string[];
      actionItems: AITaskSuggestion[];
    }
  ): Promise<TranscriptRecord | null> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const existing: any = getReq.result;
        if (!existing) {
          resolve(null);
          return;
        }

        // CRITICAL: Preserve rawTranscript and original expirationAt!
        const updated: TranscriptRecord = {
          ...existing,
          aiAnalyzed: true,
          aiAnalyzedAt: new Date().toISOString(),
          aiStatus: 'AI_ANALYZED',
          aiSummary: analysis.meetingSummary,
          aiKeyPoints: analysis.keyDiscussionPoints,
          aiTasks: analysis.actionItems,
          // Backward compatibility fields
          summary: analysis.meetingSummary,
          keyPoints: analysis.keyDiscussionPoints,
          actionItems: analysis.actionItems,
          // Maintain originals
          rawTranscript: existing.rawTranscript || existing.transcriptText,
          transcriptText: existing.transcriptText || existing.rawTranscript,
          expirationAt: existing.expirationAt || existing.expiresAt,
          expiresAt: existing.expiresAt || existing.expirationAt,
          createdAt: existing.createdAt || existing.recordedAt,
        };

        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error || new Error('Failed to save AI analysis to IndexedDB'));
      };

      getReq.onerror = () => reject(getReq.error || new Error('Failed to locate transcript'));
    });
  },

  /**
   * Mark AI Analysis status (e.g. AI_ANALYZING or AI_ANALYSIS_FAILED) without touching raw transcript.
   */
  async setAIStatus(id: string, aiStatus: TranscriptAIStatus): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const existing: any = getReq.result;
        if (!existing) {
          resolve();
          return;
        }

        const updated = {
          ...existing,
          aiStatus,
        };

        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  },

  /**
   * General field updates (e.g. marking approved tasks count)
   */
  async updateTranscript(id: string, updates: Partial<TranscriptRecord>): Promise<TranscriptRecord | null> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const existing: any = getReq.result;
        if (!existing) {
          resolve(null);
          return;
        }

        const updated: TranscriptRecord = {
          ...existing,
          ...updates,
          id: existing.id,
          companyId: existing.companyId,
          // CRITICAL: expirationAt is NOT reset!
          expirationAt: existing.expirationAt || existing.expiresAt,
          expiresAt: existing.expiresAt || existing.expirationAt,
          rawTranscript: existing.rawTranscript || existing.transcriptText,
        };

        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error || new Error('Failed to update transcript'));
      };

      getReq.onerror = () => reject(getReq.error || new Error('Failed to locate transcript'));
    });
  },

  /**
   * Delete a transcript by ID manually
   */
  async deleteTranscript(id: string): Promise<boolean> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const delReq = store.delete(id);

      delReq.onsuccess = () => resolve(true);
      delReq.onerror = () => reject(delReq.error || new Error('Failed to delete transcript'));
    });
  },

  /**
   * Calculate human-readable time remaining before 7-day auto-purge
   */
  formatTimeRemaining(expirationAt: string): { text: string; isUrgent: boolean; formattedDate: string } {
    const expDate = new Date(expirationAt);
    const formattedDate = !isNaN(expDate.getTime())
      ? expDate.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'in 7 days';

    const msRemaining = expDate.getTime() - Date.now();
    if (msRemaining <= 0) {
      return { text: 'Expired', isUrgent: true, formattedDate };
    }

    const totalHours = Math.floor(msRemaining / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    if (days > 0) {
      return {
        text: `Expires in ${days}d ${hours}h`,
        isUrgent: days <= 1,
        formattedDate,
      };
    }

    const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
    return {
      text: `Expires in ${hours}h ${minutes}m`,
      isUrgent: true,
      formattedDate,
    };
  },
};
