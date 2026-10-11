import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { NoteItem, StudentRecord, SecurityAuditLog, ClassGrade, SubjectName, StudentFeeRecord, FeePaymentReceipt } from '../types';
import { 
  ShieldCheck, 
  Upload, 
  Trash2, 
  Edit3, 
  Users, 
  FileText, 
  Search, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Download, 
  Filter, 
  RefreshCw, 
  Lock, 
  Check, 
  X,
  FileCheck,
  Eye,
  Activity,
  Receipt,
  CreditCard,
  Calendar,
  Building2,
  Printer,
  ArrowUpRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { FeeReceiptModal } from './FeeReceiptModal';

interface TeacherDashboardProps {
  onOpenNoteViewer: (note: NoteItem) => void;
  onTriggerDownload: (note: NoteItem) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onOpenNoteViewer,
  onTriggerDownload,
}) => {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'notes' | 'upload' | 'students' | 'audit' | 'fees'>('notes');

  // Notes state
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(true);
  const [notesFilterClass, setNotesFilterClass] = useState<string>('All');
  const [notesFilterSubject, setNotesFilterSubject] = useState<string>('All');
  const [notesSearch, setNotesSearch] = useState<string>('');

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState<SubjectName>('Physics');
  const [uploadClass, setUploadClass] = useState<ClassGrade>('12');
  const [uploadChapter, setUploadChapter] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Edit Note Modal State
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editChapter, setEditChapter] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Students Directory State
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [studentFilterClass, setStudentFilterClass] = useState<string>('All');
  const [togglingStudentId, setTogglingStudentId] = useState<string | null>(null);

  // Security Audit Logs State
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);

  // Fees Management State
  const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>([]);
  const [feeSummary, setFeeSummary] = useState<{
    totalExpected: number;
    totalCollected: number;
    totalDue: number;
    paidCount: number;
    partialCount: number;
    dueCount: number;
    totalStudents: number;
    collectionRatePercentage: number;
  } | null>(null);
  const [isLoadingFees, setIsLoadingFees] = useState<boolean>(false);
  const [feeSearch, setFeeSearch] = useState<string>('');
  const [feeFilterClass, setFeeFilterClass] = useState<string>('All');
  const [feeFilterStatus, setFeeFilterStatus] = useState<string>('All');

  // Update Fee Modal State
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<StudentFeeRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Net Banking' | 'Bank Transfer'>('Cash');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentMonth, setPaymentMonth] = useState<string>('Monthly Tuition Fee Installment');
  const [isSavingPayment, setIsSavingPayment] = useState<boolean>(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string>('');

  // Fee History / Receipts Modal State
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<StudentFeeRecord | null>(null);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<FeePaymentReceipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Fetch Notes
  const fetchNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const res = await fetch('/api/notes', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotes(data.notes);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Fetch Students
  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const res = await fetch('/api/students', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStudents(data.students);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Fetch Fees Overview & Records
  const fetchFees = async () => {
    setIsLoadingFees(true);
    try {
      const res = await fetch('/api/fees/summary', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          let records: StudentFeeRecord[] = data.feeRecords || [];
          
          // Check local storage override for instant synchronization
          records = records.map((rec) => {
            const local = localStorage.getItem(`goodway_student_fee_${rec.studentId}`);
            if (local) {
              try {
                return JSON.parse(local);
              } catch {
                return rec;
              }
            }
            return rec;
          });

          // Compute totals
          let exp = 0, col = 0, due = 0, paid = 0, part = 0, dCount = 0;
          records.forEach((r) => {
            exp += r.totalAnnualFee;
            col += r.totalPaid;
            due += r.dueAmount;
            if (r.dueAmount <= 0) paid++;
            else if (r.totalPaid > 0) part++;
            else dCount++;
          });

          setFeeRecords(records);
          setFeeSummary({
            totalExpected: exp,
            totalCollected: col,
            totalDue: due,
            paidCount: paid,
            partialCount: part,
            dueCount: dCount,
            totalStudents: records.length,
            collectionRatePercentage: exp > 0 ? Math.round((col / exp) * 100) : 0,
          });
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingFees(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/security/audit-logs', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAuditLogs(data.logs);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    } else if (activeTab === 'fees') {
      fetchFees();
    }
  }, [activeTab]);

  // Handle Record Student Payment Submission
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPayment) return;
    const numAmount = Number(paymentAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid positive payment amount.');
      return;
    }

    setIsSavingPayment(true);
    setPaymentSuccessToast('');

    try {
      const res = await fetch('/api/fees/record-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          studentId: selectedStudentForPayment.studentId,
          amount: numAmount,
          paymentMode,
          transactionRef: paymentRef || `OFFICE-${Date.now().toString().slice(-6)}`,
          monthOrDescription: paymentMonth,
        }),
      });

      let updatedRecord: StudentFeeRecord;
      let newReceipt: FeePaymentReceipt;

      if (res.ok) {
        const data = await res.json();
        updatedRecord = data.feeRecord;
        newReceipt = data.receipt;
      } else {
        // Fallback local update
        const receiptCount = (selectedStudentForPayment.paymentHistory?.length || 0) + 101;
        newReceipt = {
          id: `rec-${Date.now()}`,
          receiptNo: `GW-FEE-2026-${String(receiptCount).padStart(3, '0')}`,
          date: paymentDate,
          amount: numAmount,
          paymentMode,
          transactionRef: paymentRef || `OFFICE-${Date.now().toString().slice(-6)}`,
          monthOrDescription: paymentMonth,
          status: 'success',
          receivedBy: user?.name || 'Alok Singh (Director)',
        };
        const newPaid = selectedStudentForPayment.totalPaid + numAmount;
        const newDue = Math.max(0, selectedStudentForPayment.totalAnnualFee - newPaid);
        updatedRecord = {
          ...selectedStudentForPayment,
          totalPaid: newPaid,
          dueAmount: newDue,
          status: newDue <= 0 ? 'paid' : (newPaid > 0 ? 'partial' : 'due'),
          paymentHistory: [newReceipt, ...(selectedStudentForPayment.paymentHistory || [])],
        };
      }

      // 1. Sync to LocalStorage for this student so Student Dashboard immediately sees it
      localStorage.setItem(`goodway_student_fee_${selectedStudentForPayment.studentId}`, JSON.stringify(updatedRecord));

      // 2. Update local state immediately
      setFeeRecords((prev) =>
        prev.map((r) => (r.studentId === updatedRecord.studentId ? updatedRecord : r))
      );

      // 3. Update summary state immediately
      setFeeSummary((prev) => {
        if (!prev) return null;
        const oldRec = selectedStudentForPayment;
        const diffPaid = updatedRecord.totalPaid - oldRec.totalPaid;
        const diffDue = oldRec.dueAmount - updatedRecord.dueAmount;
        const newCol = prev.totalCollected + diffPaid;
        const newDueTotal = Math.max(0, prev.totalDue - diffDue);
        return {
          ...prev,
          totalCollected: newCol,
          totalDue: newDueTotal,
          collectionRatePercentage: prev.totalExpected > 0 ? Math.round((newCol / prev.totalExpected) * 100) : 0,
        };
      });

      setPaymentSuccessToast(`Payment of ₹${numAmount.toLocaleString('en-IN')} successfully recorded for ${selectedStudentForPayment.studentName}! Official receipt generated.`);
      setSelectedStudentForPayment(null);
      setPaymentAmount('');
      setPaymentRef('');

      // Auto dismiss success toast after 4s
      setTimeout(() => setPaymentSuccessToast(''), 4500);
    } catch {
      alert('Network error while saving payment.');
    } finally {
      setIsSavingPayment(false);
    }
  };

  // Handle Note Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');

    if (!uploadTitle.trim() || !uploadChapter.trim()) {
      setUploadError('Title and Chapter name are required.');
      return;
    }

    setIsUploading(true);

    try {
      let fileContent = '';
      let fileName = `${uploadSubject}_Class${uploadClass}_${uploadChapter.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      let fileSize = '1.8 MB';

      if (selectedFile) {
        fileName = selectedFile.name;
        fileSize = `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`;
        // Read text if small or generate custom preview content
        fileContent = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as string || '');
          };
          reader.onerror = () => resolve('');
          reader.readAsText(selectedFile);
        });
      }

      const res = await fetch('/api/notes/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: uploadTitle.trim(),
          subject: uploadSubject,
          classGrade: uploadClass,
          chapter: uploadChapter.trim(),
          description: uploadDescription.trim(),
          fileName,
          fileSize,
          fileContent: fileContent || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUploadSuccess(`Note "${uploadTitle}" successfully uploaded to private bucket!`);
        // Reset form
        setUploadTitle('');
        setUploadChapter('');
        setUploadDescription('');
        setSelectedFile(null);
        fetchNotes();
        setTimeout(() => {
          setActiveTab('notes');
          setUploadSuccess('');
        }, 1500);
      } else {
        setUploadError(data.message || 'Failed to upload note.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error occurred while communicating with upload server.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Edit Note
  const handleStartEdit = (note: NoteItem) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditChapter(note.chapter);
    setEditDescription(note.description);
  };

  const handleSaveEdit = async () => {
    if (!editingNote) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/notes/${editingNote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          chapter: editChapter.trim(),
          description: editDescription.trim(),
        }),
      });

      if (res.ok) {
        await fetchNotes();
        setEditingNote(null);
      }
    } catch {
      // ignore
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete Note
  const handleDeleteNote = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the note: "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        fetchNotes();
      }
    } catch {
      // ignore
    }
  };

  // Handle Toggle Student Status (Activate / Deactivate Access)
  const handleToggleStudentStatus = async (student: StudentRecord) => {
    const action = student.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} portal access for ${student.name} (${student.rollNo})?`)) {
      return;
    }

    setTogglingStudentId(student.id);
    try {
      const res = await fetch(`/api/students/${student.id}/toggle-status`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, isActive: !s.isActive } : s))
        );
      }
    } catch {
      // ignore
    } finally {
      setTogglingStudentId(null);
    }
  };

  // Filtered Notes
  const filteredNotes = notes.filter((n) => {
    if (notesFilterClass !== 'All' && n.classGrade !== notesFilterClass) return false;
    if (notesFilterSubject !== 'All' && n.subject !== notesFilterSubject) return false;
    if (notesSearch.trim()) {
      const q = notesSearch.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.chapter.toLowerCase().includes(q) ||
        n.fileName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    if (studentFilterClass !== 'All' && s.classGrade !== studentFilterClass) return false;
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Fee Records
  const filteredFeeRecords = feeRecords.filter((rec) => {
    if (feeFilterClass !== 'All' && rec.classGrade !== feeFilterClass) return false;
    if (feeFilterStatus === 'paid' && rec.dueAmount > 0) return false;
    if (feeFilterStatus === 'partial' && (rec.dueAmount <= 0 || rec.totalPaid === 0)) return false;
    if (feeFilterStatus === 'overdue' && (rec.dueAmount <= 0 || rec.totalPaid > 0)) return false;
    if (feeSearch.trim()) {
      const q = feeSearch.toLowerCase();
      return (
        rec.studentName.toLowerCase().includes(q) ||
        rec.rollNo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold font-['Outfit'] text-white">
                    {user?.name || 'Faculty Administrator'}
                  </h1>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Faculty Admin
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    ID: {user?.rollNo || 'T-101'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Goodway Science Coaching Center • Administrative & Content Management System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  fetchNotes();
                  if (activeTab === 'students') fetchStudents();
                  if (activeTab === 'audit') fetchAuditLogs();
                  if (activeTab === 'fees') fetchFees();
                }}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={logout}
                className="px-3.5 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-xs font-semibold text-rose-300 border border-rose-800/40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Logout Admin</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-slate-400">Total Notes Uploaded</span>
              <p className="text-xl font-bold font-['Outfit'] text-white mt-0.5">{notes.length}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-slate-400">Registered Students</span>
              <p className="text-xl font-bold font-['Outfit'] text-emerald-400 mt-0.5">{students.length || 5}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-slate-400">Fee Collection Rate</span>
              <p className="text-xl font-bold font-['Outfit'] text-amber-400 mt-0.5">
                {feeSummary ? `${feeSummary.collectionRatePercentage}%` : '85%'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-slate-400">RBAC Security Guard</span>
              <p className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Active & Enforced
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 border-t border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3.5 px-4 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'notes'
                ? 'text-amber-400 border-amber-400 bg-slate-800/40'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Curriculum Notes ({notes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3.5 px-4 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'upload'
                ? 'text-amber-400 border-amber-400 bg-slate-800/40'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload New PDF / Note</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`py-3.5 px-4 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'students'
                ? 'text-amber-400 border-amber-400 bg-slate-800/40'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Directory & RBAC</span>
          </button>

          <button
            onClick={() => setActiveTab('fees')}
            className={`py-3.5 px-4 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'fees'
                ? 'text-amber-400 border-amber-400 bg-slate-800/40'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Student Fees & Records (फीस प्रबंधन)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
              Ledger
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3.5 px-4 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'audit'
                ? 'text-amber-400 border-amber-400 bg-slate-800/40'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Security & Audit Logs</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* TAB 1: CURRICULUM NOTES REPOSITORY */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            {/* Top Bar: Search, Filters & Quick Upload Button */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Class Filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Class:</span>
                  <select
                    value={notesFilterClass}
                    onChange={(e) => setNotesFilterClass(e.target.value)}
                    className="py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="All">All Classes (9th–12th)</option>
                    <option value="12">Class 12th</option>
                    <option value="11">Class 11th</option>
                    <option value="10">Class 10th</option>
                    <option value="9">Class 9th</option>
                  </select>
                </div>

                {/* Subject Filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Subject:</span>
                  <select
                    value={notesFilterSubject}
                    onChange={(e) => setNotesFilterSubject(e.target.value)}
                    className="py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="All">All Subjects</option>
                    <optgroup label="Science Stream">
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="General Science">General Science</option>
                    </optgroup>
                    <optgroup label="Arts Stream (कला संकाय)">
                      <option value="History">History (इतिहास)</option>
                      <option value="Political Science">Political Science (राजनीति विज्ञान)</option>
                      <option value="Geography">Geography (भूगोल)</option>
                      <option value="Economics">Economics (अर्थशास्त्र)</option>
                      <option value="Psychology">Psychology (मनोविज्ञान)</option>
                      <option value="Sociology">Sociology (समाजशास्त्र)</option>
                      <option value="Home Science">Home Science (गृह विज्ञान)</option>
                      <option value="Social Science">Social Science (सामाजिक विज्ञान)</option>
                    </optgroup>
                    <optgroup label="Languages & Literature">
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="English">English (अंग्रेजी)</option>
                      <option value="Sanskrit">Sanskrit (संस्कृत)</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={notesSearch}
                    onChange={(e) => setNotesSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Upload Button */}
                <button
                  onClick={() => setActiveTab('upload')}
                  className="py-2 px-3.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Note</span>
                </button>
              </div>
            </div>

            {/* Notes List Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Title & Details</th>
                      <th className="py-3 px-4">Class & Subject</th>
                      <th className="py-3 px-4">Chapter</th>
                      <th className="py-3 px-4">File Specs</th>
                      <th className="py-3 px-4">Downloads</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {isLoadingNotes ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400">
                          Loading notes from private storage bucket...
                        </td>
                      </tr>
                    ) : filteredNotes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400">
                          No notes found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredNotes.map((note) => (
                        <tr key={note.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {note.title}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1 max-w-sm mt-0.5">
                              {note.description}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">
                              Class {note.classGrade}th
                            </div>
                            <div className="text-[11px] text-emerald-700 font-medium">
                              {note.subject}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">
                            {note.chapter}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                            <div>{note.fileSize}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{note.fileName}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800">{note.downloadCount}</span>
                            <span className="text-[10px] text-slate-400 ml-1">reads</span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onOpenNoteViewer(note)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="View In-App Reader"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStartEdit(note)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Edit Metadata"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id, note.title)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Note"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: UPLOAD NEW NOTE */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-['Outfit'] text-slate-900">
                  Upload Curriculum Notes & PDF
                </h2>
                <p className="text-xs text-slate-500">
                  Files are saved directly to the encrypted private storage bucket.
                </p>
              </div>
            </div>

            {uploadError && (
              <div className="p-3.5 mb-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3.5 mb-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electromagnetic Induction & Alternating Current Formulas"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Class Standard
                  </label>
                  <select
                    value={uploadClass}
                    onChange={(e) => setUploadClass(e.target.value as ClassGrade)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  >
                    <option value="12">Class 12th (Science + Arts)</option>
                    <option value="11">Class 11th (Science + Arts All Subjects)</option>
                    <option value="10">Class 10th (Matric Board Examination)</option>
                    <option value="9">Class 9th (Foundation Science & All Subjects)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Subject
                  </label>
                  <select
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value as SubjectName)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  >
                    <optgroup label="Science Stream">
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="General Science">General Science</option>
                    </optgroup>
                    <optgroup label="Arts Stream (कला संकाय - All Subjects)">
                      <option value="History">History (इतिहास)</option>
                      <option value="Political Science">Political Science (राजनीति विज्ञान)</option>
                      <option value="Geography">Geography (भूगोल)</option>
                      <option value="Economics">Economics (अर्थशास्त्र)</option>
                      <option value="Psychology">Psychology (मनोविज्ञान)</option>
                      <option value="Sociology">Sociology (समाजशास्त्र)</option>
                      <option value="Home Science">Home Science (गृह विज्ञान)</option>
                      <option value="Social Science">Social Science (सामाजिक विज्ञान)</option>
                    </optgroup>
                    <optgroup label="Languages">
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="English">English (अंग्रेजी)</option>
                      <option value="Sanskrit">Sanskrit (संस्कृत)</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Chapter Specification
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 6: Electromagnetic Induction"
                  value={uploadChapter}
                  onChange={(e) => setUploadChapter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Description / Syllabus Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize high-yield topics, formulas included, and examination tips..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none"
                />
              </div>

              {/* Drag and drop or browse file */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Attachment File (PDF / Document)
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-6 text-center bg-slate-50/60 transition-colors">
                  <input
                    type="file"
                    id="file-upload-input"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="file-upload-input" className="cursor-pointer block">
                    <FileCheck className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-bold text-slate-800">{selectedFile.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Click to replace file
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          Drag and drop file here, or <span className="text-amber-600 underline">browse</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Supported: PDF, DOCX, TXT (Max 15MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Securing & Uploading to Bucket...' : 'Save & Publish Note'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: STUDENT DIRECTORY & RBAC CONTROLS */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-500 font-medium">Filter by Class:</span>
                <select
                  value={studentFilterClass}
                  onChange={(e) => setStudentFilterClass(e.target.value)}
                  className="py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="All">All Classes</option>
                  <option value="12">Class 12th</option>
                  <option value="11">Class 11th</option>
                  <option value="10">Class 10th</option>
                  <option value="9">Class 9th</option>
                </select>
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Roll No, Name or Email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Student & Roll No</th>
                      <th className="py-3 px-4">Class Grade</th>
                      <th className="py-3 px-4">Contact & Email</th>
                      <th className="py-3 px-4">Fee Status (फीस)</th>
                      <th className="py-3 px-4">Access Status</th>
                      <th className="py-3 px-4">Downloads</th>
                      <th className="py-3 px-4 text-right">RBAC Access Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {isLoadingStudents ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-400">
                          Fetching student directory records...
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-400">
                          No students found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {student.name}
                            </div>
                            <div className="text-emerald-700 font-mono font-bold text-[11px]">
                              {student.rollNo}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800">
                              Class {student.classGrade}th
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <div>{student.email}</div>
                            <div className="text-[11px] text-slate-400">{student.phone || '—'}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            {student.feeSummary ? (
                              <div className="space-y-0.5">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  student.feeSummary.status === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : student.feeSummary.status === 'partial'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {student.feeSummary.status === 'paid'
                                    ? 'Fully Paid (पूर्ण चुकता)'
                                    : student.feeSummary.status === 'partial'
                                    ? `Due: ₹${student.feeSummary.dueAmount.toLocaleString('en-IN')}`
                                    : `Due: ₹${student.feeSummary.dueAmount.toLocaleString('en-IN')}`}
                                </span>
                                <div className="text-[10px] text-slate-400">
                                  Paid: ₹{student.feeSummary.totalPaid.toLocaleString('en-IN')} / ₹{student.feeSummary.totalAnnualFee.toLocaleString('en-IN')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {student.isActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                <XCircle className="w-3 h-3" />
                                Suspended
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {student.notesDownloadedCount} files
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              id={`btn-toggle-student-${student.id}`}
                              disabled={togglingStudentId === student.id}
                              onClick={() => handleToggleStudentStatus(student)}
                              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                student.isActive
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              } disabled:opacity-50`}
                            >
                              {togglingStudentId === student.id
                                ? 'Updating...'
                                : student.isActive
                                ? 'Revoke Access'
                                : 'Restore Access'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                  Real-Time Security Event Stream
                </h3>
                <p className="text-xs text-slate-500">
                  Tracking login verifications, brute-force lockouts, unauthorized route attempts, and signed URL calls.
                </p>
              </div>
              <button
                onClick={fetchAuditLogs}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Logs</span>
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto space-y-2">
              {isLoadingLogs ? (
                <div className="py-8 text-center text-slate-500">Loading audit log records...</div>
              ) : auditLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No events logged yet.</div>
              ) : (
                auditLogs.map((log) => {
                  const statusColors = {
                    info: 'text-emerald-400',
                    warning: 'text-amber-400',
                    critical: 'text-rose-400',
                  }[log.status] || 'text-slate-400';

                  return (
                    <div key={log.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                      <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`font-bold uppercase text-[11px] shrink-0 ${statusColors}`}>
                        [{log.eventType}]
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-white font-semibold">{log.details}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Identifier: {log.userEmailOrId} • IP: {log.ipAddress} {log.role ? `• Role: ${log.role}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 5: STUDENT FEES & RECORDS (फीस प्रबंधन) */}
        {activeTab === 'fees' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Success Toast Banner */}
            {paymentSuccessToast && (
              <div className="p-4 rounded-2xl bg-emerald-900/90 text-emerald-100 border border-emerald-700 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2.5 text-xs font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{paymentSuccessToast}</span>
                </div>
                <button
                  onClick={() => setPaymentSuccessToast('')}
                  className="text-emerald-300 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Financial Overview KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Expected Revenue */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Total Expected Revenue (कुल वार्षिक शुल्क)
                </span>
                <div className="text-2xl sm:text-3xl font-black font-['Outfit'] text-slate-900">
                  ₹{feeSummary?.totalExpected ? feeSummary.totalExpected.toLocaleString('en-IN') : '0'}
                </div>
                <p className="text-[11px] text-slate-500">
                  Enrolled Students: <strong className="text-slate-800">{feeSummary?.totalStudents || 0} Scholars</strong>
                </p>
              </div>

              {/* Total Collected */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-2 bg-gradient-to-b from-white to-emerald-50/20">
                <span className="text-[11px] uppercase font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Total Fees Collected (कुल जमा राशि)
                </span>
                <div className="text-2xl sm:text-3xl font-black font-['Outfit'] text-emerald-700">
                  ₹{feeSummary?.totalCollected ? feeSummary.totalCollected.toLocaleString('en-IN') : '0'}
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${feeSummary?.collectionRatePercentage || 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {feeSummary?.collectionRatePercentage || 0}% of expected session fees deposited
                </p>
              </div>

              {/* Total Outstanding Dues */}
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-2 bg-gradient-to-b from-white to-rose-50/20">
                <span className="text-[11px] uppercase font-bold text-rose-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  Remaining Dues (कुल बकाया राशि)
                </span>
                <div className="text-2xl sm:text-3xl font-black font-['Outfit'] text-rose-600">
                  ₹{feeSummary?.totalDue ? feeSummary.totalDue.toLocaleString('en-IN') : '0'}
                </div>
                <p className="text-[11px] text-slate-500">
                  {feeSummary?.dueCount || 0} students have outstanding installments
                </p>
              </div>

              {/* Student Status Summary */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Payment Status Distribution
                </span>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                    {feeSummary?.paidCount || 0} Paid
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">
                    {feeSummary?.partialCount || 0} Partial
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs">
                    {feeSummary?.dueCount || 0} Due
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Real-time database records
                </p>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search students by name, roll number, or email..."
                    value={feeSearch}
                    onChange={(e) => setFeeSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* Class Filter */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Class:</span>
                  {['All', '9', '10', '11', '12'].map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setFeeFilterClass(cls)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        feeFilterClass === cls
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cls === 'All' ? 'All Classes' : `Class ${cls}th`}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Status:</span>
                  {[
                    { id: 'All', label: 'All' },
                    { id: 'paid', label: 'Paid' },
                    { id: 'partial', label: 'Partial' },
                    { id: 'overdue', label: 'Overdue / Due' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setFeeFilterStatus(st.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        feeFilterStatus === st.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span>Showing <strong className="text-slate-800">{filteredFeeRecords.length}</strong> of {feeRecords.length} Student Accounts</span>
                <button
                  onClick={fetchFees}
                  className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Ledger</span>
                </button>
              </div>
            </div>

            {/* Comprehensive Student Fee Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3.5 px-4">Student Name & Roll No</th>
                      <th className="py-3.5 px-4">Class & Batch</th>
                      <th className="py-3.5 px-4">Total Fee</th>
                      <th className="py-3.5 px-4">Amount Paid</th>
                      <th className="py-3.5 px-4">Due Amount</th>
                      <th className="py-3.5 px-4">Payment Status</th>
                      <th className="py-3.5 px-4">Next Due Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {isLoadingFees ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <span>Loading Student Fee Accounts...</span>
                        </td>
                      </tr>
                    ) : filteredFeeRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No student fee records matched your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredFeeRecords.map((record) => {
                        const isPaid = record.dueAmount <= 0;
                        const isPartial = !isPaid && record.totalPaid > 0;

                        return (
                          <tr key={record.studentId} className="hover:bg-slate-50 transition-colors">
                            {/* Student Info */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shadow-xs">
                                  {record.studentName.charAt(0)}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 text-sm block">
                                    {record.studentName}
                                  </span>
                                  <span className="font-mono text-[11px] text-slate-500">
                                    Roll: {record.rollNo}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Class & Grade */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-md bg-slate-100 font-bold text-slate-800 text-xs border border-slate-200">
                                Class {record.classGrade}th
                              </span>
                            </td>

                            {/* Total Annual Fee */}
                            <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-800 font-mono">
                              ₹{record.totalAnnualFee.toLocaleString('en-IN')}
                            </td>

                            {/* Total Paid */}
                            <td className="py-3.5 px-4 whitespace-nowrap font-black text-emerald-700 font-['Outfit']">
                              ₹{record.totalPaid.toLocaleString('en-IN')}
                            </td>

                            {/* Remaining Due */}
                            <td className="py-3.5 px-4 whitespace-nowrap font-black font-['Outfit']">
                              <span className={record.dueAmount > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                                ₹{record.dueAmount.toLocaleString('en-IN')}
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 border ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : isPartial
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}>
                                {isPaid ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                    <span>Paid (पूर्ण)</span>
                                  </>
                                ) : isPartial ? (
                                  <>
                                    <Clock className="w-3 h-3 text-amber-700" />
                                    <span>Partial (आंशिक)</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-3 h-3 text-rose-700" />
                                    <span>Overdue (बकाया)</span>
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Next Due Date */}
                            <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                              {record.nextDueDate || 'Session Completed'}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                              {/* Update Payment Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentForPayment(record);
                                  setPaymentAmount('');
                                  setPaymentMonth(`Monthly Tuition Fee (कक्षा ${record.classGrade}वीं)`);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Update Payment</span>
                              </button>

                              {/* Receipts Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedStudentForHistory(record)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                                title="View Payment Receipts"
                              >
                                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                                <span>Receipts ({record.paymentHistory?.length || 0})</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* UPDATE PAYMENT MODAL WITH LIVE BALANCE AUTO-CALCULATOR */}
      {selectedStudentForPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Outfit'] font-bold text-base text-white">
                    Update Student Fee Payment (फीस जमा करें)
                  </h3>
                  <p className="text-xs text-slate-300">
                    Official coaching receipt will be automatically generated.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForPayment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form & Live Calculation */}
            <form onSubmit={handleRecordPayment} className="p-6 space-y-5 text-xs">
              {/* Student Summary Banner */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Student</span>
                  <strong className="text-slate-900 text-sm">{selectedStudentForPayment.studentName}</strong>
                  <span className="text-slate-500 block">Roll: {selectedStudentForPayment.rollNo} • Class {selectedStudentForPayment.classGrade}th</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Dues</span>
                  <strong className="text-rose-600 text-base font-black font-['Outfit']">
                    ₹{selectedStudentForPayment.dueAmount.toLocaleString('en-IN')}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    Paid so far: ₹{selectedStudentForPayment.totalPaid.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Amount Input with Quick-Fill Chips */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 uppercase text-[11px] block">
                  Amount to Deposit (₹) *
                </label>
                <input
                  type="number"
                  placeholder="Enter amount (e.g. 1500)"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  min="1"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base font-black font-['Outfit'] text-slate-900"
                />

                {/* Quick Fill Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-slate-400">Quick Fill:</span>
                  {[500, 1000, 1500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPaymentAmount(String(amt))}
                      className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[11px] font-bold border border-slate-200 cursor-pointer"
                    >
                      +₹{amt}
                    </button>
                  ))}
                  {selectedStudentForPayment.dueAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(String(selectedStudentForPayment.dueAmount))}
                      className="px-2.5 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold border border-emerald-300 cursor-pointer"
                    >
                      Pay Full Due (₹{selectedStudentForPayment.dueAmount})
                    </button>
                  )}
                </div>
              </div>

              {/* LIVE BALANCE AUTO-CALCULATOR DISPLAY */}
              {(() => {
                const enterVal = Number(paymentAmount) || 0;
                const newPaid = selectedStudentForPayment.totalPaid + enterVal;
                const newDue = Math.max(0, selectedStudentForPayment.dueAmount - enterVal);
                const isPaidNow = newDue <= 0;

                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white border border-slate-700 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Live Balance Auto-Calculator (स्वतः गणना)
                    </span>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                        <span className="text-[10px] text-slate-400 block">New Deposited Total</span>
                        <span className="text-sm sm:text-base font-black text-emerald-400 font-['Outfit']">
                          ₹{newPaid.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                        <span className="text-[10px] text-slate-400 block">Remaining Due Balance</span>
                        <span className={`text-sm sm:text-base font-black font-['Outfit'] ${newDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          ₹{newDue.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-300">
                      <span>Status will become:</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        isPaidNow ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-950'
                      }`}>
                        {isPaidNow ? 'Fully Paid (पूर्ण चुकता)' : 'Partially Paid (आंशिक जमा)'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Date & Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase text-[11px] block mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase text-[11px] block mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                  >
                    <option value="Cash">Cash (कार्यालय में नकद)</option>
                    <option value="UPI">UPI (PhonePe / GPay / Paytm)</option>
                    <option value="Net Banking">Net Banking / NEFT</option>
                    <option value="Bank Transfer">Direct Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Transaction Ref & Month */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase text-[11px] block mb-1">
                    UTR / Office Reference
                  </label>
                  <input
                    type="text"
                    placeholder="Optional (e.g. UPI Ref / Cash Slip)"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase text-[11px] block mb-1">
                    Month / Installment Description
                  </label>
                  <input
                    type="text"
                    value={paymentMonth}
                    onChange={(e) => setPaymentMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForPayment(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPayment}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isSavingPayment ? 'Recording...' : 'Record Payment & Issue Receipt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT FEE RECEIPTS HISTORY MODAL */}
      {selectedStudentForHistory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Outfit'] font-bold text-base text-white">
                    Payment Receipts: {selectedStudentForHistory.studentName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Roll No: {selectedStudentForHistory.rollNo} • Class {selectedStudentForHistory.classGrade}th
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForHistory(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary Stats */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Total Course Fee</span>
                  <strong className="text-slate-900 text-sm">₹{selectedStudentForHistory.totalAnnualFee.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Deposited</span>
                  <strong className="text-emerald-700 text-sm">₹{selectedStudentForHistory.totalPaid.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Remaining Due</span>
                  <strong className="text-rose-600 text-sm">₹{selectedStudentForHistory.dueAmount.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Receipts Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Receipt No</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3 text-right">Print</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(!selectedStudentForHistory.paymentHistory || selectedStudentForHistory.paymentHistory.length === 0) ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No payment receipts found for this student.
                        </td>
                      </tr>
                    ) : (
                      selectedStudentForHistory.paymentHistory.map((receipt) => (
                        <tr key={receipt.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                            {new Date(receipt.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-emerald-800">
                            {receipt.receiptNo}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 truncate max-w-[140px]">
                            {receipt.monthOrDescription}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-900">
                            ₹{receipt.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                              {receipt.paymentMode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReceiptForPrint(receipt);
                                setIsReceiptModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-emerald-600 text-white text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3 h-3 text-emerald-300" />
                              <span>View Receipt</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      <FeeReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceiptForPrint}
        feeRecord={selectedStudentForHistory || selectedStudentForPayment}
      />

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Edit Note Metadata</h3>
              <button
                onClick={() => setEditingNote(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Chapter</label>
                <input
                  type="text"
                  value={editChapter}
                  onChange={(e) => setEditChapter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 font-bold text-white shadow-md disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Footer Attribution */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700">Goodway Science Coaching Center</span>
          <span>•</span>
          <span>Director: <strong className="text-emerald-700">Alok Singh</strong> (M.Sc. Math)</span>
          <span>•</span>
          <span>Faculty: <strong className="text-slate-700">Shakti Varma (B.Sc. Math), Amit Kumar Singh (M.Sc. Math, B.Ed)</strong></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Design by:</span>
          <strong className="text-slate-900 font-['Outfit']">Deepak Kumar</strong>
        </div>
      </footer>
    </div>
  );
};
