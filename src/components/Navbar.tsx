import React from 'react';
import { useAuth } from '../AuthContext';
import { Atom, GraduationCap, ShieldCheck, LogOut, User as UserIcon, BookOpen, Lock, Receipt } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onOpenLogin: (role: UserRole) => void;
  activeView: 'landing' | 'student' | 'teacher';
  setActiveView: (view: 'landing' | 'student' | 'teacher') => void;
  onOpenFee: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin, activeView, setActiveView, onOpenFee }) => {
  const { user, logout } = useAuth();
  const [logoError, setLogoError] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-2">
        {/* Brand Logo & Title */}
        <div 
          onClick={() => setActiveView('landing')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
        >
          {/* Official Coaching Logo Container with Atom Fallback */}
          {!logoError ? (
            <div className="h-10 sm:h-12 w-auto shrink-0 flex items-center justify-center bg-white rounded-lg p-0.5 shadow-md shadow-emerald-500/10 border border-slate-700/60 group-hover:scale-105 group-hover:border-emerald-400/50 transition-all duration-300 overflow-hidden">
              <img 
                src="/logo.png" 
                alt="GOODWAY SCIENCE COACHING CENTER Logo" 
                className="h-9 sm:h-11 w-auto max-h-full object-contain rounded"
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Atom className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 group-hover:rotate-180 transition-transform duration-700" />
              </div>
            </div>
          )}

          {/* Coaching Name & Subtext */}
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-['Outfit',sans-serif] font-extrabold tracking-tight text-xs sm:text-sm md:text-base lg:text-lg text-white group-hover:text-emerald-300 transition-colors">
                GOODWAY SCIENCE COACHING CENTER
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-wide">
              Dir: Alok Singh (M.Sc. Math) • Classes 9th–12th
            </p>
          </div>
        </div>

        {/* Center Navigation Links (Public) */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-sm font-medium text-slate-300">
          <button 
            onClick={() => setActiveView('landing')}
            className={`hover:text-white transition-colors cursor-pointer ${activeView === 'landing' ? 'text-emerald-400 font-semibold' : ''}`}
          >
            Home & Courses
          </button>
          <a href="#curriculum" className="hover:text-white transition-colors">
            Curriculum
          </a>
          <button
            onClick={onOpenFee}
            className="hover:text-emerald-300 text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5 font-semibold"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Fees & Structure (फीस)</span>
          </button>
          <a href="#faculty" className="hover:text-white transition-colors">
            Faculty
          </a>
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-emerald-500/30 text-[10px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Design by <strong className="text-slate-200">Deepak Kumar</strong>
          </div>
        </nav>

        {/* Auth / Profile Area */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Dashboard Switch Button */}
              {user.role === 'student' ? (
                <button
                  onClick={() => setActiveView('student')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeView === 'student'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Student Portal
                </button>
              ) : (
                <button
                  onClick={() => setActiveView('teacher')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeView === 'teacher'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Teacher Portal
                </button>
              )}

              {/* User Chip */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-200 line-clamp-1 max-w-[130px]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {user.role === 'student' ? `Roll: ${user.rollNo} (Cl ${user.classGrade})` : 'Faculty Admin'}
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={async () => {
                  await logout();
                  setActiveView('landing');
                }}
                title="Log out securely"
                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 hover:text-rose-300 text-slate-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={onOpenFee}
                className="hidden sm:flex px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 items-center gap-1.5 transition-all cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fees (फीस)</span>
              </button>

              <button
                onClick={() => onOpenLogin('student')}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                Student Login
              </button>

              <button
                onClick={() => onOpenLogin('teacher')}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Teacher Login
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
