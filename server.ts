import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { store, hashPassword, verifyPassword, DBSession, DBTask } from './server/db';

const app = express();
const PORT = 3000;

// Configure body parser limit for audio base64 uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initialization of Gemini client (server-side only)
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Helper to authenticate request
interface AuthenticatedRequest extends Request {
  session?: DBSession;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: missing token' });
    return;
  }
  const token = authHeader.substring(7).trim();
  const session = store.getSession(token);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized: invalid or expired session' });
    return;
  }
  req.session = session;
  next();
}

function managerOnly(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.session || req.session.role !== 'Manager') {
    res.status(403).json({ error: 'Forbidden: manager access required' });
    return;
  }
  next();
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Manager Registration
app.post('/api/auth/register-manager', (req, res) => {
  try {
    const { companyName, companyEmail, managerName, managerId, password, confirmPassword } = req.body;

    if (!companyName || !companyEmail || !managerName || !managerId || !password || !confirmPassword) {
      res.status(400).json({ error: 'Please complete all required fields.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(companyEmail)) {
      res.status(400).json({ error: 'Invalid company email address format.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    if (password.length < 4) {
      res.status(400).json({ error: 'Password must be at least 4 characters.' });
      return;
    }

    // Check if company already exists
    let company = store.findCompanyByEmail(companyEmail);
    if (!company) {
      company = store.createCompany(companyName, companyEmail);
    }

    // Check if manager ID already exists in this company
    const existingManager = store.findManagerByManagerId(company.id, managerId);
    if (existingManager) {
      res.status(400).json({ error: 'An account with these details already exists.' });
      return;
    }

    const passwordHash = hashPassword(password);
    store.createManager({
      managerId,
      managerName,
      companyId: company.id,
      companyEmail: company.email,
      passwordHash,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Login (Manager or Employee)
app.post('/api/auth/login', (req, res) => {
  try {
    const { companyEmail, userType, userId, password } = req.body;

    if (!companyEmail || !userType || !userId || !password) {
      res.status(400).json({ error: 'Please complete all required fields.' });
      return;
    }

    const company = store.findCompanyByEmail(companyEmail);
    if (!company) {
      res.status(401).json({ error: 'User not found or incorrect credentials.' });
      return;
    }

    if (userType === 'Manager') {
      const manager = store.findManagerByManagerId(company.id, userId);
      if (!manager) {
        res.status(401).json({ error: 'User not found or incorrect credentials.' });
        return;
      }

      const isValid = verifyPassword(password, manager.passwordHash);
      if (!isValid) {
        res.status(401).json({ error: 'User not found or incorrect credentials.' });
        return;
      }

      const token = crypto.randomBytes(32).toString('hex');
      store.createSession(token, manager.id, 'Manager', company.id);

      res.json({
        token,
        user: {
          id: manager.id,
          role: 'Manager',
          name: manager.managerName,
          userId: manager.managerId,
          companyId: company.id,
          companyName: company.name,
          companyEmail: company.email,
        },
      });
      return;
    } else if (userType === 'Employee') {
      const employee = store.findEmployeeById(company.id, userId);
      if (!employee) {
        res.status(401).json({ error: 'User not found or incorrect credentials.' });
        return;
      }

      const isValid = verifyPassword(password, employee.passwordHash);
      if (!isValid) {
        res.status(401).json({ error: 'User not found or incorrect credentials.' });
        return;
      }

      // Mark status as ACTIVE on login
      store.updateEmployeeStatus(employee.id, 'ACTIVE');

      const token = crypto.randomBytes(32).toString('hex');
      store.createSession(token, employee.id, 'Employee', company.id, employee.employeeId);

      res.json({
        token,
        user: {
          id: employee.id,
          role: 'Employee',
          name: employee.employeeName,
          userId: employee.employeeId,
          post: employee.employeePost,
          companyId: company.id,
          companyName: company.name,
          companyEmail: company.email,
          status: 'ACTIVE',
        },
      });
      return;
    } else {
      res.status(400).json({ error: 'Invalid user type selected.' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Logout
app.post('/api/auth/logout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = req.session!;
    if (session.role === 'Employee') {
      store.updateEmployeeStatus(session.userId, 'INACTIVE');
    }
    store.deleteSession(session.token);
    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Failed to process logout.' });
  }
});

// Current User profile verification
app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const session = req.session!;
  const company = store.findCompanyById(session.companyId);
  if (!company) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }

  if (session.role === 'Manager') {
    const manager = store.findManagerById(session.userId);
    if (!manager) {
      res.status(404).json({ error: 'Manager record not found' });
      return;
    }
    res.json({
      user: {
        id: manager.id,
        role: 'Manager',
        name: manager.managerName,
        userId: manager.managerId,
        companyId: company.id,
        companyName: company.name,
        companyEmail: company.email,
      },
    });
  } else {
    const employee = store.findEmployeeByDbId(session.userId);
    if (!employee) {
      res.status(404).json({ error: 'Employee record not found' });
      return;
    }
    res.json({
      user: {
        id: employee.id,
        role: 'Employee',
        name: employee.employeeName,
        userId: employee.employeeId,
        post: employee.employeePost,
        companyId: company.id,
        companyName: company.name,
        companyEmail: company.email,
        status: employee.status,
      },
    });
  }
});

// -------------------------------------------------------------
// Employees Management (Manager Only)
// -------------------------------------------------------------

app.get('/api/employees', authMiddleware, managerOnly, (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.session!.companyId;
  const employees = store.getEmployees(companyId);
  const tasks = store.getTasks(companyId);

  // Return employees with assigned task count, omitting passwordHash
  const safeEmployees = employees.map((emp) => {
    const empTasks = tasks.filter((t) => t.employeeId.toLowerCase() === emp.employeeId.toLowerCase());
    return {
      id: emp.id,
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      employeePost: emp.employeePost,
      companyId: emp.companyId,
      role: emp.role,
      status: emp.status,
      createdAt: emp.createdAt,
      lastLogin: emp.lastLogin,
      assignedTasksCount: empTasks.length,
    };
  });

  res.json({ employees: safeEmployees });
});

app.post('/api/employees', authMiddleware, managerOnly, (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.session!.companyId;
    const { employeeName, employeeId, employeePost, password } = req.body;

    if (!employeeName || !employeeId || !password) {
      res.status(400).json({ error: 'Please complete all required fields.' });
      return;
    }

    const existing = store.findEmployeeById(companyId, employeeId);
    if (existing) {
      res.status(400).json({ error: 'This employee ID is already registered in your company.' });
      return;
    }

    const passwordHash = hashPassword(password);
    const newEmp = store.createEmployee({
      employeeId,
      employeeName,
      employeePost: employeePost || 'Team Member',
      companyId,
      passwordHash,
    });

    res.status(201).json({
      employee: {
        id: newEmp.id,
        employeeId: newEmp.employeeId,
        employeeName: newEmp.employeeName,
        employeePost: newEmp.employeePost,
        companyId: newEmp.companyId,
        role: newEmp.role,
        status: newEmp.status,
        createdAt: newEmp.createdAt,
        assignedTasksCount: 0,
      },
    });
  } catch (err) {
    console.error('Create employee error:', err);
    res.status(500).json({ error: 'Failed to create employee.' });
  }
});

app.delete('/api/employees/:employeeId', authMiddleware, managerOnly, (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.session!.companyId;
  const { employeeId } = req.params;
  const success = store.deleteEmployee(companyId, employeeId);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Employee not found.' });
  }
});

// -------------------------------------------------------------
// Tasks Management
// -------------------------------------------------------------

app.get('/api/tasks', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const session = req.session!;
  if (session.role === 'Manager') {
    const tasks = store.getTasks(session.companyId);
    res.json({ tasks });
  } else {
    // Employee gets only their assigned tasks
    const tasks = store.getTasks(session.companyId, session.employeeId);
    res.json({ tasks });
  }
});

app.post('/api/tasks', authMiddleware, managerOnly, (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.session!.companyId;
    const { employeeId, subject, assignedDate, deadline } = req.body;

    if (!employeeId || !subject || !assignedDate || !deadline) {
      res.status(400).json({ error: 'Please complete all required fields.' });
      return;
    }

    const emp = store.findEmployeeById(companyId, employeeId);
    if (!emp) {
      res.status(400).json({ error: 'Selected employee does not exist.' });
      return;
    }

    const task = store.createTask({
      companyId,
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      employeePost: emp.employeePost,
      subject,
      assignedDate,
      deadline,
    });

    res.status(201).json({ task });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// Bulk task creation for Manager approval workflow
app.post('/api/tasks/bulk-create', authMiddleware, managerOnly, (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = req.session!;
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      res.status(400).json({ error: 'Please provide at least one task to create.' });
      return;
    }

    const createdTasks: DBTask[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const t of tasks) {
      if (!t.employeeId || !t.subject || !t.deadline) {
        continue;
      }

      const emp = store.findEmployeeById(session.companyId, t.employeeId);
      if (!emp) {
        continue;
      }

      const newTask = store.createTask({
        companyId: session.companyId,
        employeeId: emp.employeeId,
        employeeName: emp.employeeName,
        employeePost: emp.employeePost,
        subject: t.subject.trim(),
        assignedDate: t.assignedDate || today,
        deadline: t.deadline,
      });

      createdTasks.push(newTask);
    }

    res.status(201).json({
      success: true,
      count: createdTasks.length,
      tasks: createdTasks,
    });
  } catch (err) {
    console.error('Bulk create tasks error:', err);
    res.status(500).json({ error: 'Failed to create tasks.' });
  }
});

app.patch('/api/tasks/:taskId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = req.session!;
    const { taskId } = req.params;
    const { deadline, status } = req.body;

    const existingTask = store.findTaskById(taskId);
    if (!existingTask || existingTask.companyId !== session.companyId) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    if (session.role === 'Manager') {
      // Manager can update deadline or status
      const updated = store.updateTask(taskId, session.companyId, { deadline, status });
      res.json({ task: updated });
    } else {
      // Employee can ONLY update their own task status
      if (existingTask.employeeId.toLowerCase() !== session.employeeId?.toLowerCase()) {
        res.status(403).json({ error: 'Cannot update tasks belonging to another employee.' });
        return;
      }
      if (!status || !['Pending', 'In Progress', 'Completed'].includes(status)) {
        res.status(400).json({ error: 'Invalid task status.' });
        return;
      }
      const updated = store.updateTask(taskId, session.companyId, { status });
      res.json({ task: updated });
    }
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

app.delete('/api/tasks/:taskId', authMiddleware, managerOnly, (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.session!.companyId;
  const { taskId } = req.params;
  const success = store.deleteTask(taskId, companyId);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Task not found.' });
  }
});

// -------------------------------------------------------------
// Meetings Management
// -------------------------------------------------------------

app.get('/api/meetings', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.session!.companyId;
  const meetings = store.getMeetings(companyId);
  res.json({ meetings });
});

app.post('/api/meetings', authMiddleware, managerOnly, (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.session!.companyId;
    const { title, date, time, durationMinutes } = req.body;

    if (!title || !date || !time) {
      res.status(400).json({ error: 'Please provide meeting title, date, and time.' });
      return;
    }

    const meeting = store.createMeeting({
      companyId,
      title,
      date,
      time,
      durationMinutes: Number(durationMinutes) || 30,
    });

    res.status(201).json({ meeting });
  } catch (err) {
    console.error('Create meeting error:', err);
    res.status(500).json({ error: 'Failed to schedule meeting.' });
  }
});

// -------------------------------------------------------------
// Meeting Audio Speech-to-Text (AssemblyAI)
// -------------------------------------------------------------
app.post('/api/meetings/transcribe', authMiddleware, managerOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { audioBase64, liveTranscript } = req.body;
    const apiKey = process.env.ASSEMBLYAI_API_KEY;

    // If client supplied live transcribed text from Web Speech API
    if (liveTranscript && liveTranscript.trim().length > 0 && !audioBase64) {
      res.json({
        success: true,
        transcriptText: liveTranscript.trim(),
        speakers: [{ speaker: 'Speaker 1', text: liveTranscript.trim() }],
        isLiveTranscript: true,
      });
      return;
    }

    if (!apiKey) {
      // If live transcript was sent along with audio, use it
      if (liveTranscript && liveTranscript.trim().length > 0) {
        res.json({
          success: true,
          transcriptText: liveTranscript.trim(),
          speakers: [{ speaker: 'Speaker 1', text: liveTranscript.trim() }],
          isLiveTranscript: true,
          apiKeyNotice: 'Captured via browser speech recognition. Configure ASSEMBLYAI_API_KEY in Settings > Secrets for speaker diarization.',
        });
        return;
      }

      res.status(400).json({
        error: 'AssemblyAI API key is required for cloud audio transcription. Please configure ASSEMBLYAI_API_KEY in Settings > Secrets, or use browser speech capture.',
        apiKeyMissing: true,
      });
      return;
    }

    if (!audioBase64) {
      res.status(400).json({ error: 'No audio data provided.' });
      return;
    }

    // Convert base64 audio to binary Buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Step 1: Upload audio file to AssemblyAI
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'content-type': 'application/octet-stream',
      },
      body: audioBuffer,
    });

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      console.error('AssemblyAI upload failed:', uploadRes.status, errBody);
      res.status(502).json({ error: `AssemblyAI upload failed: ${errBody}` });
      return;
    }

    const uploadData = (await uploadRes.json()) as { upload_url: string };
    const uploadUrl = uploadData.upload_url;

    // Step 2: Request transcript with speaker diarization
    const transcriptReqRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: uploadUrl,
        speaker_labels: true,
        punctuate: true,
        format_text: true,
      }),
    });

    if (!transcriptReqRes.ok) {
      const errBody = await transcriptReqRes.text();
      console.error('AssemblyAI transcription request failed:', transcriptReqRes.status, errBody);
      res.status(502).json({ error: `AssemblyAI transcription request failed: ${errBody}` });
      return;
    }

    const initData = (await transcriptReqRes.json()) as { id: string; status: string };
    const transcriptId = initData.id;

    // Step 3: Poll for completion
    let finalData: any = null;
    const maxPollAttempts = 40; // up to ~80 seconds
    for (let i = 0; i < maxPollAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { authorization: apiKey },
      });

      if (!pollRes.ok) continue;

      const current = (await pollRes.json()) as {
        status: string;
        text?: string;
        utterances?: any[];
        error?: string;
        audio_duration?: number;
      };

      if (current.status === 'completed') {
        finalData = current;
        break;
      } else if (current.status === 'error') {
        res.status(500).json({ error: `AssemblyAI transcription error: ${current.error || 'Unknown error'}` });
        return;
      }
    }

    if (!finalData) {
      res.status(504).json({ error: 'Transcription processing timed out. Please try with a shorter audio segment.' });
      return;
    }

    const utterances = (finalData.utterances || []).map((u: any) => ({
      speaker: u.speaker ? `Speaker ${u.speaker}` : 'Speaker',
      text: u.text,
      start: u.start,
      end: u.end,
    }));

    res.json({
      success: true,
      transcriptText: finalData.text || '',
      speakers: utterances.length > 0 ? utterances : [{ speaker: 'Speaker 1', text: finalData.text || '' }],
      durationSeconds: Math.round(finalData.audio_duration || 0),
    });
  } catch (err) {
    console.error('Transcription endpoint error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Transcription processing failed' });
  }
});

// -------------------------------------------------------------
// AI Transcript Analysis & Task Extraction (Gemini)
// -------------------------------------------------------------
app.post('/api/meetings/analyze-transcript', authMiddleware, managerOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = req.session!;
    const { meetingTitle, meetingDate, transcriptText } = req.body;

    if (!transcriptText || transcriptText.trim().length === 0) {
      res.status(400).json({ error: 'Please provide transcript text to analyze.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(500).json({ error: 'Gemini API client is not configured. Please ensure GEMINI_API_KEY is available.' });
      return;
    }

    // Retrieve company's real registered employees (ONLY id, name, post - NEVER passwords or credentials)
    const employees = store.getEmployees(session.companyId);
    const employeeRoster = employees.map((e) => ({
      employeeId: e.employeeId,
      employeeName: e.employeeName,
      employeePost: e.employeePost,
    }));

    const dateContext = meetingDate || new Date().toISOString().split('T')[0];

    const prompt = `
You are MeetFlow AI, an intelligent meeting accountability assistant.
Analyze the COMPLETE raw transcript below and identify ONLY genuine actionable assignments.

Meeting Title: "${meetingTitle || 'Team Meeting'}"
Meeting Reference Date: ${dateContext}

Registered Company Employees Roster:
${JSON.stringify(employeeRoster, null, 2)}

Strict Contextual Rules for Task Extraction:
1. Genuine Actionable Assignments Only:
   - Identify ONLY real tasks, commitments, deliverables, or action items agreed upon in the meeting.
   - Mere name mentions or statements of attendance MUST NOT become tasks!
     Example: "Rahul will join the meeting" or "Rahul is on call" -> THIS IS NOT A TASK. DO NOT CREATE A TASK.
     Example: "Rahul, please finish the website homepage by Friday" -> THIS IS A REAL TASK. Create it.
2. Separate Tasks:
   - If one employee receives multiple tasks, KEEP THEM AS SEPARATE TASKS. Never combine or merge them into one.
3. Assignee Matching:
   - Match against the Registered Company Employees Roster by name or role.
   - If matched, provide their exact employeeId, employeeName, and employeePost from the roster.
   - If the task owner is uncertain, ambiguous, or unassigned:
     Set employeeName: "Not Assigned", employeeId: "-", employeePost: "-".
     NEVER invent or fabricate employee IDs.
4. Dates:
   - Assigned Date: Default to the Meeting Reference Date (${dateContext}) unless the transcript explicitly states another assigned date.
   - Deadline: Resolve dates relative to the Meeting Reference Date (${dateContext}). E.g., if the transcript says "by Friday" or "by tomorrow", calculate the exact YYYY-MM-DD.
   - If the transcript does NOT contain a clear deadline or target date, set suggestedDeadline: "Not Assigned". NEVER invent deadlines.
5. Executive Overview:
   - Provide an accurate, high-level meeting summary and 3-6 key discussion points.

Complete Raw Transcript:
"""
${transcriptText}
"""
`;

    // Try models with fallback to handle temporary 503 service spikes gracefully
    const modelsToTry = ['gemini-2.5-flash', 'gemini-3.8-flash'];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              'You are MeetFlow AI. You extract structured task suggestions from transcripts for human manager review. AI SUGGESTS ONLY. Never invent information or deadlines.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                meetingSummary: {
                  type: Type.STRING,
                  description: 'Executive overview of the meeting and key outcomes',
                },
                keyDiscussionPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Key discussion topics or conclusions',
                },
                actionItems: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      subject: { type: Type.STRING, description: 'Clear action-oriented task subject' },
                      description: { type: Type.STRING, description: 'Task deliverables and context' },
                      suggestedEmployeeName: { type: Type.STRING, description: 'Matched employee name or "Not Assigned"' },
                      suggestedEmployeeId: { type: Type.STRING, description: 'Matched employee ID from roster or "-"' },
                      suggestedEmployeePost: { type: Type.STRING, description: 'Matched employee post or "-"' },
                      assignedDate: { type: Type.STRING, description: 'YYYY-MM-DD assigned date, defaults to meeting date' },
                      suggestedDeadline: { type: Type.STRING, description: 'Resolved YYYY-MM-DD deadline or "Not Assigned"' },
                      priority: { type: Type.STRING, description: 'High, Medium, or Low' },
                      confidence: { type: Type.INTEGER, description: 'Confidence score from 0 to 100' },
                      transcriptQuote: { type: Type.STRING, description: 'Exact quote from transcript justifying this task' },
                    },
                    required: ['subject', 'description', 'suggestedEmployeeName', 'suggestedEmployeeId', 'suggestedDeadline', 'priority'],
                  },
                },
              },
              required: ['meetingSummary', 'keyDiscussionPoints', 'actionItems'],
            },
          },
        });
        if (response) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} call failed, trying next:`, err?.message || err);
      }
    }

    if (!response) {
      throw lastError || new Error('All AI models are currently busy. Please try again in a few moments.');
    }

    const rawJson = response.text ? response.text.trim() : '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      parsed = { meetingSummary: response.text || '', keyDiscussionPoints: [], actionItems: [] };
    }

    // Format action items with unique IDs, employee matching, and default selection
    const formattedActionItems = (parsed.actionItems || []).map((item: any, idx: number) => {
      let empId = item.suggestedEmployeeId || '-';
      let empName = item.suggestedEmployeeName || 'Not Assigned';
      let empPost = item.suggestedEmployeePost || '-';

      // Look up against roster to guarantee consistency
      if (empId && empId !== '-') {
        const found = employees.find((e) => e.employeeId.toLowerCase() === empId.toLowerCase());
        if (found) {
          empId = found.employeeId;
          empName = found.employeeName;
          empPost = found.employeePost;
        }
      } else if (empName && empName !== 'Not Assigned') {
        const found = employees.find((e) => e.employeeName.toLowerCase().includes(empName.toLowerCase()));
        if (found) {
          empId = found.employeeId;
          empName = found.employeeName;
          empPost = found.employeePost;
        }
      }

      return {
        id: `ai_task_${Date.now()}_${idx}`,
        subject: item.subject || 'Follow-up Action',
        description: item.description || '',
        suggestedEmployeeId: empId,
        suggestedEmployeeName: empName,
        suggestedEmployeePost: empPost,
        assignedDate: item.assignedDate || dateContext,
        suggestedDeadline: item.suggestedDeadline || 'Not Assigned',
        priority: item.priority === 'High' || item.priority === 'Medium' || item.priority === 'Low' ? item.priority : 'Medium',
        confidence: typeof item.confidence === 'number' ? item.confidence : 85,
        transcriptQuote: item.transcriptQuote || '',
        selected: true,
      };
    });

    res.json({
      success: true,
      meetingSummary: parsed.meetingSummary || 'Meeting review completed.',
      keyDiscussionPoints: parsed.keyDiscussionPoints || [],
      actionItems: formattedActionItems,
    });
  } catch (err) {
    console.error('Analyze transcript error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'AI transcript analysis failed' });
  }
});

// -------------------------------------------------------------
// Alerts Management
// -------------------------------------------------------------

app.get('/api/alerts', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const session = req.session!;
  const alerts = store.computeAlerts(
    session.companyId,
    session.role,
    session.role === 'Employee' ? session.employeeId : undefined
  );
  res.json({ alerts });
});

app.post('/api/alerts/:alertId/read', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { alertId } = req.params;
  store.markAlertRead(alertId);
  res.json({ success: true });
});

// -------------------------------------------------------------
// Dashboard Statistics
// -------------------------------------------------------------

app.get('/api/stats', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const session = req.session!;
  const companyId = session.companyId;

  if (session.role === 'Manager') {
    const employees = store.getEmployees(companyId);
    const tasks = store.getTasks(companyId);
    const meetings = store.getMeetings(companyId);

    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const overdueTasks = tasks.filter((t) => t.status === 'Overdue').length;

    // Upcoming meeting: soonest meeting on or after today
    const today = new Date().toISOString().split('T')[0];
    const upcomingMeetings = meetings
      .filter((m) => m.date >= today)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const upcomingMeeting = upcomingMeetings[0] || null;

    // Employee workload: number of tasks per employee
    const workload = employees.map((emp) => {
      const count = tasks.filter((t) => t.employeeId.toLowerCase() === emp.employeeId.toLowerCase()).length;
      return {
        employeeId: emp.employeeId,
        employeeName: emp.employeeName,
        taskCount: count,
      };
    });

    // Meeting distribution (pie chart)
    const meetingDistribution = meetings.map((m) => ({
      name: m.title,
      durationMinutes: m.durationMinutes,
    }));

    // Recent tasks (latest 3)
    const recentTasks = tasks.slice(0, 3);

    res.json({
      totalEmployees: employees.length,
      taskStats: {
        total: totalTasks,
        pending: pendingTasks,
        completed: completedTasks,
        overdue: overdueTasks,
      },
      upcomingMeeting,
      workload,
      meetingDistribution,
      recentTasks,
    });
  } else {
    // Employee stats: personal tasks only
    const myTasks = store.getTasks(companyId, session.employeeId);
    const total = myTasks.length;
    const pending = myTasks.filter((t) => t.status === 'Pending').length;
    const completed = myTasks.filter((t) => t.status === 'Completed').length;
    const overdue = myTasks.filter((t) => t.status === 'Overdue').length;

    res.json({
      taskStats: {
        total,
        pending,
        completed,
        overdue,
      },
      recentTasks: myTasks.slice(0, 3),
    });
  }
});

// -------------------------------------------------------------
// Vite Server Integration
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MeetFlow server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
