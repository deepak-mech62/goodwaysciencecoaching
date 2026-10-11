import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'goodway-science-portal-super-secret-key-2026-secure-token';
const SIGNED_URL_SECRET = process.env.SIGNED_URL_SECRET || 'goodway-signed-url-secret-hash-salt-9988';

// Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// --- Security & Cryptography Utilities ---
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 100000, 64, 'sha256').toString('hex');
  return { hash, salt: actualSalt };
}

function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  const { hash } = hashPassword(password, storedSalt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

interface JwtPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher';
  rollNo: string;
  classGrade?: string;
  exp: number;
}

function createJwt(payload: Omit<JwtPayload, 'exp'>, expiresInSeconds = 86400): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as JwtPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// Signed URL helper for private storage
function generateSignedFileUrl(noteId: string, userId: string, expiresInSeconds = 900): { signedUrl: string; expiresAt: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const dataToSign = `${noteId}:${userId}:${expiresAt}`;
  const sig = crypto.createHmac('sha256', SIGNED_URL_SECRET).update(dataToSign).digest('hex');
  const signedUrl = `/api/storage/secure-file/${noteId}?u=${encodeURIComponent(userId)}&exp=${expiresAt}&sig=${sig}`;
  return { signedUrl, expiresAt };
}

function verifySignedUrl(noteId: string, userId: string, expiresAtStr: string, sig: string): boolean {
  try {
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
      return false;
    }
    const dataToSign = `${noteId}:${userId}:${expiresAt}`;
    const expectedSig = crypto.createHmac('sha256', SIGNED_URL_SECRET).update(dataToSign).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'));
  } catch {
    return false;
  }
}

// --- Brute Force & Rate Limiting Engine ---
interface FailedAttemptInfo {
  count: number;
  firstFailedAt: number;
  lockedUntil: number | null;
}

const loginAttemptsMap = new Map<string, FailedAttemptInfo>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const WINDOW_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(key: string): { isLocked: boolean; remainingSeconds: number; attemptsRemaining: number } {
  const now = Date.now();
  const record = loginAttemptsMap.get(key);

  if (!record) {
    return { isLocked: false, remainingSeconds: 0, attemptsRemaining: MAX_FAILED_ATTEMPTS };
  }

  // Check if locked
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLocked: true, remainingSeconds, attemptsRemaining: 0 };
  }

  // Reset if window passed
  if (now - record.firstFailedAt > WINDOW_DURATION_MS) {
    loginAttemptsMap.delete(key);
    return { isLocked: false, remainingSeconds: 0, attemptsRemaining: MAX_FAILED_ATTEMPTS };
  }

  return {
    isLocked: false,
    remainingSeconds: 0,
    attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - record.count),
  };
}

function recordFailedAttempt(key: string): { isNowLocked: boolean; remainingSeconds: number; attemptsRemaining: number } {
  const now = Date.now();
  const record = loginAttemptsMap.get(key) || { count: 0, firstFailedAt: now, lockedUntil: null };

  // Reset if window passed
  if (now - record.firstFailedAt > WINDOW_DURATION_MS) {
    record.count = 0;
    record.firstFailedAt = now;
    record.lockedUntil = null;
  }

  record.count += 1;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    loginAttemptsMap.set(key, record);
    return {
      isNowLocked: true,
      remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      attemptsRemaining: 0,
    };
  }

  loginAttemptsMap.set(key, record);
  return {
    isNowLocked: false,
    remainingSeconds: 0,
    attemptsRemaining: MAX_FAILED_ATTEMPTS - record.count,
  };
}

function clearRateLimit(key: string) {
  loginAttemptsMap.delete(key);
}

// --- Security Audit Logger ---
interface AuditLog {
  id: string;
  timestamp: string;
  eventType: string;
  userEmailOrId: string;
  role?: string;
  ipAddress: string;
  details: string;
  status: 'info' | 'warning' | 'critical';
}

const auditLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    eventType: 'SYSTEM_BOOT',
    userEmailOrId: 'system',
    role: 'system',
    ipAddress: '127.0.0.1',
    details: 'Goodway Science Coaching Portal security engine initialized with RBAC and private storage.',
    status: 'info',
  }
];

function logSecurityEvent(
  eventType: string,
  userEmailOrId: string,
  ipAddress: string,
  details: string,
  status: 'info' | 'warning' | 'critical' = 'info',
  role?: string
) {
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    eventType,
    userEmailOrId,
    role,
    ipAddress,
    details,
    status,
  };
  auditLogs.unshift(log);
  if (auditLogs.length > 200) auditLogs.pop();
}

// --- In-Memory Database Seed ---
interface DbUser {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  passwordHash: string;
  passwordSalt: string;
  role: 'student' | 'teacher';
  classGrade?: '9' | '10' | '11' | '12';
  isActive: boolean;
  phone?: string;
  enrolledSubjects: ('Physics' | 'Chemistry' | 'Biology' | 'Mathematics')[];
  joinedDate: string;
  lastActive: string;
  notesDownloadedCount: number;
}

const usersDb: DbUser[] = [
  // Director & Head of Faculty: Alok Singh (M.Sc. Mathematics)
  (() => {
    const { hash, salt } = hashPassword('Admin@GoodWay2026!');
    return {
      id: 'teacher-1',
      name: 'Alok Singh (Director - M.Sc. Math)',
      email: 'alok.singh@goodway.edu',
      rollNo: 'DIR-01',
      passwordHash: hash,
      passwordSalt: salt,
      role: 'teacher' as const,
      isActive: true,
      phone: '+91 98765 43210',
      enrolledSubjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
      joinedDate: '2022-01-10',
      lastActive: new Date().toISOString(),
      notesDownloadedCount: 0,
    };
  })(),
  // Teacher: Shakti Varma (B.Sc. Mathematics)
  (() => {
    const { hash, salt } = hashPassword('Admin@GoodWay2026!');
    return {
      id: 'teacher-2',
      name: 'Shakti Varma (Faculty - B.Sc. Math)',
      email: 'shakti.varma@goodway.edu',
      rollNo: 'T-102',
      passwordHash: hash,
      passwordSalt: salt,
      role: 'teacher' as const,
      isActive: true,
      phone: '+91 98765 43211',
      enrolledSubjects: ['Mathematics', 'Chemistry', 'Physics'],
      joinedDate: '2023-03-15',
      lastActive: new Date().toISOString(),
      notesDownloadedCount: 0,
    };
  })(),
  // Teacher: Amit Kumar Singh (M.Sc. Mathematics, B.Ed)
  (() => {
    const { hash, salt } = hashPassword('Admin@GoodWay2026!');
    return {
      id: 'teacher-3',
      name: 'Amit Kumar Singh (Faculty - M.Sc. Math, B.Ed)',
      email: 'amit.singh@goodway.edu',
      rollNo: 'T-103',
      passwordHash: hash,
      passwordSalt: salt,
      role: 'teacher' as const,
      isActive: true,
      phone: '+91 98765 43212',
      enrolledSubjects: ['Mathematics', 'Physics'],
      joinedDate: '2023-04-01',
      lastActive: new Date().toISOString(),
      notesDownloadedCount: 0,
    };
  })(),
  // Class 12 Student
  (() => {
    const { hash, salt } = hashPassword('Student@123');
    return {
      id: 'student-1',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@goodway.edu',
      rollNo: 'GW-12-042',
      passwordHash: hash,
      passwordSalt: salt,
      role: 'student' as const,
      classGrade: '12' as const,
      isActive: true,
      phone: '+91 98111 22334',
      enrolledSubjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
      joinedDate: '2025-04-10',
      lastActive: new Date().toISOString(),
      notesDownloadedCount: 14,
    };
  })(),
  // Class 11 Student
  (() => {
    const { hash, salt } = hashPassword('Student@123');
    return {
      id: 'student-2',
      name: 'Priya Patel',
      email: 'priya.patel@goodway.edu',
      rollNo: 'GW-11-018',
      passwordHash: hash,
      passwordSalt: salt,
      role: 'student' as const,
      classGrade: '11' as const,
      isActive: true,
      phone: '+91 98222 33445',
      enrolledSubjects: ['Physics', 'Chemistry', 'Mathematics'],
      joinedDate: '2025-05-02',
      lastActive: new Date(Date.now() - 7200000).toISOString(),
      notesDownloadedCount: 9,
    };
  })(),
  // Class 10 Student
  (() => {
    const { hash, salt } = hashPassword('Student@123');
    return {
      id: 'student-3',
      name: 'Amit Verma',
      email: 'amit.verma@goodway.edu',
      rollNo: 'GW-10-095',
      passwordHash: hash,
      passwordSalt: salt,
      role: 'student' as const,
      classGrade: '10' as const,
      isActive: true,
      phone: '+91 98333 44556',
      enrolledSubjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
      joinedDate: '2025-06-12',
      lastActive: new Date(Date.now() - 86400000).toISOString(),
      notesDownloadedCount: 6,
    };
  })(),
  // Class 9 Student
  (() => {
    const { hash, salt } = hashPassword('Student@123');
    return {
      id: 'student-4',
      name: 'Sneha Singh',
      email: 'sneha.singh@goodway.edu',
      rollNo: 'GW-09-021',
      passwordHash: hash,
      passwordSalt: salt,
      role: 'student' as const,
      classGrade: '9' as const,
      isActive: true,
      phone: '+91 98444 55667',
      enrolledSubjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
      joinedDate: '2025-07-01',
      lastActive: new Date(Date.now() - 43200000).toISOString(),
      notesDownloadedCount: 5,
    };
  })(),
  // Inactive Student (To demonstrate account deactivation RBAC)
  (() => {
    const { hash, salt } = hashPassword('Student@123');
    return {
      id: 'student-5',
      name: 'Vikram Aditya (Deactivated)',
      email: 'vikram.aditya@goodway.edu',
      rollNo: 'GW-12-088',
      passwordHash: hash,
      passwordSalt: salt,
      role: 'student' as const,
      classGrade: '12' as const,
      isActive: false, // Inactive access
      phone: '+91 98555 66778',
      enrolledSubjects: ['Physics', 'Chemistry', 'Mathematics'],
      joinedDate: '2025-03-20',
      lastActive: '2025-11-10T10:00:00.000Z',
      notesDownloadedCount: 2,
    };
  })(),
];

// --- Student Fee Database & Accounting Ledger ---
interface DbFeeReceipt {
  id: string;
  receiptNo: string;
  date: string;
  amount: number;
  paymentMode: 'UPI' | 'Cash' | 'Bank Transfer' | 'Net Banking';
  transactionRef: string;
  monthOrDescription: string;
  status: 'success' | 'pending';
  receivedBy: string;
}

interface DbStudentFee {
  studentId: string;
  studentName: string;
  rollNo: string;
  classGrade: '9' | '10' | '11' | '12';
  monthlyFee: number;
  totalAnnualFee: number;
  totalPaid: number;
  dueAmount: number;
  status: 'paid' | 'partial' | 'due';
  nextDueDate?: string;
  academicSession: string;
  paymentHistory: DbFeeReceipt[];
  feeStructure: { label: string; amount: number; frequency: string }[];
}

const studentFeesDb: Record<string, DbStudentFee> = {
  'student-1': {
    studentId: 'student-1',
    studentName: 'Rahul Sharma',
    rollNo: 'GW-12-042',
    classGrade: '12',
    monthlyFee: 1500,
    totalAnnualFee: 18000,
    totalPaid: 15000,
    dueAmount: 3000,
    status: 'partial',
    nextDueDate: '2026-09-30',
    academicSession: '2025-2026',
    feeStructure: [
      { label: 'Monthly Coaching Tuition Fee (कक्षा 12वीं)', amount: 1500, frequency: 'Per Month' },
      { label: 'Laboratory Practical & Experiment Workshops', amount: 0, frequency: 'Complimentary' },
      { label: 'Bilingual Chapter Notes & Question Bank (PDF)', amount: 0, frequency: 'Included' },
      { label: 'Weekly Sunday Test & 100-Mark Model Exam Series', amount: 0, frequency: 'Included' },
    ],
    paymentHistory: [
      {
        id: 'rec-101',
        receiptNo: 'GW-FEE-2025-012',
        date: '2025-04-12',
        amount: 6000,
        paymentMode: 'UPI',
        transactionRef: 'UPI/510349281920/PayTM',
        monthOrDescription: 'Term 1 Fee (April - July 2025)',
        status: 'success',
        receivedBy: 'Alok Singh (Director)',
      },
      {
        id: 'rec-102',
        receiptNo: 'GW-FEE-2025-078',
        date: '2025-07-15',
        amount: 4500,
        paymentMode: 'Bank Transfer',
        transactionRef: 'NEFT-BOI-884920194',
        monthOrDescription: 'Term 2 Fee (August - October 2025)',
        status: 'success',
        receivedBy: 'Office Faculty',
      },
      {
        id: 'rec-103',
        receiptNo: 'GW-FEE-2025-144',
        date: '2025-10-20',
        amount: 4500,
        paymentMode: 'Cash',
        transactionRef: 'CASH-REC-1044',
        monthOrDescription: 'Term 3 Fee (November 2025 - January 2026)',
        status: 'success',
        receivedBy: 'Shakti Varma (Faculty)',
      },
    ],
  },
  'student-2': {
    studentId: 'student-2',
    studentName: 'Priya Patel',
    rollNo: 'GW-11-018',
    classGrade: '11',
    monthlyFee: 1400,
    totalAnnualFee: 16800,
    totalPaid: 16800,
    dueAmount: 0,
    status: 'paid',
    nextDueDate: 'Session Completed (पूर्ण चुकता)',
    academicSession: '2025-2026',
    feeStructure: [
      { label: 'Monthly Coaching Tuition Fee (कक्षा 11वीं)', amount: 1400, frequency: 'Per Month' },
      { label: 'Laboratory Practical & Experiment Workshops', amount: 0, frequency: 'Complimentary' },
      { label: 'Bilingual Chapter Notes & Question Bank (PDF)', amount: 0, frequency: 'Included' },
      { label: 'Weekly Sunday Test & Practice Mock Exams', amount: 0, frequency: 'Included' },
    ],
    paymentHistory: [
      {
        id: 'rec-201',
        receiptNo: 'GW-FEE-2025-025',
        date: '2025-05-05',
        amount: 8400,
        paymentMode: 'UPI',
        transactionRef: 'UPI/512948172901/GPay',
        monthOrDescription: '1st Half-Year Course Fee (May - Oct 2025)',
        status: 'success',
        receivedBy: 'Alok Singh (Director)',
      },
      {
        id: 'rec-202',
        receiptNo: 'GW-FEE-2025-156',
        date: '2025-11-08',
        amount: 8400,
        paymentMode: 'UPI',
        transactionRef: 'UPI/531984729103/PhonePe',
        monthOrDescription: '2nd Half-Year Course Fee (Nov 2025 - Apr 2026)',
        status: 'success',
        receivedBy: 'Alok Singh (Director)',
      },
    ],
  },
  'student-3': {
    studentId: 'student-3',
    studentName: 'Amit Verma',
    rollNo: 'GW-10-095',
    classGrade: '10',
    monthlyFee: 1000,
    totalAnnualFee: 12000,
    totalPaid: 8000,
    dueAmount: 4000,
    status: 'partial',
    nextDueDate: '2026-09-25',
    academicSession: '2025-2026',
    feeStructure: [
      { label: 'Monthly Coaching Tuition Fee (कक्षा 10वीं मैट्रिक)', amount: 1000, frequency: 'Per Month' },
      { label: 'Class 10th Board Model Papers & Question Bank', amount: 0, frequency: 'Included' },
      { label: 'Sunday Test Series & Evaluation', amount: 0, frequency: 'Included' },
    ],
    paymentHistory: [
      {
        id: 'rec-301',
        receiptNo: 'GW-FEE-2025-045',
        date: '2025-06-15',
        amount: 4000,
        paymentMode: 'Cash',
        transactionRef: 'CASH-REC-1021',
        monthOrDescription: 'Term 1 Matric Coaching Fee',
        status: 'success',
        receivedBy: 'Amit Kumar Singh (Faculty)',
      },
      {
        id: 'rec-302',
        receiptNo: 'GW-FEE-2025-120',
        date: '2025-09-20',
        amount: 4000,
        paymentMode: 'UPI',
        transactionRef: 'UPI/526481920391/PayTM',
        monthOrDescription: 'Term 2 Matric Coaching & Test Series Fee',
        status: 'success',
        receivedBy: 'Alok Singh (Director)',
      },
    ],
  },
  'student-4': {
    studentId: 'student-4',
    studentName: 'Sneha Singh',
    rollNo: 'GW-09-021',
    classGrade: '9',
    monthlyFee: 900,
    totalAnnualFee: 10800,
    totalPaid: 10800,
    dueAmount: 0,
    status: 'paid',
    nextDueDate: 'Session Completed (पूर्ण चुकता)',
    academicSession: '2025-2026',
    feeStructure: [
      { label: 'Monthly Foundation Tuition Fee (कक्षा 9वीं)', amount: 900, frequency: 'Per Month' },
      { label: 'All Subjects Study Notes & Foundation Tests', amount: 0, frequency: 'Included' },
    ],
    paymentHistory: [
      {
        id: 'rec-401',
        receiptNo: 'GW-FEE-2025-060',
        date: '2025-07-05',
        amount: 5400,
        paymentMode: 'UPI',
        transactionRef: 'UPI/518920194820/GPay',
        monthOrDescription: 'Term 1 Foundation Course Fee',
        status: 'success',
        receivedBy: 'Alok Singh (Director)',
      },
      {
        id: 'rec-402',
        receiptNo: 'GW-FEE-2025-180',
        date: '2025-12-10',
        amount: 5400,
        paymentMode: 'Net Banking',
        transactionRef: 'SBI-INB-772910482',
        monthOrDescription: 'Term 2 Foundation Course Fee',
        status: 'success',
        receivedBy: 'Faculty Office',
      },
    ],
  },
  'student-5': {
    studentId: 'student-5',
    studentName: 'Vikram Aditya (Deactivated)',
    rollNo: 'GW-12-088',
    classGrade: '12',
    monthlyFee: 1500,
    totalAnnualFee: 18000,
    totalPaid: 6000,
    dueAmount: 12000,
    status: 'due',
    nextDueDate: 'Overdue (अतिदेय)',
    academicSession: '2025-2026',
    feeStructure: [
      { label: 'Monthly Coaching Tuition Fee', amount: 1500, frequency: 'Per Month' },
    ],
    paymentHistory: [
      {
        id: 'rec-501',
        receiptNo: 'GW-FEE-2025-010',
        date: '2025-04-05',
        amount: 6000,
        paymentMode: 'Cash',
        transactionRef: 'CASH-REC-1002',
        monthOrDescription: 'Initial Term Enrollment Fee',
        status: 'success',
        receivedBy: 'Alok Singh (Director)',
      },
    ],
  },
};

// Helper to get fee summary for a student
function getStudentFeeSummary(studentId: string) {
  const fee = studentFeesDb[studentId];
  if (!fee) {
    return {
      totalAnnualFee: 18000,
      totalPaid: 0,
      dueAmount: 18000,
      status: 'due' as const,
      nextDueDate: 'Pending',
    };
  }
  return {
    totalAnnualFee: fee.totalAnnualFee,
    totalPaid: fee.totalPaid,
    dueAmount: fee.dueAmount,
    status: fee.status,
    nextDueDate: fee.nextDueDate,
  };
}

// --- Private Storage Bucket for Notes & PDFs ---
interface DbNote {
  id: string;
  title: string;
  subject: 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics';
  classGrade: '9' | '10' | '11' | '12';
  chapter: string;
  description: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadCount: number;
  contentData: string; // Base64 or markdown/html formatted text for preview
}

const notesDb: DbNote[] = [
  {
    id: 'note-1',
    title: 'Wave Optics & Interference Comprehensive Notes',
    subject: 'Physics',
    classGrade: '12',
    chapter: 'Chapter 10: Wave Optics',
    description: 'Huygens Principle, Young Double Slit Experiment derivation, intensity distribution, and diffraction patterns with 15 solved numerical problems.',
    fileName: 'Class12_Physics_Wave_Optics_Goodway.pdf',
    fileSize: '2.4 MB',
    fileType: 'application/pdf',
    uploadedBy: 'Director Alok Singh (M.Sc. Math)',
    uploadedAt: '2026-03-01T09:30:00.000Z',
    downloadCount: 42,
    contentData: `# GOODWAY SCIENCE COACHING CENTER
## CLASS 12 PHYSICS: WAVE OPTICS & INTERFERENCE
**Mentorship:** Director Alok Singh (M.Sc. Mathematics)

---

### 1. Huygens' Wave Theory
- **Wavefront:** The locus of all adjacent particles oscillating in the same phase.
  - Spherical wavefront (from a point source)
  - Cylindrical wavefront (from a line source)
  - Plane wavefront (from a source at infinity)
- **Huygens' Principle:**
  1. Every point on a given wavefront acts as a fresh source of new disturbance, called secondary wavelets.
  2. The secondary wavelets spread in all directions with the speed of light in the medium.
  3. A surface touching these secondary wavelets tangentially in the forward direction gives the new wavefront at that instant.

### 2. Young's Double Slit Experiment (YDSE)
- **Path Difference:** $\\Delta x = \\frac{yd}{D}$
- **Condition for Constructive Interference (Bright Fringes):**
  $$\\Delta x = n\\lambda, \\quad y_n = \\frac{n\\lambda D}{d} \\quad (n = 0, 1, 2, \\dots)$$
- **Condition for Destructive Interference (Dark Fringes):**
  $$\\Delta x = (2n - 1)\\frac{\\lambda}{2}, \\quad y_n = \\frac{(2n - 1)\\lambda D}{2d}$$
- **Fringe Width ($\\beta$):**
  $$\\beta = \\frac{\\lambda D}{d}$$
  *Notice:* $\\beta$ is independent of $n$—all fringes have equal width!

### 3. Key High-Yield Coaching Tips for Boards & NEET/JEE
1. When the YDSE apparatus is submerged in water with refractive index $\\mu$, fringe width becomes $\\beta' = \\frac{\\beta}{\\mu}$.
2. If one slit is covered with glass slab of thickness $t$ and refractive index $\\mu$, the optical path shifts by $(\\mu - 1)t$.
3. Phase difference $\\phi = \\frac{2\\pi}{\\lambda} \\cdot \\Delta x$.

### 4. Practice Problems
- **Problem 1:** In YDSE, slits are separated by 0.28 mm and screen is at 1.4 m. The distance between the central bright fringe and the fourth bright fringe is 1.2 cm. Determine the wavelength of light used.
  - *Solution:* $y_4 = 4\\frac{\\lambda D}{d} = 1.2\\times 10^{-2}$ m $\\implies \\lambda = \\frac{1.2 \\times 10^{-2} \\times 0.28 \\times 10^{-3}}{4 \\times 1.4} = 600\\text{ nm}$.
`,
  },
  {
    id: 'note-2',
    title: 'Aldehydes, Ketones & Carboxylic Acids Formula Sheet',
    subject: 'Chemistry',
    classGrade: '12',
    chapter: 'Chapter 12: Carbonyl Compounds',
    description: 'Complete reaction mechanisms: Nucleophilic addition, Aldol condensation, Cannizzaro reaction, Tollens & Fehling test summaries.',
    fileName: 'Class12_Chemistry_Carbonyl_Notes.pdf',
    fileSize: '3.1 MB',
    fileType: 'application/pdf',
    uploadedBy: 'Teacher Shakti Varma (B.Sc. Math)',
    uploadedAt: '2026-03-03T11:15:00.000Z',
    downloadCount: 38,
    contentData: `# GOODWAY SCIENCE COACHING CENTER
## CLASS 12 CHEMISTRY: ALDEHYDES & KETONES
**Faculty:** Teacher Shakti Varma (B.Sc. Mathematics)
**Director:** Alok Singh (M.Sc. Mathematics)

---

### 1. Preparation Highlights
- **Rosenmund Reduction:**
  $$R-COCl + H_2 \\xrightarrow{\\text{Pd-BaSO}_4, \\text{quinoline}} R-CHO + HCl$$
- **Stephen Reaction:**
  $$R-CN + SnCl_2 + HCl \\rightarrow R-CH=NH \\xrightarrow{H_3O^+} R-CHO$$
- **Etard Reaction:**
  $$\\text{Toluene} + CrO_2Cl_2 \\xrightarrow{CS_2} \\text{Chromium complex} \\xrightarrow{H_3O^+} \\text{Benzaldehyde}$$

### 2. Name Reactions
- **Aldol Condensation:** Carbonyls with at least one $\\alpha$-hydrogen in presence of dilute NaOH yield $\\beta$-hydroxy aldehydes/ketones, which dehydrate to $\\alpha,\\beta$-unsaturated compounds.
- **Cannizzaro Reaction:** Aldehydes lacking $\\alpha$-hydrogen (HCHO, $C_6H_5CHO$) undergo self oxidation-reduction with concentrated NaOH.

### 3. Chemical Distinction Tests
1. **Tollens' Test (Silver Mirror):** Aldehydes reduce Tollens reagent to elemental silver; Ketones do not.
2. **Fehling's Solution:** Aliphatic aldehydes give red ppt of $Cu_2O$.
3. **Iodoform Test:** Compounds containing $CH_3-C=O$ or $CH_3-CH(OH)-$ give yellow ppt of $CHI_3$ with $I_2/NaOH$.
`,
  },
  {
    id: 'note-3',
    title: 'Molecular Basis of Inheritance - Visual Mindmap',
    subject: 'Biology',
    classGrade: '12',
    chapter: 'Chapter 6: Molecular Genetics',
    description: 'Detailed diagrams of DNA double helix, Meselson-Stahl experiment, transcription machinery, lac operon model, and Human Genome Project takeaways.',
    fileName: 'Class12_Biology_Molecular_Inheritance.pdf',
    fileSize: '4.8 MB',
    fileType: 'application/pdf',
    uploadedBy: 'Director Alok Singh & Faculty',
    uploadedAt: '2026-03-05T14:20:00.000Z',
    downloadCount: 51,
    contentData: `# GOODWAY SCIENCE COACHING CENTER
## CLASS 12 BIOLOGY: MOLECULAR BASIS OF INHERITANCE
**Mentorship:** Director Alok Singh & Faculty

---

### 1. The DNA Structure
- Polynucleotide chain: Phosphate group + 5-carbon Deoxyribose Sugar + Nitrogenous Base.
- Purines: Adenine (A), Guanine (G).
- Pyrimidines: Cytosine (C), Thymine (T) / Uracil (U in RNA).
- **Chargaff's Rule:** In dsDNA, $[A] = [T]$ and $[G] = [C]$, hence $\\frac{A+G}{T+C} = 1$.
- Pitch of Helix: 3.4 nm with ~10 base pairs per turn (0.34 nm between base pairs).

### 2. Experimental Proofs
- **Griffith Transforming Principle (1928):** Heat-killed S-strain transformed live R-strain into virulent S-strain.
- **Avery, MacLeod & McCarty (1944):** Proved DNase destroyed transforming ability, confirming DNA is the genetic material.
- **Hershey & Chase (1952):** Used $^{32}P$ (labeled DNA) and $^{35}S$ (labeled protein capsule) with T2 bacteriophage.

### 3. The Central Dogma (Francis Crick)
$$\\text{DNA} \\xrightarrow{\\text{Transcription}} \\text{mRNA} \\xrightarrow{\\text{Translation}} \\text{Protein}$$
*(Reverse transcription found in retroviruses like HIV via Reverse Transcriptase)*

### 4. Lac Operon (Jacob & Monod)
- **i gene:** Encodes repressor protein.
- **Operator (o):** Repressor binding site.
- **Structural Genes:**
  - $z$: $\\beta$-galactosidase (hydrolyzes lactose to glucose + galactose)
  - $y$: Permease (increases cell permeability to $\\beta$-galactosides)
  - $a$: Transacetylase
`,
  },
  {
    id: 'note-4',
    title: 'Differential Calculus & Application of Derivatives',
    subject: 'Mathematics',
    classGrade: '12',
    chapter: 'Chapter 6: Application of Derivatives',
    description: 'Rate of change, tangents and normals, increasing/decreasing criteria, maxima and minima second derivative test with 20 board exam questions.',
    fileName: 'Class12_Maths_Application_Derivatives.pdf',
    fileSize: '1.9 MB',
    fileType: 'application/pdf',
    uploadedBy: 'Teacher Amit Kumar Singh (M.Sc. Math, B.Ed)',
    uploadedAt: '2026-03-06T16:45:00.000Z',
    downloadCount: 29,
    contentData: `# GOODWAY SCIENCE COACHING CENTER
## CLASS 12 MATHEMATICS: APPLICATION OF DERIVATIVES
**Faculty:** Teacher Amit Kumar Singh (M.Sc. Mathematics, B.Ed)
**Director:** Alok Singh (M.Sc. Mathematics)

---

### 1. Tangents & Normals
- Slope of tangent to curve $y = f(x)$ at $(x_0, y_0)$:
  $$m_t = \\left(\\frac{dy}{dx}\\right)_{(x_0, y_0)}$$
- Equation of Tangent:
  $$y - y_0 = m_t (x - x_0)$$
- Slope of Normal: $m_n = -\\frac{1}{m_t}$ (when $m_t \\neq 0$)

### 2. Increasing and Decreasing Functions
Let $f$ be continuous on $[a, b]$ and differentiable on $(a, b)$:
1. Strictly Increasing if $f'(x) > 0$ for all $x \\in (a, b)$.
2. Strictly Decreasing if $f'(x) < 0$ for all $x \\in (a, b)$.

### 3. Maxima & Minima: Second Derivative Test
1. Find $f'(x)$ and solve $f'(x) = 0$ to get critical points $x = c$.
2. Compute $f''(c)$:
   - If $f''(c) < 0$, $x = c$ is a point of **Local Maximum**.
   - If $f''(c) > 0$, $x = c$ is a point of **Local Minimum**.
   - If $f''(c) = 0$, test fails; use First Derivative Test.
`,
  },
  {
    id: 'note-5',
    title: 'Thermodynamics & Kinetic Theory Fundamentals',
    subject: 'Physics',
    classGrade: '11',
    chapter: 'Chapter 12: Thermodynamics',
    description: 'Zeroth, First & Second law of thermodynamics, Carnot cycle efficiency, isothermal vs adiabatic processes, and PV diagrams.',
    fileName: 'Class11_Physics_Thermodynamics.pdf',
    fileSize: '2.8 MB',
    fileType: 'application/pdf',
    uploadedBy: 'Director Alok Singh (M.Sc. Math)',
    uploadedAt: '2026-03-07T10:00:00.000Z',
    downloadCount: 33,
    contentData: `# GOODWAY SCIENCE COACHING CENTER
## CLASS 11 PHYSICS: THERMODYNAMICS
**Faculty:** Director Alok Singh (M.Sc. Mathematics)

---

### 1. First Law of Thermodynamics
$$\\Delta Q = \\Delta U + \\Delta W$$
Where $\\Delta W = P\\Delta V$.
- **Isothermal Process ($T = \\text{const}$):** $\\Delta U = 0 \\implies \\Delta Q = W = nRT \\ln(V_2/V_1)$.
- **Adiabatic Process ($\\Delta Q = 0$):** $W = -\\Delta U = \\frac{nR(T_1 - T_2)}{\\gamma - 1}$.
- **Isochoric Process ($V = \\text{const}$):** $W = 0 \\implies \\Delta Q = \\Delta U = nC_v\\Delta T$.
- **Isobaric Process ($P = \\text{const}$):** $\\Delta Q = nC_p\\Delta T, \\quad W = P(V_2 - V_1)$.

### 2. Carnot Engine
- Efficiency $\\eta = 1 - \\frac{T_2}{T_1} = \\frac{W}{Q_1}$
- For an ideal reversible engine operating between 500 K and 300 K: $\\eta = 1 - \\frac{300}{500} = 40\\%$.
`,
  },
  {
    id: 'note-6',
    title: 'Chemical Bonding & Molecular Geometry (VSEPR & MOT)',
    subject: 'Chemistry',
    classGrade: '11',
    chapter: 'Chapter 4: Chemical Bonding',
    description: 'Valence bond theory, hybridization (sp, sp2, sp3, sp3d), molecular orbital theory diagram for O2 & N2, bond order formula.',
    fileName: 'Class11_Chemistry_Chemical_Bonding.pdf',
    fileSize: '3.4 MB',
    fileType: 'application/pdf',
    uploadedBy: 'Teacher Shakti Varma (B.Sc. Math)',
    uploadedAt: '2026-03-08T12:30:00.000Z',
    downloadCount: 27,
    contentData: `# GOODWAY SCIENCE COACHING CENTER
## CLASS 11 CHEMISTRY: CHEMICAL BONDING
**Faculty:** Teacher Shakti Varma (B.Sc. Mathematics)
**Director:** Alok Singh (M.Sc. Mathematics)

---

### 1. Hybridization & Geometry
- **$sp$:** Linear ($180^\\circ$), e.g., $BeCl_2, C_2H_2$
- **$sp^2$:** Trigonal planar ($120^\\circ$), e.g., $BF_3, C_2H_4$
- **$sp^3$:** Tetrahedral ($109.5^\\circ$), e.g., $CH_4$ (with 1 lone pair $\\rightarrow$ Pyramidal $NH_3$; 2 lone pairs $\\rightarrow$ Bent $H_2O$)
- **$sp^3d$:** Trigonal bipyramidal, e.g., $PCl_5$

### 2. Molecular Orbital Theory (MOT)
- **Bond Order:**
  $$\\text{Bond Order} = \\frac{N_b - N_a}{2}$$
- Diamagnetic: all electrons paired.
- Paramagnetic: unpaired electrons present (e.g., $O_2$ with 2 unpaired electrons in $\\pi^* 2p_x, \\pi^* 2p_y$).
`,
  },
  {
    id: 'note-7',
    title: 'Light: Reflection & Refraction Master Guide',
    subject: 'Physics',
    classGrade: '10',
    chapter: 'Chapter 10: Light',
    description: 'Spherical mirror formula, lens formula, sign convention rules, ray diagrams, power of accommodation, and focal length numericals.',
    fileName: 'Class10_Science_Light_Reflection_Refraction.pdf',
    fileSize: '2.1 MB',
    fileType: 'application/pdf',
    uploadedBy: 'Director Alok Singh (M.Sc. Math)',
    uploadedAt: '2026-03-09T08:50:00.000Z',
    downloadCount: 45,
    contentData: `# GOODWAY SCIENCE COACHING CENTER
## CLASS 10 SCIENCE: LIGHT REFLECTION & REFRACTION
**Director:** Alok Singh (M.Sc. Math)
**Teachers:** Shakti Varma (B.Sc. Math) & Amit Kumar Singh (M.Sc. Math, B.Ed)

---

### 1. Mirror Formula & Magnification
$$\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}, \\quad m = -\\frac{v}{u} = \\frac{h_i}{h_o}$$
- Concave mirror: $f$ is negative.
- Convex mirror: $f$ is positive.

### 2. Lens Formula & Power
$$\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}, \\quad m = \\frac{v}{u}$$
- Power of a lens $P = \\frac{1}{f \\text{ (in meters)}}$ (Diopter, D).
- Convex lens has positive power; Concave lens has negative power.
`,
  },
  {
    id: 'note-8',
    title: 'Cell: The Fundamental Unit of Life Detailed Notes',
    subject: 'Biology',
    classGrade: '9',
    chapter: 'Chapter 5: Fundamental Unit of Life',
    description: 'Prokaryotic vs eukaryotic cells, cell organelles (Mitochondria, Golgi apparatus, Endoplasmic reticulum, Plastids), and osmosis experiments.',
    fileName: 'Class9_Science_Cell_Unit_of_Life.pdf',
    fileSize: '1.8 MB',
    fileType: 'application/pdf',
    uploadedBy: 'Director Alok Singh & Faculty',
    uploadedAt: '2026-03-10T11:00:00.000Z',
    downloadCount: 22,
    contentData: `# GOODWAY SCIENCE COACHING CENTER
## CLASS 9 SCIENCE: THE FUNDAMENTAL UNIT OF LIFE
**Director:** Alok Singh (M.Sc. Math) • **Faculty:** Shakti Varma (B.Sc. Math) & Amit Kumar Singh (M.Sc. Math, B.Ed)

---

### 1. Discovery of Cell
- Robert Hooke (1665): Discovered cells in cork slices.
- Antonie van Leeuwenhoek (1674): Observed free living cells in pond water.
- Robert Brown (1831): Discovered cell nucleus.
- Schleiden & Schwann (1838-39): Cell Theory (All plants and animals are composed of cells).
- Virchow (1855): *Omnis cellula e cellula* (All cells arise from pre-existing cells).

### 2. Organelles Summary
- **Mitochondria:** Powerhouse of the cell, produces ATP, possesses own DNA and ribosomes.
- **Plastids:** Found only in plant cells (Chloroplasts, Chromoplasts, Leucoplasts).
- **Lysosomes:** Suicide bags containing digestive hydrolytic enzymes.
`,
  },
];

// --- Authentication Middleware ---
interface AuthenticatedRequest extends Request {
  user?: JwtPayload & { fullUser?: DbUser };
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check Authorization header or cookie
  let token = req.cookies?.auth_token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  const payload = verifyJwt(token);
  if (!payload) {
    res.clearCookie('auth_token');
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }

  // Check if user exists in database and is active
  const dbUser = usersDb.find(u => u.id === payload.userId);
  if (!dbUser) {
    res.clearCookie('auth_token');
    return res.status(401).json({ success: false, message: 'Account no longer exists.' });
  }

  if (!dbUser.isActive) {
    res.clearCookie('auth_token');
    logSecurityEvent('BLOCKED_INACTIVE_USER_ACCESS', dbUser.email, req.ip || 'unknown', 'Deactivated user tried to perform authenticated request.', 'warning', dbUser.role);
    return res.status(403).json({ success: false, message: 'Your student access has been deactivated. Please contact the Goodway administration.' });
  }

  req.user = {
    ...payload,
    fullUser: dbUser,
  };

  next();
}

function requireRole(allowedRoles: ('student' | 'teacher')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurityEvent(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        req.user.email,
        req.ip || 'unknown',
        `User with role '${req.user.role}' attempted unauthorized access to '${req.originalUrl}'`,
        'critical',
        req.user.role
      );
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Insufficient permissions for this administrative resource.',
      });
    }

    next();
  };
}

// --- API ROUTES ---

// Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    institution: 'GOODWAY SCIENCE COACHING CENTER',
    timestamp: new Date().toISOString(),
    security: {
      rbac: 'ACTIVE',
      bruteForceProtection: 'ENABLED',
      signedUrlStorage: 'ENFORCED',
    }
  });
});

// Authentication: Login
app.post('/api/auth/login', (req, res) => {
  const { identifier, password, requestedRole } = req.body;
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'Identifier and password are required.' });
  }

  // Rate Limiting / Brute-force check per IP + identifier
  const rateLimitKey = `${clientIp}:${identifier.trim().toLowerCase()}`;
  const rateLimitStatus = checkRateLimit(rateLimitKey);

  if (rateLimitStatus.isLocked) {
    logSecurityEvent(
      'RATE_LIMIT_LOCKOUT',
      identifier,
      clientIp,
      `Blocked login attempt due to multiple failed passwords. Lockout remaining: ${rateLimitStatus.remainingSeconds}s`,
      'critical',
      requestedRole
    );
    return res.status(429).json({
      success: false,
      message: `Account temporarily locked due to 5 failed login attempts. Please try again in ${rateLimitStatus.remainingSeconds} seconds.`,
      isLocked: true,
      remainingSeconds: rateLimitStatus.remainingSeconds,
      attemptsRemaining: 0,
    });
  }

  // Find user by Email or Roll Number (case-insensitive, with aliases for Director Alok Singh and Teacher Amit Kumar Singh)
  const cleanId = identifier.trim().toLowerCase();
  const user = usersDb.find(
    u => u.email.toLowerCase() === cleanId || 
         u.rollNo.toLowerCase() === cleanId || 
         (u.id === 'teacher-1' && (cleanId === 'teacher@goodway.edu' || cleanId === 'director@goodway.edu' || cleanId === 't-101')) ||
         (u.id === 'teacher-3' && (cleanId === 'amit.kumar.singh@goodway.edu'))
  );

  // Generic invalid credentials message to prevent user enumeration
  const invalidCredentialsMessage = 'Invalid credentials or unauthorized role. Please check your credentials.';

  if (!user) {
    const attempt = recordFailedAttempt(rateLimitKey);
    logSecurityEvent('LOGIN_FAILURE', identifier, clientIp, `User not found. Failed attempt recorded. Attempts left: ${attempt.attemptsRemaining}`, 'warning', requestedRole);
    return res.status(401).json({
      success: false,
      message: invalidCredentialsMessage,
      attemptsRemaining: attempt.attemptsRemaining,
      isLocked: attempt.isNowLocked,
      lockoutTimeSeconds: attempt.remainingSeconds,
    });
  }

  // Verify Role match if requested
  if (requestedRole && user.role !== requestedRole) {
    const attempt = recordFailedAttempt(rateLimitKey);
    logSecurityEvent('LOGIN_FAILURE', identifier, clientIp, `Role mismatch: Expected ${user.role} but attempted ${requestedRole}.`, 'warning', requestedRole);
    return res.status(401).json({
      success: false,
      message: invalidCredentialsMessage,
      attemptsRemaining: attempt.attemptsRemaining,
      isLocked: attempt.isNowLocked,
      lockoutTimeSeconds: attempt.remainingSeconds,
    });
  }

  // Verify password using PBKDF2
  const isMatch = verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!isMatch) {
    const attempt = recordFailedAttempt(rateLimitKey);
    logSecurityEvent('LOGIN_FAILURE', user.email, clientIp, `Incorrect password. Failed attempt recorded. Attempts left: ${attempt.attemptsRemaining}`, 'warning', user.role);
    return res.status(401).json({
      success: false,
      message: invalidCredentialsMessage,
      attemptsRemaining: attempt.attemptsRemaining,
      isLocked: attempt.isNowLocked,
      lockoutTimeSeconds: attempt.remainingSeconds,
    });
  }

  // Check if account is active
  if (!user.isActive) {
    logSecurityEvent('LOGIN_BLOCKED_INACTIVE', user.email, clientIp, 'Active login blocked for suspended student account.', 'warning', user.role);
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated by Goodway Administration. Please visit the office.',
    });
  }

  // Success - Clear rate limit counter
  clearRateLimit(rateLimitKey);
  user.lastActive = new Date().toISOString();

  // Create JWT Token
  const token = createJwt({
    userId: user.id,
    email: user.email,
    role: user.role,
    rollNo: user.rollNo,
    classGrade: user.classGrade,
  });

  // Set HTTP-only secure cookie
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  logSecurityEvent('LOGIN_SUCCESS', user.email, clientIp, `Successful login as ${user.role}`, 'info', user.role);

  // Return clean user object without password hash
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    rollNo: user.rollNo,
    classGrade: user.classGrade,
    isActive: user.isActive,
    phone: user.phone,
    enrolledSubjects: user.enrolledSubjects,
    lastActive: user.lastActive,
    joinedDate: user.joinedDate,
    notesDownloadedCount: user.notesDownloadedCount,
    feeSummary: user.role === 'student' ? getStudentFeeSummary(user.id) : undefined,
  };

  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    token,
    user: safeUser,
  });
});

// Authentication: Get Current Profile
app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!.fullUser!;
  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNo: user.rollNo,
      classGrade: user.classGrade,
      isActive: user.isActive,
      phone: user.phone,
      enrolledSubjects: user.enrolledSubjects,
      lastActive: user.lastActive,
      joinedDate: user.joinedDate,
      notesDownloadedCount: user.notesDownloadedCount,
      feeSummary: user.role === 'student' ? getStudentFeeSummary(user.id) : undefined,
    }
  });
});

// Authentication: Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out securely.' });
});

// Notes: Get Notes (RBAC filtered)
app.get('/api/notes', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { classGrade, subject, search } = req.query;

  let filtered = [...notesDb];

  // If student, can see all classes or filter, but default can be their class or any requested filter
  if (classGrade) {
    filtered = filtered.filter(n => n.classGrade === classGrade);
  }

  if (subject) {
    filtered = filtered.filter(n => n.subject.toLowerCase() === (subject as string).toLowerCase());
  }

  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.chapter.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q) ||
      n.fileName.toLowerCase().includes(q)
    );
  }

  // Strip internal raw storage content from list view to keep payload light and secure
  const safeNotes = filtered.map(n => ({
    id: n.id,
    title: n.title,
    subject: n.subject,
    classGrade: n.classGrade,
    chapter: n.chapter,
    description: n.description,
    fileName: n.fileName,
    fileSize: n.fileSize,
    fileType: n.fileType,
    uploadedBy: n.uploadedBy,
    uploadedAt: n.uploadedAt,
    downloadCount: n.downloadCount,
    previewAvailable: true,
  }));

  res.json({
    success: true,
    count: safeNotes.length,
    notes: safeNotes,
  });
});

// Secure File Management: Generate Signed URL for Note / PDF
app.post('/api/notes/:id/signed-url', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const noteId = req.params.id;
  const user = req.user!;

  const note = notesDb.find(n => n.id === noteId);
  if (!note) {
    return res.status(404).json({ success: false, message: 'Note not found in secure storage repository.' });
  }

  // Generate 15-minute time-limited cryptographic URL
  const { signedUrl, expiresAt } = generateSignedFileUrl(note.id, user.userId, 900);

  logSecurityEvent(
    'SIGNED_URL_GENERATED',
    user.email,
    req.ip || 'unknown',
    `Generated signed URL for note '${note.title}' expiring in 15 minutes.`,
    'info',
    user.role
  );

  res.json({
    success: true,
    signedUrl,
    expiresAt,
    expiresInSeconds: 900,
    fileName: note.fileName,
  });
});

// Secure File Management: Serve Private File via Signed URL & Authenticated Verification
app.get('/api/storage/secure-file/:noteId', (req: Request, res: Response) => {
  const noteId = req.params.noteId;
  const userId = req.query.u as string;
  const exp = req.query.exp as string;
  const sig = req.query.sig as string;
  const download = req.query.download === 'true';

  if (!userId || !exp || !sig) {
    return res.status(403).json({
      success: false,
      message: 'Access Forbidden: File requires time-limited signed URL authentication parameters.',
    });
  }

  const isValidSignature = verifySignedUrl(noteId, userId, exp, sig);
  if (!isValidSignature) {
    logSecurityEvent(
      'INVALID_SIGNED_URL_ATTEMPT',
      userId || 'unknown',
      req.ip || 'unknown',
      `Attempted to access private note ${noteId} with invalid or expired signature`,
      'critical'
    );
    return res.status(403).json({
      success: false,
      message: 'Signature expired or invalid. Please generate a new access link from your portal.',
    });
  }

  const note = notesDb.find(n => n.id === noteId);
  if (!note) {
    return res.status(404).json({ success: false, message: 'Requested note not found in storage.' });
  }

  // Increment download count and student count
  note.downloadCount += 1;
  const student = usersDb.find(u => u.id === userId);
  if (student) {
    student.notesDownloadedCount = (student.notesDownloadedCount || 0) + 1;
  }

  if (download) {
    res.setHeader('Content-Disposition', `attachment; filename="${note.fileName}"`);
  } else {
    res.setHeader('Content-Disposition', `inline; filename="${note.fileName}"`);
  }

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

  res.send(note.contentData);
});

// Teacher Only: Upload Note
app.post('/api/notes/upload', authMiddleware, requireRole(['teacher']), (req: AuthenticatedRequest, res: Response) => {
  const { title, subject, classGrade, chapter, description, fileName, fileContent, fileSize } = req.body;

  if (!title || !subject || !classGrade || !chapter) {
    return res.status(400).json({ success: false, message: 'Title, Subject, Class, and Chapter are required.' });
  }

  const newNote: DbNote = {
    id: `note-${Date.now()}`,
    title: title.trim(),
    subject,
    classGrade,
    chapter: chapter.trim(),
    description: (description || '').trim(),
    fileName: fileName || `${subject}_Class${classGrade}_${chapter.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
    fileSize: fileSize || '1.2 MB',
    fileType: 'application/pdf',
    uploadedBy: req.user!.fullUser?.name || 'Faculty',
    uploadedAt: new Date().toISOString(),
    downloadCount: 0,
    contentData: fileContent || `# GOODWAY SCIENCE COACHING CENTER
## ${title.toUpperCase()}
**Subject:** ${subject} | **Class:** ${classGrade} | **Chapter:** ${chapter}
**Uploaded by:** ${req.user!.fullUser?.name} on ${new Date().toLocaleDateString()}

---

### Key Concepts & Syllabus Summary
${description || 'Standard high-yield notes prepared for Goodway Science students.'}

### Study Objectives
1. Comprehensive understanding of theoretical principles.
2. Derivations and mathematical proofs for Board examinations.
3. Multiple-choice and application-oriented problems for competitive exams (NEET/JEE).
4. Previous year question bank solutions.

*Proprietary material for enrolled students of Goodway Science Coaching Center. Unauthorized redistribution is prohibited.*
`,
  };

  notesDb.unshift(newNote);

  logSecurityEvent(
    'NOTE_UPLOAD',
    req.user!.email,
    req.ip || 'unknown',
    `Uploaded note: "${newNote.title}" for Class ${newNote.classGrade} ${newNote.subject}`,
    'info',
    'teacher'
  );

  res.json({
    success: true,
    message: 'Note uploaded successfully to private secure bucket.',
    note: {
      id: newNote.id,
      title: newNote.title,
      subject: newNote.subject,
      classGrade: newNote.classGrade,
      chapter: newNote.chapter,
      description: newNote.description,
      fileName: newNote.fileName,
      fileSize: newNote.fileSize,
      uploadedBy: newNote.uploadedBy,
      uploadedAt: newNote.uploadedAt,
      downloadCount: newNote.downloadCount,
    },
  });
});

// Teacher Only: Edit Note
app.put('/api/notes/:id', authMiddleware, requireRole(['teacher']), (req: AuthenticatedRequest, res: Response) => {
  const noteId = req.params.id;
  const note = notesDb.find(n => n.id === noteId);

  if (!note) {
    return res.status(404).json({ success: false, message: 'Note not found' });
  }

  const { title, subject, classGrade, chapter, description } = req.body;
  if (title) note.title = title.trim();
  if (subject) note.subject = subject;
  if (classGrade) note.classGrade = classGrade;
  if (chapter) note.chapter = chapter.trim();
  if (description !== undefined) note.description = description.trim();

  logSecurityEvent(
    'NOTE_UPDATED',
    req.user!.email,
    req.ip || 'unknown',
    `Updated note metadata for: "${note.title}"`,
    'info',
    'teacher'
  );

  res.json({
    success: true,
    message: 'Note updated successfully.',
    note: {
      id: note.id,
      title: note.title,
      subject: note.subject,
      classGrade: note.classGrade,
      chapter: note.chapter,
      description: note.description,
      fileName: note.fileName,
      fileSize: note.fileSize,
      downloadCount: note.downloadCount,
    },
  });
});

// Teacher Only: Delete Note
app.delete('/api/notes/:id', authMiddleware, requireRole(['teacher']), (req: AuthenticatedRequest, res: Response) => {
  const noteId = req.params.id;
  const index = notesDb.findIndex(n => n.id === noteId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Note not found' });
  }

  const deletedNote = notesDb.splice(index, 1)[0];

  logSecurityEvent(
    'NOTE_DELETED',
    req.user!.email,
    req.ip || 'unknown',
    `Deleted note: "${deletedNote.title}"`,
    'warning',
    'teacher'
  );

  res.json({
    success: true,
    message: `Note "${deletedNote.title}" deleted permanently from storage.`,
  });
});

// Teacher Only: View Students Directory
app.get('/api/students', authMiddleware, requireRole(['teacher']), (req: AuthenticatedRequest, res: Response) => {
  const students = usersDb
    .filter(u => u.role === 'student')
    .map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      rollNo: s.rollNo,
      classGrade: s.classGrade,
      isActive: s.isActive,
      enrolledSubjects: s.enrolledSubjects,
      joinedDate: s.joinedDate,
      lastActive: s.lastActive,
      notesDownloadedCount: s.notesDownloadedCount || 0,
      phone: s.phone,
      feeSummary: getStudentFeeSummary(s.id),
    }));

  res.json({
    success: true,
    count: students.length,
    students,
  });
});

// Student & Teacher: View Individual Student Fee Details
app.get('/api/student/fee', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let targetStudentId = user.userId;

  // Teachers can query fee for any student via ?studentId=...
  if (user.role === 'teacher' && req.query.studentId) {
    targetStudentId = req.query.studentId as string;
  }

  let feeRecord = studentFeesDb[targetStudentId];

  // If not found, attempt to find user and create default record
  if (!feeRecord) {
    const studentUser = usersDb.find(u => u.id === targetStudentId && u.role === 'student');
    if (!studentUser) {
      return res.status(404).json({ success: false, message: 'Student fee profile not found.' });
    }

    const defaultClass = studentUser.classGrade || '12';
    const monthlyFee = defaultClass === '12' ? 1500 : defaultClass === '11' ? 1400 : defaultClass === '10' ? 1000 : 900;
    const totalAnnual = monthlyFee * 12;

    feeRecord = {
      studentId: studentUser.id,
      studentName: studentUser.name,
      rollNo: studentUser.rollNo,
      classGrade: defaultClass,
      monthlyFee,
      totalAnnualFee: totalAnnual,
      totalPaid: 0,
      dueAmount: totalAnnual,
      status: 'due',
      nextDueDate: '2026-09-30',
      academicSession: '2025-2026',
      paymentHistory: [],
      feeStructure: [
        { label: `Monthly Coaching Tuition Fee (कक्षा ${defaultClass}वीं)`, amount: monthlyFee, frequency: 'Per Month' },
        { label: 'Laboratory Practical & Experiment Workshops', amount: 0, frequency: 'Complimentary' },
        { label: 'Bilingual Chapter Notes & Question Bank (PDF)', amount: 0, frequency: 'Included' },
        { label: 'Weekly Sunday Test & 100-Mark Model Exam Series', amount: 0, frequency: 'Included' },
      ],
    };
    studentFeesDb[targetStudentId] = feeRecord;
  }

  res.json({
    success: true,
    feeRecord,
  });
});

// Teacher Only: Comprehensive Fee Overview & Summary
app.get('/api/fees/summary', authMiddleware, requireRole(['teacher']), (req: AuthenticatedRequest, res: Response) => {
  const studentList = usersDb.filter(u => u.role === 'student');
  
  let totalExpected = 0;
  let totalCollected = 0;
  let totalDue = 0;
  let paidCount = 0;
  let partialCount = 0;
  let dueCount = 0;

  const records = studentList.map(student => {
    let fee = studentFeesDb[student.id];
    if (!fee) {
      const cls = student.classGrade || '12';
      const mFee = cls === '12' ? 1500 : cls === '11' ? 1400 : cls === '10' ? 1000 : 900;
      fee = {
        studentId: student.id,
        studentName: student.name,
        rollNo: student.rollNo,
        classGrade: cls,
        monthlyFee: mFee,
        totalAnnualFee: mFee * 12,
        totalPaid: 0,
        dueAmount: mFee * 12,
        status: 'due',
        nextDueDate: '2026-09-30',
        academicSession: '2025-2026',
        paymentHistory: [],
        feeStructure: [
          { label: `Monthly Tuition Fee (कक्षा ${cls}वीं)`, amount: mFee, frequency: 'Per Month' },
        ],
      };
      studentFeesDb[student.id] = fee;
    }

    totalExpected += fee.totalAnnualFee;
    totalCollected += fee.totalPaid;
    totalDue += fee.dueAmount;

    if (fee.status === 'paid') paidCount++;
    else if (fee.status === 'partial') partialCount++;
    else dueCount++;

    return fee;
  });

  res.json({
    success: true,
    summary: {
      totalExpected,
      totalCollected,
      totalDue,
      paidCount,
      partialCount,
      dueCount,
      totalStudents: studentList.length,
      collectionRatePercentage: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
    },
    feeRecords: records,
  });
});

// Teacher Only: Record a Student Fee Payment & Generate Receipt
app.post('/api/fees/record-payment', authMiddleware, requireRole(['teacher']), (req: AuthenticatedRequest, res: Response) => {
  const { studentId, amount, paymentMode, transactionRef, monthOrDescription } = req.body;

  if (!studentId || !amount || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Valid student and positive payment amount are required.' });
  }

  const student = usersDb.find(u => u.id === studentId && u.role === 'student');
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found in directory.' });
  }

  let feeRecord = studentFeesDb[studentId];
  if (!feeRecord) {
    const cls = student.classGrade || '12';
    const mFee = cls === '12' ? 1500 : cls === '11' ? 1400 : cls === '10' ? 1000 : 900;
    feeRecord = {
      studentId: student.id,
      studentName: student.name,
      rollNo: student.rollNo,
      classGrade: cls,
      monthlyFee: mFee,
      totalAnnualFee: mFee * 12,
      totalPaid: 0,
      dueAmount: mFee * 12,
      status: 'due',
      nextDueDate: '2026-09-30',
      academicSession: '2025-2026',
      paymentHistory: [],
      feeStructure: [
        { label: `Monthly Tuition Fee (कक्षा ${cls}वीं)`, amount: mFee, frequency: 'Per Month' },
      ],
    };
    studentFeesDb[studentId] = feeRecord;
  }

  const numAmount = Number(amount);
  const receiptCount = Object.values(studentFeesDb).reduce((acc, curr) => acc + curr.paymentHistory.length, 100);
  const newReceipt: DbFeeReceipt = {
    id: `rec-${Date.now()}`,
    receiptNo: `GW-FEE-2026-${String(receiptCount + 1).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    amount: numAmount,
    paymentMode: paymentMode || 'Cash',
    transactionRef: transactionRef || `OFFICE-${Date.now().toString().slice(-6)}`,
    monthOrDescription: monthOrDescription || 'Tuition Fee Installment',
    status: 'success',
    receivedBy: req.user!.fullUser?.name || 'Alok Singh (Director)',
  };

  feeRecord.paymentHistory.unshift(newReceipt);
  feeRecord.totalPaid += numAmount;
  feeRecord.dueAmount = Math.max(0, feeRecord.totalAnnualFee - feeRecord.totalPaid);

  if (feeRecord.dueAmount <= 0) {
    feeRecord.status = 'paid';
    feeRecord.nextDueDate = 'Session Completed (पूर्ण चुकता)';
  } else {
    feeRecord.status = 'partial';
    // Set next due date 30 days ahead
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);
    feeRecord.nextDueDate = nextDate.toISOString().split('T')[0];
  }

  logSecurityEvent(
    'FEE_PAYMENT_RECORDED',
    req.user!.email,
    req.ip || 'unknown',
    `Recorded fee payment of ₹${numAmount} for student ${student.name} (${student.rollNo}). Receipt: ${newReceipt.receiptNo}`,
    'info',
    'teacher'
  );

  res.json({
    success: true,
    message: `Payment of ₹${numAmount.toLocaleString('en-IN')} recorded successfully. Receipt generated: ${newReceipt.receiptNo}`,
    receipt: newReceipt,
    feeRecord,
  });
});

// Student: Submit Online Fee Payment Confirmation / UTR for Verification
app.post('/api/student/fee/submit-utr', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { amount, paymentMode, transactionRef, remarks } = req.body;
  const user = req.user!;

  if (!amount || !transactionRef) {
    return res.status(400).json({ success: false, message: 'Amount and Transaction UTR reference are required.' });
  }

  logSecurityEvent(
    'STUDENT_FEE_SUBMISSION',
    user.email,
    req.ip || 'unknown',
    `Student ${user.email} submitted payment verification request: ₹${amount} via ${paymentMode || 'UPI'} (Ref: ${transactionRef})`,
    'info',
    user.role
  );

  res.json({
    success: true,
    message: 'Payment verification details submitted successfully to the Coaching Center office. Your digital receipt will be updated upon confirmation.',
    referenceId: `VERIFY-${Date.now().toString().slice(-6)}`,
  });
});

// Teacher Only: Toggle Student Status (Activate/Deactivate)
app.post('/api/students/:id/toggle-status', authMiddleware, requireRole(['teacher']), (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.params.id;
  const student = usersDb.find(u => u.id === studentId && u.role === 'student');

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found in directory.' });
  }

  student.isActive = !student.isActive;

  logSecurityEvent(
    'STUDENT_STATUS_CHANGE',
    req.user!.email,
    req.ip || 'unknown',
    `Changed access status for student ${student.name} (${student.rollNo}) to ${student.isActive ? 'ACTIVE' : 'DEACTIVATED'}`,
    student.isActive ? 'info' : 'warning',
    'teacher'
  );

  res.json({
    success: true,
    message: `Student access ${student.isActive ? 'activated' : 'deactivated'} successfully.`,
    student: {
      id: student.id,
      name: student.name,
      isActive: student.isActive,
    },
  });
});

// Teacher Only: Security Audit Logs
app.get('/api/security/audit-logs', authMiddleware, requireRole(['teacher']), (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    count: auditLogs.length,
    logs: auditLogs,
  });
});

// Vite Middleware for Dev and Static fallback for Prod
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
    console.log(`GOODWAY Science Coaching Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
