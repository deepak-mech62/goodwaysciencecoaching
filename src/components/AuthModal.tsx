import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { UserRole } from '../types';
import { 
  Lock, 
  User, 
  GraduationCap, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  ShieldCheck, 
  X, 
  AlertCircle, 
  Clock, 
  KeyRound, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  onSuccessRole: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'student',
  onSuccessRole,
}) => {
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>(initialRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Sync role when initialRole changes
  useEffect(() => {
    setRole(initialRole);
    setErrorMessage('');
  }, [initialRole]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorMessage('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Please provide both identification (Email/Roll No) and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const res = await login(identifier.trim(), password, role);
    setIsSubmitting(false);

    if (res.success && res.user) {
      onSuccessRole(res.user.role);
      onClose();
    } else {
      setErrorMessage(res.message || 'Invalid credentials or unauthorized role.');
      if (res.attemptsRemaining !== undefined) {
        setAttemptsRemaining(res.attemptsRemaining);
      }
      if (res.lockoutTimeSeconds && res.lockoutTimeSeconds > 0) {
        setLockoutSeconds(res.lockoutTimeSeconds);
      }
    }
  };

  // Demo accounts helper
  const handleQuickFill = (id: string, pass: string, targetRole: UserRole) => {
    setRole(targetRole);
    setIdentifier(id);
    setPassword(pass);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              role === 'student' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {role === 'student' ? <GraduationCap className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-['Outfit'] font-bold text-base text-white">
                {role === 'student' ? 'Student Portal Login' : 'Teacher / Admin Portal Login'}
              </h3>
              <p className="text-xs text-slate-400">
                GOODWAY Science Coaching Center Security Gateway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setRole('student');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              role === 'student'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student Login
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('teacher');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              role === 'teacher'
                ? 'bg-white text-amber-700 border-b-2 border-amber-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Teacher / Admin Login
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Lockout Warning Banner */}
          {lockoutSeconds > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 animate-in fade-in">
              <Clock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Brute-Force Protection Triggered</p>
                <p>
                  5 consecutive failed attempts detected from this IP. To safeguard student accounts, login is suspended for:{' '}
                  <strong className="text-rose-900 font-mono text-sm">{lockoutSeconds}s</strong>
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && lockoutSeconds <= 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-semibold">{errorMessage}</p>
                {attemptsRemaining !== null && attemptsRemaining < 5 && (
                  <p className="text-[11px] text-amber-800">
                    Security check: <strong>{attemptsRemaining}</strong> attempt(s) remaining before temporary lockout.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Identifier Field (Email or Roll No) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              {role === 'student' ? 'Student Roll Number or Email' : 'Faculty Official Email / Staff ID'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="input-auth-identifier"
                disabled={lockoutSeconds > 0 || isSubmitting}
                placeholder={role === 'student' ? 'e.g. GW-12-042 or rahul.sharma@goodway.edu' : 'e.g. teacher@goodway.edu'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all disabled:opacity-60"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {role === 'student' ? 'Enrolled students can log in using their Institute Roll No or registered Email.' : 'Only authorized faculty members with administrative clearance.'}
            </p>
          </div>

          {/* Password Field with Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Secret Password
              </label>
              <span className="text-[11px] text-slate-500">
                PBKDF2 Hashed & Salted
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="input-auth-password"
                disabled={lockoutSeconds > 0 || isSubmitting}
                placeholder="Enter your confidential password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all disabled:opacity-60 font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-auth-submit"
            disabled={lockoutSeconds > 0 || isSubmitting}
            className={`w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              role === 'student'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <span>Verifying Credentials & Session...</span>
            ) : lockoutSeconds > 0 ? (
              <span>Locked ({lockoutSeconds}s)</span>
            ) : (
              <>
                <span>Authenticate & Open Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      .

          <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-1">
            <span>Dir: Alok Singh (M.Sc. Math) • Teachers: Shakti Varma (B.Sc. Math), Amit Kumar Singh (M.Sc. Math, B.Ed)</span>
            <span className="font-semibold text-emerald-700">Design by Deepak Kumar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
