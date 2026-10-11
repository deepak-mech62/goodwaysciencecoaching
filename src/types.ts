export type UserRole = 'student' | 'teacher';

export type ClassGrade = '9' | '10' | '11' | '12';

export type StreamType = 'science' | 'arts' | 'all';

export type SubjectName = 
  | 'Physics' 
  | 'Chemistry' 
  | 'Biology' 
  | 'Mathematics'
  | 'Science'
  | 'Social Science'
  | 'History'
  | 'Political Science'
  | 'Geography'
  | 'Economics'
  | 'Psychology'
  | 'Sociology'
  | 'Home Science'
  | 'Hindi'
  | 'English'
  | 'Sanskrit';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rollNo: string;
  classGrade?: ClassGrade;
  isActive: boolean;
  phone?: string;
  avatarUrl?: string;
  enrolledSubjects?: SubjectName[];
  lastLogin?: string;
  lastActive?: string;
  joinedDate?: string;
  createdAt?: string;
  notesDownloadedCount?: number;
  feeSummary?: {
    totalAnnualFee: number;
    totalPaid: number;
    dueAmount: number;
    status: 'paid' | 'partial' | 'due';
    nextDueDate?: string;
  };
}

export interface FeePaymentReceipt {
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

export interface FeeStructureItem {
  label: string;
  amount: number;
  frequency: string;
}

export interface StudentFeeRecord {
  studentId: string;
  studentName: string;
  rollNo: string;
  classGrade: ClassGrade;
  monthlyFee: number;
  totalAnnualFee: number;
  totalPaid: number;
  dueAmount: number;
  status: 'paid' | 'partial' | 'due';
  nextDueDate?: string;
  academicSession: string;
  paymentHistory: FeePaymentReceipt[];
  feeStructure: FeeStructureItem[];
}

export interface NoteItem {
  id: string;
  title: string;
  subject: SubjectName;
  classGrade: ClassGrade;
  chapter: string;
  description: string;
  fileSize: string;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadCount: number;
  previewAvailable?: boolean;
}

export interface StudentRecord {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  classGrade: ClassGrade;
  isActive: boolean;
  phone?: string;
  enrolledSubjects: SubjectName[];
  joinedDate: string;
  lastActive: string;
  notesDownloadedCount: number;
  feeSummary?: {
    totalAnnualFee: number;
    totalPaid: number;
    dueAmount: number;
    status: 'paid' | 'partial' | 'due';
    nextDueDate?: string;
  };
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'RATE_LIMIT_LOCKOUT' | 'UNAUTHORIZED_ACCESS_ATTEMPT' | 'NOTE_UPLOAD' | 'STUDENT_STATUS_CHANGE' | 'SIGNED_URL_GENERATED';
  userEmailOrId: string;
  role?: string;
  ipAddress: string;
  details: string;
  status: 'info' | 'warning' | 'critical';
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  attemptsRemaining?: number;
  lockoutTimeSeconds?: number;
}

export interface SignedUrlResponse {
  success: boolean;
  signedUrl: string;
  expiresInSeconds: number;
  fileName: string;
}
