import React, { useState } from 'react';
import { 
  Atom, 
  FlaskConical, 
  Dna, 
  Calculator, 
  Globe, 
  BookOpen, 
  Languages, 
  FileText, 
  Landmark, 
  Scale, 
  TrendingUp, 
  Brain, 
  Users, 
  Home, 
  Award, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Layers, 
  Filter,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { CLASS_SUBJECTS, SAMPLE_TEST_SERIES, SubjectDetail, TestSeriesItem } from '../data/curriculumData';
import { ClassGrade, StreamType, UserRole } from '../types';
import { PracticeTestModal } from './PracticeTestModal';

interface ClassNavigatorProps {
  onOpenLogin?: (role?: UserRole) => void;
  onSelectSubjectForFilter?: (grade: ClassGrade, subject: string) => void;
  selectedClass?: ClassGrade;
  onSelectClass?: (grade: ClassGrade) => void;
  initialClass?: ClassGrade;
  showSectionHeader?: boolean;
}

export const ClassNavigator: React.FC<ClassNavigatorProps> = ({
  onOpenLogin,
  onSelectSubjectForFilter,
  selectedClass: controlledClass,
  onSelectClass,
  initialClass = '12',
  showSectionHeader = true,
}) => {
  const [internalClass, setInternalClass] = useState<ClassGrade>(initialClass);
  const selectedClass = controlledClass ?? internalClass;

  const handleClassChange = (grade: ClassGrade) => {
    if (onSelectClass) {
      onSelectClass(grade);
    } else {
      setInternalClass(grade);
    }
  };

  const [selectedStream, setSelectedStream] = useState<StreamType>('all');
  const [viewLayout, setViewLayout] = useState<'tabs' | 'all-grid'>('tabs');
  const [activeTestModal, setActiveTestModal] = useState<TestSeriesItem | null>(null);
  const [activeSubjectModal, setActiveSubjectModal] = useState<SubjectDetail | null>(null);

  // Map icon name to Lucide component
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Atom': return Atom;
      case 'FlaskConical': return FlaskConical;
      case 'Dna': return Dna;
      case 'Calculator': return Calculator;
      case 'Globe': return Globe;
      case 'BookOpen': return BookOpen;
      case 'Languages': return Languages;
      case 'FileText': return FileText;
      case 'Landmark': return Landmark;
      case 'Scale': return Scale;
      case 'TrendingUp': return TrendingUp;
      case 'Brain': return Brain;
      case 'Users': return Users;
      case 'Home': return Home;
      default: return BookOpen;
    }
  };

  // Filter subjects based on class and stream
  const allClassSubjects = CLASS_SUBJECTS[selectedClass] || [];
  const filteredSubjects = allClassSubjects.filter((sub) => {
    if (selectedClass === '9' || selectedClass === '10') return true;
    if (selectedStream === 'all') return true;
    if (sub.stream === 'general') return true; // General subjects like Hindi/English included in both
    return sub.stream === selectedStream;
  });

  // Filter tests for selected class and stream
  const classTests = SAMPLE_TEST_SERIES.filter((t) => {
    if (t.classGrade !== selectedClass) return false;
    if (selectedStream === 'all' || !t.stream) return true;
    return t.stream === 'all' || t.stream === selectedStream;
  });

  const classDescriptions: Record<ClassGrade, { titleEn: string; titleHi: string; subtitleEn: string; subtitleHi: string; badgeEn: string; badgeHi: string }> = {
    '9': {
      titleEn: 'Class 9th Foundation & Comprehensive Science',
      titleHi: 'कक्षा 9वीं आधारभूत एवं सभी विषय',
      subtitleEn: 'Mathematics, Science (Physics, Chemistry, Biology), Social Science, Hindi, English & Sanskrit with complete notes and chapter tests',
      subtitleHi: 'गणित, विज्ञान, सामाजिक विज्ञान, हिंदी, अंग्रेजी एवं संस्कृत का सम्पूर्ण पाठ्यक्रम, अध्यायवार नोट्स व ऑनलाइन टेस्ट',
      badgeEn: 'NCERT Foundation • Olympiad & Concept Building',
      badgeHi: 'कक्षा 9वीं • आधारभूत तैयारी',
    },
    '10': {
      titleEn: 'Class 10th Matriculation Board Examination',
      titleHi: 'कक्षा 10वीं मैट्रिक बोर्ड परीक्षा',
      subtitleEn: 'Complete Matric Board Notes & 100-Marks Model Mock Tests for Mathematics, Science, SST, Hindi, English & Sanskrit',
      subtitleHi: '10वीं बोर्ड: गणित, विज्ञान, सामाजिक विज्ञान, हिंदी, अंग्रेजी, संस्कृत के सम्पूर्ण नोट्स एवं 100 अंक मॉडल टेस्ट',
      badgeEn: 'Matric Board Excellence • 10-Year Solved Papers',
      badgeHi: 'कक्षा 10वीं • बोर्ड परीक्षा स्पेशल',
    },
    '11': {
      titleEn: 'Class 11th Science & Arts All Subjects',
      titleHi: 'कक्षा 11वीं विज्ञान एवं कला संकाय के सभी विषय',
      subtitleEn: 'Science Stream (PCM/PCB) + Arts Stream All Subjects (History, Political Science, Geography, Economics, Psychology, Sociology, Hindi, English)',
      subtitleHi: 'विज्ञान संकाय (PCM/PCB) एवं कला संकाय (इतिहास, राजनीति, भूगोल, अर्थशास्त्र, मनोविज्ञान, समाजशास्त्र) के सभी विषय व टेस्ट',
      badgeEn: '11th All Streams • Science & Arts Comprehensive',
      badgeHi: 'कक्षा 11वीं • सभी विषय (Science + Arts)',
    },
    '12': {
      titleEn: 'Class 12th Intermediate Board & Competitive (Science + Arts)',
      titleHi: 'कक्षा 12वीं इंटरमीडिएट बोर्ड (विज्ञान एवं कला संकाय के सभी विषय)',
      subtitleEn: 'Science Stream + Arts Stream All Subjects (History, Political Science, Geography, Economics, Psychology, Sociology, Home Science, Hindi, English)',
      subtitleHi: 'विज्ञान संकाय एवं कला संकाय (इतिहास, राजनीति, भूगोल, अर्थशास्त्र, मनोविज्ञान, समाजशास्त्र, गृह विज्ञान) के सभी विषय व टेस्ट',
      badgeEn: '12th Board + Intermediate • Science & Arts All Subjects',
      badgeHi: 'कक्षा 12वीं • 12th Board + All Arts Subjects',
    },
  };

  return (
    <section id="curriculum" className="py-16 sm:py-20 bg-slate-50 border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Header Title with English & Hindi */}
        {showSectionHeader && (
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Classes 9th, 10th, 11th & 12th • All Subjects & Test Series</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit',sans-serif]">
              कक्षा 9वीं, 10वीं, 11वीं एवं 12वीं — सभी विषय एवं टेस्ट पोर्टल
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              <strong className="text-slate-800">English & Hindi Bilingual Portal:</strong> Choose any class to explore all subjects, comprehensive notes, syllabus chapters, and live practice test series with instant scorecard.
            </p>
          </div>
        )}

        {/* TOP CONTROLS: PRIMARY CLASS BUTTONS & VIEW TOGGLE */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                Select Class / कक्षा चुनें:
              </span>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewLayout('tabs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === 'tabs'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Class View / कक्षा अनुसार देखें
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('all-grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === 'all-grid'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All 4 Classes at a Glance / सभी कक्षाएं एक साथ
              </button>
            </div>
          </div>

          {/* Big Interactive Class Buttons */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {(['9', '10', '11', '12'] as ClassGrade[]).map((grade) => {
              const isSelected = selectedClass === grade && viewLayout === 'tabs';
              const subjectCount = CLASS_SUBJECTS[grade].length;
              return (
                <button
                  key={grade}
                  type="button"
                  onClick={() => {
                    handleClassChange(grade);
                    setSelectedStream('all');
                    setViewLayout('tabs');
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white border-emerald-600 shadow-xl shadow-slate-900/20 ring-2 ring-emerald-500/50 scale-[1.02]'
                      : 'bg-white text-slate-800 border-slate-200/90 hover:border-emerald-400 hover:bg-slate-50/80 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-2xl sm:text-3xl font-extrabold font-['Outfit'] ${
                        isSelected ? 'text-emerald-400' : 'text-slate-900 group-hover:text-emerald-700'
                      }`}>
                        Class {grade}th
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-emerald-500 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700'
                    }`}>
                      {grade === '9' ? 'कक्षा 9वीं' : grade === '10' ? 'कक्षा 10वीं' : grade === '11' ? 'कक्षा 11वीं' : 'कक्षा 12वीं'}
                    </span>
                  </div>

                  <div className={`text-xs sm:text-sm font-bold line-clamp-1 ${
                    isSelected ? 'text-emerald-200' : 'text-slate-700'
                  }`}>
                    {grade === '9' && 'Foundation & All Subjects (आधारभूत)'}
                    {grade === '10' && 'Matric Board Exam (10वीं बोर्ड)'}
                    {grade === '11' && 'Science + Arts (कला संकाय All Subjects)'}
                    {grade === '12' && 'Science + Arts All Subjects (12वीं बोर्ड)'}
                  </div>

                  <p className={`text-[11px] mt-1.5 line-clamp-1 ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {grade === '9' && 'Math (गणित), Science (विज्ञान), SST, Hindi, Eng, Sanskrit'}
                    {grade === '10' && 'Board Special: Math, Science, SST, Hindi, Eng, Sanskrit'}
                    {grade === '11' && 'Physics, Chem, Bio, Math + History, Pol Sc, Geo, Econ, Psych, Soc'}
                    {grade === '12' && 'Physics, Chem, Bio, Math + History, Pol Sc, Geo, Econ, Home Sc'}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/40 flex items-center justify-between text-[11px]">
                    <span className={`font-semibold ${isSelected ? 'text-emerald-300' : 'text-slate-600'}`}>
                      {subjectCount} Subjects / विषय
                    </span>
                    <span className={`font-bold flex items-center gap-1 ${
                      isSelected ? 'text-white' : 'text-emerald-700'
                    }`}>
                      <span>Explore</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* VIEW 1: ALL 4 CLASSES & ALL SUBJECTS AT A GLANCE (सभी 4 कक्षाएं एवं विषय एक साथ) */}
        {viewLayout === 'all-grid' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-4 rounded-2xl bg-emerald-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div>
                <h3 className="text-lg font-bold font-['Outfit'] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  <span>All 4 Classes & All Subjects Overview (सभी 4 कक्षाएं एवं सभी विषय)</span>
                </h3>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  Every class and all of its subjects in English & Hindi. Click on any subject or class button to open full details, syllabus, notes, or test series.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewLayout('tabs')}
                className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-950 font-bold text-xs hover:bg-emerald-50 transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Switch to Class Explorer View
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {(['9', '10', '11', '12'] as ClassGrade[]).map((grade) => {
                const subjects = CLASS_SUBJECTS[grade];
                const testsForClass = SAMPLE_TEST_SERIES.filter((t) => t.classGrade === grade);
                const isNinth = grade === '9';
                const isTenth = grade === '10';
                const isEleventh = grade === '11';
                const isTwelfth = grade === '12';

                return (
                  <div
                    key={grade}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Header */}
                    <div className={`p-4 border-b ${
                      isNinth ? 'bg-emerald-50/70 border-emerald-200' :
                      isTenth ? 'bg-blue-50/70 border-blue-200' :
                      isEleventh ? 'bg-indigo-50/70 border-indigo-200' :
                      'bg-purple-50/70 border-purple-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xl font-extrabold font-['Outfit'] ${
                          isNinth ? 'text-emerald-900' :
                          isTenth ? 'text-blue-900' :
                          isEleventh ? 'text-indigo-900' :
                          'text-purple-900'
                        }`}>
                          Class {grade}th
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-slate-800 border border-slate-200/80">
                          {grade === '9' ? 'कक्षा 9वीं' : grade === '10' ? 'कक्षा 10वीं' : grade === '11' ? 'कक्षा 11वीं' : 'कक्षा 12वीं'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-1">
                        {isNinth && 'Foundation & All Subjects (6 Subjects)'}
                        {isTenth && 'Matric Board Examination (6 Subjects + Mock)'}
                        {isEleventh && 'Science + Arts All Subjects (12 Subjects)'}
                        {isTwelfth && 'Science + Arts All Subjects (13 Subjects)'}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500 font-medium">
                        <span>{subjects.length} Subjects / विषय</span>
                        <span>•</span>
                        <span>{testsForClass.length} Practice Tests / टेस्ट</span>
                      </div>
                    </div>

                    {/* Subjects List */}
                    <div className="p-4 space-y-2.5 flex-1 max-h-[360px] overflow-y-auto">
                      {subjects.map((sub) => {
                        const Icon = getIcon(sub.iconName);
                        return (
                          <div
                            key={sub.id}
                            onClick={() => setActiveSubjectModal(sub)}
                            className="p-2.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between gap-2 group/sub"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${sub.bgLight} ${sub.borderColor} ${sub.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 group-hover/sub:text-emerald-700 transition-colors truncate">
                                  {sub.name}
                                </div>
                                <div className="text-[11px] font-semibold text-slate-500 truncate">
                                  {sub.hindiName}
                                </div>
                              </div>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase ${
                              sub.stream === 'arts' ? 'bg-amber-100 text-amber-800' :
                              sub.stream === 'science' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {sub.stream}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer Button to open class tab */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          handleClassChange(grade);
                          setViewLayout('tabs');
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                          isNinth ? 'bg-emerald-700 hover:bg-emerald-800' :
                          isTenth ? 'bg-blue-700 hover:bg-blue-800' :
                          isEleventh ? 'bg-indigo-700 hover:bg-indigo-800' :
                          'bg-purple-700 hover:bg-purple-800'
                        }`}
                      >
                        <span>Open Class {grade}th Full Portal / विवरण खोलें</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STREAM SELECTOR FOR CLASS 11TH & 12TH (Science, Arts, All) */}
        {(selectedClass === '11' || selectedClass === '12') && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Class {selectedClass}th Stream / संकाय फ़िल्टर:
                </span>
                <span className="text-xs text-slate-500 ml-1.5 hidden md:inline">
                  (All Subjects: Science + Arts All Subjects / विज्ञान एवं कला संकाय के सभी विषय)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSelectedStream('all')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  selectedStream === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Subjects / सभी विषय ({allClassSubjects.length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedStream('science')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                  selectedStream === 'science'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Atom className="w-3.5 h-3.5" />
                Science / विज्ञान संकाय
              </button>

              <button
                type="button"
                onClick={() => setSelectedStream('arts')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                  selectedStream === 'arts'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                Arts / कला संकाय (All Subjects)
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE CLASS BANNER */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Class {selectedClass}th • {selectedClass === '9' ? 'कक्षा 9वीं' : selectedClass === '10' ? 'कक्षा 10वीं' : selectedClass === '11' ? 'कक्षा 11वीं' : 'कक्षा 12वीं'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {classDescriptions[selectedClass].badgeEn} ({classDescriptions[selectedClass].badgeHi})
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-['Outfit']">
              {classDescriptions[selectedClass].titleEn} — <span className="text-emerald-700">{classDescriptions[selectedClass].titleHi}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 font-medium max-w-3xl">
              {classDescriptions[selectedClass].subtitleHi}
            </p>
            <p className="text-xs text-slate-500 max-w-3xl italic">
              {classDescriptions[selectedClass].subtitleEn}
            </p>
          </div>

          {/* Quick Action Button to Open Student Vault */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenLogin && (
              <button
                type="button"
                onClick={() => onOpenLogin('student')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Student Portal (छात्र पोर्टल)</span>
              </button>
            )}
          </div>
        </div>

        {/* SECTION 1: ALL SUBJECTS GRID */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>Class {selectedClass}th Subjects / कक्षा {selectedClass}वीं के सभी विषय ({filteredSubjects.length} Subjects):</span>
            </h4>
            <span className="text-xs text-slate-500">
              Click any subject for full syllabus • अध्याय व नोट्स देखने के लिए विषय पर क्लिक करें
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredSubjects.map((subject) => {
              const Icon = getIcon(subject.iconName);
              return (
                <div
                  key={subject.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group hover:border-emerald-300"
                >
                  <div className="space-y-3">
                    {/* Header with Icon & Stream badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${subject.bgLight} ${subject.borderColor} ${subject.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-base font-bold text-slate-900 font-['Outfit'] group-hover:text-emerald-700 transition-colors">
                            {subject.name}
                          </h5>
                          <span className="text-xs font-bold text-emerald-700">
                            {subject.hindiName}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                        subject.stream === 'arts' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : subject.stream === 'science'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {subject.stream === 'arts' ? 'Arts / कला' : subject.stream === 'science' ? 'Science / विज्ञान' : 'General'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {subject.description}
                    </p>

                    {/* Key Chapters sample tags */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                        प्रमुख अध्याय / Key Topics:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {subject.keyChapters.slice(0, 3).map((chap, cIdx) => (
                          <span
                            key={cIdx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200/70 font-medium"
                          >
                            {chap}
                          </span>
                        ))}
                        {subject.keyChapters.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                            +{subject.keyChapters.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Chapter stats & View details */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      <strong className="text-slate-800">{subject.chaptersCount}</strong> Ch (अध्याय) • <strong className="text-emerald-700">{subject.totalNotes}</strong> Notes (नोट्स)
                    </span>

                    <button
                      type="button"
                      onClick={() => setActiveSubjectModal(subject)}
                      className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>View Syllabus (सिलेबस)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: TEST SERIES & ONLINE TESTS (टेस्ट सीरीज़ व ऑनलाइन टेस्ट) */}
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-slate-900 font-['Outfit']">
                  Class {selectedClass}th Test Series & Online Mock Tests (ऑनलाइन टेस्ट सीरीज़)
                </h4>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Chapter-wise and full syllabus practice tests with live timer and instant scorecard in Hindi & English.
              </p>
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 self-start sm:self-center">
              {classTests.length} Interactive Tests Ready (टेस्ट उपलब्ध)
            </span>
          </div>

          {/* Test Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {classTests.map((test) => (
              <div
                key={test.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-emerald-400"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${test.badgeColor}`}>
                      {test.badge}
                    </span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Level: <strong className="text-slate-800">{test.difficulty}</strong>
                    </span>
                  </div>

                  <h5 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] group-hover:text-emerald-700 transition-colors">
                    {test.hindiTitle}
                  </h5>
                  <p className="text-xs text-slate-500 italic mb-3">
                    {test.title}
                  </p>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {test.description}
                  </p>

                  {/* Test Stats Pills */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Duration / समय</span>
                      <strong className="text-slate-800 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        {test.durationMinutes} Mins
                      </strong>
                    </div>
                    <div className="border-x border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Questions / प्रश्न</span>
                      <strong className="text-slate-800">
                        {test.questionsCount} MCQs
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total Marks / अंक</span>
                      <strong className="text-emerald-700">
                        {test.totalMarks} Marks
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Button: Take Interactive Test */}
                <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500 font-medium">
                    Free Online Test (निःशुल्क टेस्ट)
                  </span>

                  <button
                    type="button"
                    onClick={() => setActiveTestModal(test)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm group-hover:bg-emerald-600"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Test (टेस्ट शुरू करें)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POPUP MODAL: Interactive Practice Test */}
      {activeTestModal && (
        <PracticeTestModal
          test={activeTestModal}
          onClose={() => setActiveTestModal(null)}
          onOpenLogin={onOpenLogin ? () => onOpenLogin('student') : undefined}
        />
      )}

      {/* POPUP MODAL: Subject Detailed View */}
      {activeSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-emerald-400 font-bold">
                    Class {selectedClass}th • {activeSubjectModal.code}
                  </span>
                  <h4 className="text-lg font-bold text-white font-['Outfit']">
                    {activeSubjectModal.name} ({activeSubjectModal.hindiName})
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setActiveSubjectModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              <div>
                <h6 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Course Overview:
                </h6>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {activeSubjectModal.description}
                </p>
              </div>

              <div>
                <h6 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  All Syllabus Chapters ({activeSubjectModal.keyChapters.length}):
                </h6>
                <div className="space-y-1.5">
                  {activeSubjectModal.keyChapters.map((chap, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 flex items-center gap-2"
                    >
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span>{chap}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h6 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Special Academic Highlights:
                </h6>
                <div className="space-y-1.5">
                  {activeSubjectModal.syllabusHighlights.map((hl, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total Notes: <strong className="text-emerald-700">{activeSubjectModal.totalNotes}</strong> documents
              </span>
              <div className="flex items-center gap-2">
                {onOpenLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubjectModal(null);
                      onOpenLogin('student');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Access in Student Portal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveSubjectModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
