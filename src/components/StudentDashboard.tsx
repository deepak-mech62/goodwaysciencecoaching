import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { NoteItem, ClassGrade, SubjectName, StreamType } from '../types';
import { 
  Atom, 
  FlaskConical, 
  Dna, 
  Calculator, 
  Search, 
  Download, 
  Eye, 
  FileText, 
  GraduationCap, 
  LogOut, 
  Calendar, 
  Clock, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Filter, 
  User, 
  AlertCircle,
  Award,
  Play,
  Landmark,
  Layers,
  HelpCircle,
  ChevronRight,
  Receipt,
  CreditCard,
  ArrowUpRight
} from 'lucide-react';
import { CLASS_SUBJECTS, SAMPLE_TEST_SERIES, SubjectDetail, TestSeriesItem } from '../data/curriculumData';
import { PracticeTestModal } from './PracticeTestModal';
import { StudentFeeView } from './StudentFeeView';

interface StudentDashboardProps {
  onOpenNoteViewer: (note: NoteItem) => void;
  onTriggerDownload: (note: NoteItem) => void;
  defaultTab?: 'notes' | 'tests' | 'fee';
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onOpenNoteViewer,
  onTriggerDownload,
  defaultTab = 'notes',
}) => {
  const { user, token, logout } = useAuth();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'tests' | 'fee'>(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const [syncedFeeSummary, setSyncedFeeSummary] = useState(user?.feeSummary);

  useEffect(() => {
    if (user?.id) {
      const localData = localStorage.getItem(`goodway_student_fee_${user.id}`);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setSyncedFeeSummary({
            totalAnnualFee: parsed.totalAnnualFee,
            totalPaid: parsed.totalPaid,
            dueAmount: parsed.dueAmount,
            status: parsed.status,
            nextDueDate: parsed.nextDueDate,
          });
          return;
        } catch {
          // ignore
        }
      }
    }
    setSyncedFeeSummary(user?.feeSummary);
  }, [user, activeTab]);
  const [selectedClass, setSelectedClass] = useState<ClassGrade>(user?.classGrade || '12');
  const [selectedStream, setSelectedStream] = useState<StreamType>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showProfileDrawer, setShowProfileDrawer] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeTestModal, setActiveTestModal] = useState<TestSeriesItem | null>(null);

  // Sync selectedClass with user classGrade on mount
  useEffect(() => {
    if (user?.classGrade) {
      setSelectedClass(user.classGrade);
    }
  }, [user]);

  // Reset subject filter when class changes
  useEffect(() => {
    setSelectedSubject('All');
    setSelectedStream('all');
  }, [selectedClass]);

  // Fetch notes from server
  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedClass) queryParams.append('classGrade', selectedClass);
      if (selectedSubject !== 'All') queryParams.append('subject', selectedSubject);
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());

      const res = await fetch(`/api/notes?${queryParams.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.notes)) {
          setNotes(data.notes);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [selectedClass, selectedSubject, searchQuery, token]);

  // Get subjects for selected class and stream
  const currentClassSubjects = useMemo(() => {
    const subs = CLASS_SUBJECTS[selectedClass] || [];
    return subs.filter((sub) => {
      if (selectedClass === '9' || selectedClass === '10') return true;
      if (selectedStream === 'all') return true;
      if (sub.stream === 'general') return true;
      return sub.stream === selectedStream;
    });
  }, [selectedClass, selectedStream]);

  // Get tests for selected class and stream
  const currentClassTests = useMemo(() => {
    return SAMPLE_TEST_SERIES.filter((t) => {
      if (t.classGrade !== selectedClass) return false;
      if (selectedSubject !== 'All' && t.subjectName.toLowerCase() !== selectedSubject.toLowerCase()) return false;
      if (selectedStream === 'all' || !t.stream) return true;
      return t.stream === 'all' || t.stream === selectedStream;
    });
  }, [selectedClass, selectedStream, selectedSubject]);

  const handleDownloadClick = async (note: NoteItem) => {
    setDownloadingId(note.id);
    await onTriggerDownload(note);
    setDownloadingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Banner / Student Greeting Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold font-['Outfit'] text-white">
                    {user?.name}
                  </h1>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Class {user?.classGrade || selectedClass}th
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Roll: <strong className="font-mono text-emerald-400">{user?.rollNo}</strong>
                  </span>

                  {user?.feeSummary && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('fee')}
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer transition-all ${
                        user.feeSummary.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                          : user.feeSummary.status === 'partial'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                      }`}
                      title="Click to view fee status & receipts"
                    >
                      <Receipt className="w-3 h-3" />
                      <span>
                        {user.feeSummary.status === 'paid'
                          ? 'Fee: Fully Paid (चुकता)'
                          : `Fee Due: ₹${user.feeSummary.dueAmount.toLocaleString('en-IN')}`}
                      </span>
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Goodway Science Digital Study Repository • Authenticated Session
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 self-start sm:self-center">
              <button
                onClick={() => setActiveTab('fee')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'fee'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>My Fees (फीस)</span>
              </button>

              <button
                onClick={() => setShowProfileDrawer(!showProfileDrawer)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>My Profile</span>
              </button>

              <button
                onClick={logout}
                className="px-3.5 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-xs font-semibold text-rose-300 border border-rose-800/40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Quick Profile Summary Dropdown/Card */}
          {showProfileDrawer && (
            <div className="mt-6 p-4 sm:p-6 bg-slate-800/90 rounded-2xl border border-slate-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs animate-in fade-in">
              <div className="space-y-1">
                <span className="text-slate-400">Official Student Email</span>
                <p className="font-semibold text-slate-200">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Account Access Status</span>
                <p className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Scholar
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Fee Payment Status</span>
                <p className={`font-bold flex items-center gap-1 ${
                  user?.feeSummary?.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  <Receipt className="w-3.5 h-3.5" />
                  {user?.feeSummary?.status === 'paid' 
                    ? 'Fully Paid (पूर्ण चुकता)' 
                    : `Due: ₹${user?.feeSummary?.dueAmount?.toLocaleString('en-IN') || 0}`}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Actions</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('fee');
                    setShowProfileDrawer(false);
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Open Fee Portal</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Navigation Tabs: Notes Repository vs Online Test Series vs Fee & Receipts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Chapter Notes (नोट्स)</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'notes' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {notes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tests')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'tests'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-300" />
              <span>Test Series (टेस्ट)</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'tests' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {currentClassTests.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fee')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'fee'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Student Fee & Receipts (फीस व रसीद)</span>
              {user?.feeSummary && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  activeTab === 'fee'
                    ? 'bg-white text-emerald-800'
                    : user.feeSummary.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {user.feeSummary.status === 'paid' ? 'Paid' : `₹${user.feeSummary.dueAmount.toLocaleString('en-IN')} Due`}
                </span>
              )}
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Class 9th, 10th, 11th & 12th Full Curriculum & Digital Ledger</span>
          </div>
        </div>

        {/* Render Fee View if activeTab === 'fee' */}
        {activeTab === 'fee' && <StudentFeeView />}

        {/* Class Switcher & Filter Bar (shown when not on fee tab) */}
        {activeTab !== 'fee' && (
          <>
          {/* Prominent "My Fee Status & Dues" Banner Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-5 sm:p-6 text-white border border-slate-700 shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" />
                    My Fee Status & Dues (मेरी फीस व बकाया)
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    (syncedFeeSummary?.dueAmount === 0 || syncedFeeSummary?.status === 'paid')
                      ? 'bg-emerald-500 text-white'
                      : (syncedFeeSummary?.totalPaid && syncedFeeSummary?.totalPaid > 0)
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-rose-500 text-white'
                  }`}>
                    {(syncedFeeSummary?.dueAmount === 0 || syncedFeeSummary?.status === 'paid')
                      ? 'Paid (पूर्ण चुकता)'
                      : (syncedFeeSummary?.totalPaid && syncedFeeSummary?.totalPaid > 0)
                      ? 'Partial (आंशिक जमा)'
                      : 'Overdue / Due (बकाया)'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-['Outfit'] tracking-tight">
                  Academic Fee Status: <span className="text-emerald-400">Class {user?.classGrade || '12'}th</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Total Course Fee: <strong className="text-white">₹{syncedFeeSummary?.totalAnnualFee?.toLocaleString('en-IN') || '18,000'}</strong> • Paid: <strong className="text-emerald-400">₹{syncedFeeSummary?.totalPaid?.toLocaleString('en-IN') || '0'}</strong> • Remaining Due: <strong className={syncedFeeSummary?.dueAmount ? 'text-rose-400' : 'text-emerald-400'}>₹{syncedFeeSummary?.dueAmount?.toLocaleString('en-IN') || '0'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('fee')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>View Fee Ledger & Receipts</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('fee')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Pay Online / Inquiry</span>
                </button>
              </div>
            </div>

            {/* Subtle glow */}
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
          {/* Class Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                Select Academic Standard / Class (कक्षा चुनें):
              </span>
              <span className="text-[11px] text-slate-500">
                Enrolled Grade: <strong className="text-slate-800">Class {user?.classGrade || '12'}th</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {(['9', '10', '11', '12'] as ClassGrade[]).map((grade) => {
                const isSelected = selectedClass === grade;
                const isUserClass = user?.classGrade === grade;
                return (
                  <button
                    key={grade}
                    onClick={() => {
                      setSelectedClass(grade);
                      setSelectedSubject('All');
                    }}
                    className={`py-3.5 px-4 rounded-xl text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/50'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-base font-extrabold font-['Outfit'] ${
                        isSelected ? 'text-emerald-400' : 'text-slate-900'
                      }`}>
                        Class {grade}th
                      </span>
                      {isUserClass && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          Enrolled
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] line-clamp-1 ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                      {grade === '9' && 'Foundation: All Subjects'}
                      {grade === '10' && 'Matric Board: All Subjects'}
                      {grade === '11' && '11th: All Subjects (Sci + Arts)'}
                      {grade === '12' && '12th: Science + Arts All'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stream Selector for 11th and 12th */}
          {(selectedClass === '11' || selectedClass === '12') && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700">
                  Class {selectedClass}th Stream:
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStream('all');
                    setSelectedSubject('All');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedStream === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All Subjects / सभी विषय
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStream('science');
                    setSelectedSubject('All');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    selectedStream === 'science'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <Atom className="w-3 h-3" />
                  Science / विज्ञान
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStream('arts');
                    setSelectedSubject('All');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    selectedStream === 'arts'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Landmark className="w-3 h-3" />
                  Arts / कला संकाय (All Subjects)
                </button>
              </div>
            </div>
          )}

          {/* Subject Pills & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-4 border-t border-slate-100">
            {/* Subject Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedSubject('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedSubject === 'All'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>All Subjects / सभी विषय</span>
              </button>

              {currentClassSubjects.map((sub) => {
                const isSelected = selectedSubject.toLowerCase() === sub.name.toLowerCase();
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubject(sub.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{sub.name}</span>
                    <span className="text-[11px] font-semibold text-emerald-700">({sub.hindiName})</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search chapter, subject, notes (खोजें)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* TAB 1: CHAPTER NOTES VIEW */}
        {activeTab === 'notes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold font-['Outfit'] text-slate-900">
                  Class {selectedClass}th Chapter Modules ({notes.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Tap any chapter button to read in-app or download an authenticated PDF copy.
                </p>
              </div>
              <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Watermarked with Roll No</span>
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Loading Class {selectedClass} curriculum notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-lg mx-auto space-y-4">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-base">
                  No notes uploaded yet for Class {selectedClass} {selectedSubject !== 'All' ? `(${selectedSubject})` : ''}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The faculty is preparing detailed lecture notes for this subject. In the meantime, you can practice with the Online Test Series!
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('tests')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Award className="w-4 h-4" />
                    <span>Open Class {selectedClass}th Tests</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSubject('All');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    View All Subjects
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {notes.map((note) => {
                  const subjectBadgeStyles = {
                    Physics: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    Chemistry: 'bg-amber-50 text-amber-700 border-amber-200',
                    Biology: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    Mathematics: 'bg-blue-50 text-blue-700 border-blue-200',
                    History: 'bg-amber-50 text-amber-800 border-amber-200',
                    'Political Science': 'bg-rose-50 text-rose-800 border-rose-200',
                    Geography: 'bg-teal-50 text-teal-800 border-teal-200',
                    Economics: 'bg-purple-50 text-purple-800 border-purple-200',
                  }[note.subject] || 'bg-slate-50 text-slate-700 border-slate-200';

                  return (
                    <div
                      key={note.id}
                      className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Header: Subject & Class */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${subjectBadgeStyles}`}>
                            {note.subject}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {note.fileSize} • {note.fileName}
                          </span>
                        </div>

                        {/* Chapter & Title */}
                        <div className="mb-2">
                          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                            {note.chapter}
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] group-hover:text-emerald-800 transition-colors mt-0.5">
                            {note.title}
                          </h3>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                          {note.description}
                        </p>

                        {/* Metadata Footer */}
                        <div className="text-[11px] text-slate-400 flex items-center justify-between pb-4 border-b border-slate-100">
                          <span>By {note.uploadedBy}</span>
                          <span>{note.downloadCount} students read</span>
                        </div>
                      </div>

                      {/* Big Touch-Friendly Action Buttons */}
                      <div className="pt-4 grid grid-cols-2 gap-3">
                        {/* In-App Reader Button */}
                        <button
                          id={`btn-view-note-${note.id}`}
                          onClick={() => onOpenNoteViewer(note)}
                          className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer group/btn"
                        >
                          <Eye className="w-4 h-4 text-emerald-400 group-hover/btn:scale-110 transition-transform" />
                          <span>Read In-App</span>
                        </button>

                        {/* Secure Download Button */}
                        <button
                          id={`btn-download-note-${note.id}`}
                          disabled={downloadingId === note.id}
                          onClick={() => handleDownloadClick(note)}
                          className="py-3 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Download className="w-4 h-4 text-emerald-600" />
                          <span>{downloadingId === note.id ? 'Signing...' : 'Download PDF'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ONLINE TEST SERIES VIEW */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold font-['Outfit'] text-slate-900 flex items-center gap-2">
                  <Award className="w-6 h-6 text-emerald-600" />
                  <span>Class {selectedClass}th Online Test Series & Practice</span>
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Timed tests with real-time scoring, question jump navigation, and complete answer explanations.
                </p>
              </div>

              <div className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {currentClassTests.length} Interactive Mock Tests Ready
              </div>
            </div>

            {currentClassTests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md mx-auto space-y-3">
                <Award className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">No tests found for this filter</h3>
                <p className="text-xs text-slate-500">
                  Try switching the stream filter or selecting "All Subjects".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubject('All');
                    setSelectedStream('all');
                  }}
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Reset Test Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {currentClassTests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${test.badgeColor}`}>
                          {test.badge}
                        </span>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Class {test.classGrade}th • {test.subjectName}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] group-hover:text-emerald-700 transition-colors">
                        {test.hindiTitle}
                      </h3>
                      <p className="text-xs text-slate-500 italic mb-2">
                        {test.title}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        {test.description}
                      </p>

                      <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Duration</span>
                          <strong className="text-slate-800 flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            {test.durationMinutes}m
                          </strong>
                        </div>
                        <div className="border-x border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Questions</span>
                          <strong className="text-slate-800">
                            {test.questionsCount} MCQs
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Max Marks</span>
                          <strong className="text-emerald-700">
                            {test.totalMarks}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500">
                        Difficulty: <strong className="text-slate-800">{test.difficulty}</strong>
                      </span>

                      <button
                        type="button"
                        onClick={() => setActiveTestModal(test)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Test (टेस्ट दें)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </>
        )}

        {/* Modal: Interactive Test */}
        {activeTestModal && (
          <PracticeTestModal
            test={activeTestModal}
            onClose={() => setActiveTestModal(null)}
          />
        )}

        {/* Footer Attribution */}
        <footer className="mt-14 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700">Goodway Science Coaching Center</span>
            <span>•</span>
            <span>Director: <strong className="text-emerald-700">Alok Singh</strong> (M.Sc. Math)</span>
            <span>•</span>
            <span>Teachers: <strong className="text-slate-700">Shakti Varma (B.Sc. Math), Amit Kumar Singh (M.Sc. Math, B.Ed)</strong></span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Design by:</span>
            <strong className="text-slate-900 font-['Outfit']">Deepak Kumar</strong>
          </div>
        </footer>
      </div>
    </div>
  );
};
