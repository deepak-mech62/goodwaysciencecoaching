import React from 'react';
import { 
  X, 
  Receipt, 
  CheckCircle2, 
  Sparkles, 
  CreditCard, 
  QrCode, 
  Building2, 
  PhoneCall, 
  GraduationCap, 
  ShieldCheck,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { UserRole } from '../types';

interface FeeStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: (role: UserRole) => void;
}

export const FeeStructureModal: React.FC<FeeStructureModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
}) => {
  if (!isOpen) return null;

  const classFees = [
    {
      grade: '9',
      title: 'Class 9th (कक्षा 9वीं)',
      subtitle: 'Foundation Science & All Subjects',
      monthly: 900,
      annual: 10800,
      features: [
        'All Core Subjects (Science, Math, Social Science, Languages)',
        'Chapter-wise Typed Notes & Concept Sheets',
        'Bi-weekly Unit Assessment & Doubt Classes',
        'Foundation preparation for 10th Board'
      ],
      badge: 'Foundation Batch',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      grade: '10',
      title: 'Class 10th (कक्षा 10वीं)',
      subtitle: 'Matric Board Examination Batch',
      monthly: 1000,
      annual: 12000,
      features: [
        'Complete Board Exam Special Guidance',
        'Solved Question Bank (Last 10 Years PYQs)',
        'Sunday 100-Mark Model Board Test Series',
        'Daily Numerical & Formula Practice Sheets'
      ],
      badge: 'Matric Board Specialist',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      grade: '11',
      title: 'Class 11th (कक्षा 11वीं)',
      subtitle: 'Science & Arts Streams (कला एवं विज्ञान)',
      monthly: 1400,
      annual: 16800,
      features: [
        'Science: Physics, Chemistry, Mathematics, Biology',
        'Arts: History, Political Science, Geography, Economics, Psychology',
        'Practical Demonstration & Lab Guidance',
        'NEET / JEE Foundation Concept Building'
      ],
      badge: 'Science + Arts Streams',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    {
      grade: '12',
      title: 'Class 12th (कक्षा 12वीं)',
      subtitle: 'Intermediate Board Exam & Target Batch',
      monthly: 1500,
      annual: 18000,
      features: [
        'Complete 12th Board Syllabus with High-Yield Topics',
        'Arts Stream: All Subjects Thorough Preparation',
        'HMAC-Encrypted Digital Chapter Notes & Formula Booklets',
        'Weekly Full-Length Board Simulation Tests'
      ],
      badge: 'Inter Board Target',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-7 flex items-start justify-between border-b border-slate-800 relative">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Receipt className="w-3.5 h-3.5" />
              <span>Coaching Fee Schedule • Academic Session 2025-2026</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-['Outfit'] tracking-tight text-white">
              Fee Structure & Payment Portal (फीस विवरण)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Goodway Science Coaching Center • Classes 9th, 10th, 11th & 12th (Science + Arts)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-8 max-h-[75vh] overflow-y-auto">
          {/* Personalized Fee Check Callout for Enrolled Students */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-['Outfit'] font-bold text-slate-900 text-sm sm:text-base">
                  Already an Enrolled Student? (क्या आप नामांकित छात्र हैं?)
                </h4>
                <p className="text-xs text-slate-600">
                  Log in with your Roll Number to check your personalized fee dues, view verified receipts, or download official fee slips.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenLogin('student');
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
            >
              <span>Student Fee Login</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          {/* 4 Class Fee Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-['Outfit'] font-bold text-lg text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>Class-Wise Tuition Fee Structure (कक्षा अनुसार मासिक व वार्षिक शुल्क)</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500">All Subjects Included</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {classFees.map((fee) => (
                <div
                  key={fee.grade}
                  className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${fee.badgeColor}`}>
                        {fee.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-base font-['Outfit']">
                        {fee.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        {fee.subtitle}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 font-['Outfit']">
                          ₹{fee.monthly.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">/ month</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Annual Session: ₹{fee.annual.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <ul className="space-y-2 pt-2 text-[11px] text-slate-600 border-t border-slate-100">
                      {fee.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLogin('student');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Check Class {fee.grade}th Dues
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Channels & Official Bank / UPI Details */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-['Outfit'] font-bold text-base text-white">
                    Official Online Fee Payment Channels (फीस भुगतान खाता)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Pay using any UPI app (Google Pay, PhonePe, Paytm) or Direct Bank Transfer
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Coaching Account</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Official UPI ID</span>
                <p className="font-mono font-bold text-emerald-400 text-sm select-all">
                  goodwaycoaching@upi
                </p>
              </div>

              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Bank Account No</span>
                <p className="font-mono font-semibold text-slate-200 text-sm select-all">
                  398201948201
                </p>
              </div>

              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Bank & IFSC</span>
                <p className="font-mono font-semibold text-slate-200 text-sm select-all">
                  BKID0004521 (BOI)
                </p>
              </div>

              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Office Helpline</span>
                <p className="font-mono font-semibold text-emerald-400 text-sm">
                  +91 98765 43210
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed text-center sm:text-left">
              * Note: After online payment, please save your 12-digit UTR/Transaction Reference. Log in to your student portal and submit the UTR to generate an official verified fee receipt signed by Director Alok Singh.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Director: <strong className="text-slate-800 font-semibold">Alok Singh (M.Sc. Mathematics)</strong> • Sasaram (Rohtas), Bihar
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenLogin('student');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Login to View Fee Status</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
