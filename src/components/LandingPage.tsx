import React from 'react';
import { 
  Atom, 
  Dna, 
  FlaskConical, 
  Calculator, 
  GraduationCap, 
  Lock, 
  ShieldCheck, 
  FileText, 
  Award, 
  CheckCircle2, 
  Users, 
  Clock, 
  Download, 
  Sparkles,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { UserRole } from '../types';
import { ClassNavigator } from './ClassNavigator';

interface LandingPageProps {
  onOpenLogin: (role: UserRole) => void;
  onOpenFee?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin, onOpenFee }) => {
  return (
    <div className="w-full">
      {/* Hero Section with Custom Background Poster */}
      <section 
        className="relative overflow-hidden text-white pt-16 pb-24 border-b border-slate-800 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-poster.jpg')" }}
      >
        {/* Semi-transparent dark overlay for 100% text readability */}
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]" />
        
        {/* Deep gradient vignette to blend edges smoothly */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/65 to-slate-950/95" />

        {/* Subtle grid accent over the dark overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Official Emblem Banner */}
            <div className="flex justify-center">
              <div className="p-1.5 bg-white rounded-2xl shadow-xl shadow-emerald-500/10 border-2 border-emerald-400/40 inline-flex items-center justify-center hover:scale-105 transition-transform duration-300">
                <img 
                  src="/logo.png" 
                  alt="GOODWAY SCIENCE COACHING CENTER Official Emblem" 
                  className="h-20 sm:h-24 w-auto object-contain rounded-xl"
                  onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
                />
              </div>
            </div>

            {/* Tagline pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold tracking-wider shadow-sm backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>लगातार कई वर्षों से जिला टॉपर देने का रिकॉर्ड • Pure & Applied Sciences</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-['Outfit',sans-serif] text-white drop-shadow-md">
              GOODWAY SCIENCE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                COACHING CENTER
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed">
              Premier coaching for <strong className="text-white font-semibold">Classes 9th, 10th, 11th & 12th (Science + Arts)</strong>.
              <br className="hidden sm:inline" />
              <span className="text-emerald-300 font-medium">कक्षा 9वीं, 10वीं, 11वीं एवं 12वीं</span> के सभी विषय, ऑनलाइन टेस्ट सीरीज़, चैप्टर नोट्स एवं विशेष मार्गदर्शन।
            </p>

            {/* Quick Interactive Class Selector in Hero */}
            <div className="pt-2">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400 block mb-3">
                Quick Access by Class / अपनी कक्षा चुनें:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto">
                {[
                  { grade: '9', en: 'Class 9th', hi: 'कक्षा 9वीं', sub: 'Foundation' },
                  { grade: '10', en: 'Class 10th', hi: 'कक्षा 10वीं', sub: 'Matric Board' },
                  { grade: '11', en: 'Class 11th', hi: 'कक्षा 11वीं', sub: 'Science + Arts' },
                  { grade: '12', en: 'Class 12th', hi: 'कक्षा 12वीं', sub: 'Board + Arts All' },
                ].map((item) => (
                  <a
                    key={item.grade}
                    href="#curriculum"
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-emerald-600/90 border border-slate-700 hover:border-emerald-400 text-center transition-all duration-200 group/btn shadow-xs"
                  >
                    <div className="text-sm font-extrabold text-white group-hover/btn:text-white font-['Outfit']">
                      {item.en}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-400 group-hover/btn:text-emerald-100">
                      {item.hi}
                    </div>
                    <div className="text-[10px] text-slate-400 group-hover/btn:text-emerald-200 mt-0.5">
                      {item.sub}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Primary Action Buttons: Student Login & Teacher Login & Fee Structure */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
              <button
                id="btn-hero-student-login"
                onClick={() => onOpenLogin('student')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950/60 hover:shadow-emerald-900/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                <GraduationCap className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
                <span>Student Portal Login (छात्र लॉगिन)</span>
                <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="btn-hero-teacher-login"
                onClick={() => onOpenLogin('teacher')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 shadow-xl shadow-slate-950/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <Lock className="w-5 h-5 text-amber-400" />
                <span>Teacher & Admin Portal (शिक्षक पोर्टल)</span>
              </button>

              {onOpenFee && (
                <button
                  id="btn-hero-fee-structure"
                  onClick={onOpenFee}
                  className="w-full sm:w-auto px-6 py-4 rounded-xl text-base font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  <span>Class Fees & Rates (फीस संरचना)</span>
                </button>
              )}
            </div>

            {/* Quick trust metrics */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
                <div className="text-2xl font-extrabold text-emerald-400 font-['Outfit']">98.6%</div>
                <div className="text-xs text-slate-300 font-medium">Board Distinction Rate</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
                <div className="text-2xl font-extrabold text-teal-400 font-['Outfit']">1,200+</div>
                <div className="text-xs text-slate-300 font-medium">Students Enrolled</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
                <div className="text-2xl font-extrabold text-amber-400 font-['Outfit']">100%</div>
                <div className="text-xs text-slate-300 font-medium">Syllabus & Concept Coverage</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
                <div className="text-2xl font-extrabold text-cyan-400 font-['Outfit']">Weekly</div>
                <div className="text-xs text-slate-300 font-medium">Chapter Tests & Numericals</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Class Navigator & Test Portal (Classes 9th to 12th) */}
      <ClassNavigator onOpenLogin={onOpenLogin} />

      {/* Student Learning Experience & Portal Highlights */}
      <section id="features" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              Student Academic Advantage • विद्यार्थी विशेष लाभ
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] text-white">
              कक्षा 9वीं से 12वीं के लिए विशेष अध्ययन सुविधाएं
            </h2>
            <p className="text-slate-300 text-sm">
              Goodway Science Coaching Center provides authentic bilingual chapter study notes, conceptual clarity, and full syllabus test series for top board scores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">1. द्विभाषी नोट्स (Bilingual Study Notes)</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Complete chapter-by-chapter theory, derivation formula sheets, diagrams, and numerical solutions in both English and Hindi for effortless exam preparation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">2. ऑनलाइन मॉक टेस्ट (Online Test Series)</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Timed chapter and full-length tests with instant percentage score, correct answers explanation, and board exam simulation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">3. ऑल सब्जेक्ट्स (Science + Arts Streams)</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Full coverage for Class 9th & 10th foundation plus Class 11th & 12th complete Science (PCM/PCB) and Arts (History, Pol Science, Geography, Economics, etc.).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Faculty Credentials Section */}
      <section id="faculty" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14 space-y-2">
            <h2 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Mentorship You Can Trust
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit']">
              Esteemed Science & Mathematics Faculty
            </p>
            <p className="text-slate-600 text-sm">
              Led by Director Alok Singh and faculty members Shakti Verma & Amit Kumar Singh, dedicated to conceptual mastery and board distinction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Teacher 1: Alok Singh */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between">
              <div>
                {/* Square / Portrait Photo Frame (aspect-[4/5]) */}
                <div className="relative overflow-hidden rounded-xl bg-slate-100 mb-5 aspect-[4/5] border border-slate-200/80 shadow-xs">
                  <img
                    src="/teacher1.jpg"
                    alt="Alok Singh - Senior Mathematics Mentor"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fb = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fb) fb.style.display = 'flex';
                    }}
                  />
                  <div style={{ display: 'none' }} className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-500 items-center justify-center text-white font-extrabold text-4xl">
                    AS
                  </div>
                  {/* Floating role chip */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-600/90 backdrop-blur-md text-white shadow-md uppercase tracking-wider">
                      Director
                    </span>
                  </div>
                </div>

                {/* Name, Role & Highlighted Degree Pill */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-xl font-extrabold text-slate-900 font-['Outfit'] group-hover:text-emerald-700 transition-colors">
                      Alok Singh
                    </h3>
                    {/* Dedicated Highlighted Degree Pill */}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                      M.Sc Mathematics
                    </span>
                  </div>
                  <p className="text-sm font-bold text-emerald-700">
                    Senior Mathematics Mentor
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Director & Head of Faculty • 12+ Years guiding Classes 11th, 12th Board toppers & competitive exam aspirants with analytical rigor.
                  </p>
                </div>
              </div>

              {/* Specialization Badge Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-slate-500 font-medium">Core Focus:</span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-xs font-bold text-center">
                  Advanced Calculus & Analytical Problem Solving
                </div>
              </div>
            </div>

            {/* Teacher 2: Shakti Verma */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between">
              <div>
                {/* Square / Portrait Photo Frame (aspect-[4/5]) */}
                <div className="relative overflow-hidden rounded-xl bg-slate-100 mb-5 aspect-[4/5] border border-slate-200/80 shadow-xs">
                  <img
                    src="/teacher2.jpg"
                    alt="Shakti Verma - Foundation Science Faculty"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fb = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fb) fb.style.display = 'flex';
                    }}
                  />
                  <div style={{ display: 'none' }} className="w-full h-full bg-gradient-to-tr from-amber-500 to-orange-400 items-center justify-center text-white font-extrabold text-4xl">
                    SV
                  </div>
                  {/* Floating role chip */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-600/90 backdrop-blur-md text-white shadow-md uppercase tracking-wider">
                      Mgmt. Director
                    </span>
                  </div>
                </div>

                {/* Name, Role & Highlighted Degree Pill */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-xl font-extrabold text-slate-900 font-['Outfit'] group-hover:text-amber-700 transition-colors">
                      Shakti Verma
                    </h3>
                    {/* Dedicated Highlighted Degree Pill */}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                      B.Sc (Science)
                    </span>
                  </div>
                  <p className="text-sm font-bold text-amber-700">
                    Foundation Science Faculty (Class 9th & 10th)
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Management Director • 8+ Years empowering high-school students with crystal-clear scientific models and experimental fundamentals.
                  </p>
                </div>
              </div>

              {/* Specialization Badge Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="text-slate-500 font-medium">Core Focus:</span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 text-xs font-bold text-center">
                  Core Concepts & Experimental Fundamentals
                </div>
              </div>
            </div>

            {/* Teacher 3: Amit Kumar Singh */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between">
              <div>
                {/* Square / Portrait Photo Frame (aspect-[4/5]) */}
                <div className="relative overflow-hidden rounded-xl bg-slate-100 mb-5 aspect-[4/5] border border-slate-200/80 shadow-xs">
                  <img
                    src="/teacher3.jpg"
                    alt="Amit Kumar Singh - Lead Mathematics & Pedagogy Specialist"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fb = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fb) fb.style.display = 'flex';
                    }}
                  />
                  <div style={{ display: 'none' }} className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-500 items-center justify-center text-white font-extrabold text-4xl">
                    AS
                  </div>
                  {/* Floating role chip */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-600/90 backdrop-blur-md text-white shadow-md uppercase tracking-wider">
                      Coord. Director
                    </span>
                  </div>
                </div>

                {/* Name, Role & Highlighted Degree Pills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-xl font-extrabold text-slate-900 font-['Outfit'] group-hover:text-blue-700 transition-colors">
                      Amit Kumar Singh
                    </h3>
                    {/* Dedicated Highlighted Degree Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs">
                        M.Sc Math
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-2xs">
                        B.Ed
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-blue-700">
                    Lead Mathematics & Pedagogy Specialist
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Coordinate Director • Certified pedagogy educator specializing in board exam paper presentation, problem sets, and concept mastery.
                  </p>
                </div>
              </div>

              {/* Specialization Badge Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span className="text-slate-500 font-medium">Core Focus:</span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-blue-50 text-blue-900 border border-blue-200/80 text-xs font-bold text-center">
                  Board Exam Strategies & Concept Mastery
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-auto shrink-0 flex items-center justify-center bg-white rounded-lg p-0.5 shadow-sm border border-slate-700/60 overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="GOODWAY SCIENCE COACHING CENTER Logo" 
                  className="h-9 w-auto object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div style={{ display: 'none' }} className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 items-center justify-center text-emerald-400">
                  <Atom className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-white font-bold tracking-wide text-sm">GOODWAY SCIENCE COACHING CENTER</span>
                <p className="text-slate-500 text-[11px]">Empowering Science Scholars for Board & Competitive Milestones</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => onOpenLogin('student')}
                className="text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Student Portal
              </button>
              <button 
                onClick={() => onOpenLogin('teacher')}
                className="text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Teacher Portal
              </button>
              <a href="#faculty" className="text-slate-300 hover:text-emerald-400 transition-colors">
                Faculty Directory
              </a>
              <a href="#features" className="text-slate-300 hover:text-emerald-400 transition-colors">
                Academic Features (विशेषताएं)
              </a>
            </div>

            <div className="text-slate-500 text-center md:text-right">
              © {new Date().getFullYear()} Goodway Science Coaching Center. All rights reserved.
            </div>
          </div>

          {/* Dedicated Credit & Faculty Attribution Strip */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 text-xs">
              <span className="text-slate-400">Director:</span>
              <span className="font-bold text-emerald-400">Alok Singh</span>
              <span className="text-slate-500 text-[11px]">(M.Sc. Math)</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Teachers:</span>
              <span className="font-semibold text-slate-200">Shakti Varma</span>
              <span className="text-slate-500 text-[11px]">(B.Sc. Math)</span>
              <span className="text-slate-600">&</span>
              <span className="font-semibold text-slate-200">Amit Kumar Singh</span>
              <span className="text-slate-500 text-[11px]">(M.Sc. Math, B.Ed)</span>
            </div>

            {/* Design by Deepak Kumar Badge */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-emerald-500/30 text-xs shadow-md shadow-slate-950/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400 font-medium">Design by:</span>
              <span className="font-extrabold text-white tracking-wide font-['Outfit'] text-emerald-300">
                Deepak Kumar
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
