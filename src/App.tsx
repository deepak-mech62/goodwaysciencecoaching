/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AuthModal } from './components/AuthModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { FeeStructureModal } from './components/FeeStructureModal';
import { NoteItem, UserRole } from './types';
import { ShieldAlert, CheckCircle, Download, Lock } from 'lucide-react';

function AppContent() {
  const { user, isLoading, token } = useAuth();
  const [activeView, setActiveView] = useState<'landing' | 'student' | 'teacher'>('landing');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('student');
  const [feeStructureOpen, setFeeStructureOpen] = useState<boolean>(false);
  const [activeNoteViewer, setActiveNoteViewer] = useState<NoteItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Sync active view when user state changes
  useEffect(() => {
    if (user) {
      if (user.role === 'teacher') {
        // Default to teacher dashboard if they just logged in
        if (activeView === 'landing') {
          setActiveView('teacher');
        }
      } else if (user.role === 'student') {
        if (activeView === 'landing') {
          setActiveView('student');
        }
      }
    } else {
      if (activeView !== 'landing') {
        setActiveView('landing');
      }
    }
  }, [user]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleOpenLogin = (role: UserRole) => {
    setAuthModalRole(role);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (role: UserRole) => {
    if (role === 'teacher') {
      setActiveView('teacher');
    } else {
      setActiveView('student');
    }
    setToastMessage({
      text: `Secure session verified as ${role === 'teacher' ? 'Faculty Admin' : 'Student'}. Welcome!`,
      type: 'success',
    });
  };

  // RBAC Navigation guard
  const handleNavigateView = (view: 'landing' | 'student' | 'teacher') => {
    if (view === 'teacher') {
      if (!user) {
        setAuthModalRole('teacher');
        setAuthModalOpen(true);
        return;
      }
      if (user.role !== 'teacher') {
        setToastMessage({
          text: 'Access Denied: Student accounts cannot access the Faculty Admin portal.',
          type: 'warning',
        });
        return;
      }
    } else if (view === 'student') {
      if (!user) {
        setAuthModalRole('student');
        setAuthModalOpen(true);
        return;
      }
    }
    setActiveView(view);
  };

  // Fee Structure & Fee Portal Opener
  const handleOpenFee = () => {
    if (user) {
      if (user.role === 'teacher') {
        setActiveView('teacher');
      } else {
        setActiveView('student');
      }
    } else {
      setFeeStructureOpen(true);
    }
  };

  // Secure Signed Download Handler
  const handleTriggerDownload = async (note: NoteItem) => {
    try {
      setToastMessage({
        text: `Requesting time-limited HMAC signed URL for "${note.fileName}"...`,
        type: 'info',
      });

      const res = await fetch(`/api/notes/${note.id}/signed-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error('Could not generate secure signed URL.');
      }

      const data = await res.json();
      if (!data.success || !data.signedUrl) {
        throw new Error(data.message || 'Signature authorization failed.');
      }

      // Download file using the signed URL
      const downloadLink = `${data.signedUrl}&download=true`;
      const anchor = document.createElement('a');
      anchor.href = downloadLink;
      anchor.download = data.fileName || note.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setToastMessage({
        text: `Encrypted note downloaded! Signed URL expires in 15 minutes.`,
        type: 'success',
      });
    } catch (err: any) {
      setToastMessage({
        text: err.message || 'Failed to download note.',
        type: 'warning',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-['Outfit'] font-bold text-base tracking-wide">
          GOODWAY SCIENCE COACHING CENTER
        </p>
        <p className="text-xs text-slate-400">Verifying secure cryptographic session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className={`p-3.5 px-4 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : toastMessage.type === 'warning'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toastMessage.type === 'warning' ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        onOpenLogin={handleOpenLogin}
        activeView={activeView}
        setActiveView={handleNavigateView}
        onOpenFee={handleOpenFee}
      />

      {/* View Router */}
      <main className="flex-1">
        {activeView === 'landing' && (
          <LandingPage onOpenLogin={handleOpenLogin} onOpenFee={handleOpenFee} />
        )}

        {activeView === 'student' && (
          <StudentDashboard
            onOpenNoteViewer={(note) => setActiveNoteViewer(note)}
            onTriggerDownload={handleTriggerDownload}
          />
        )}

        {activeView === 'teacher' && (
          <TeacherDashboard
            onOpenNoteViewer={(note) => setActiveNoteViewer(note)}
            onTriggerDownload={handleTriggerDownload}
          />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authModalRole}
        onSuccessRole={handleAuthSuccess}
      />

      {/* In-App Document / Notes Reader Modal */}
      {activeNoteViewer && (
        <DocumentViewerModal
          note={activeNoteViewer}
          onClose={() => setActiveNoteViewer(null)}
          onTriggerDownload={handleTriggerDownload}
        />
      )}

      {/* Public Fee Structure Modal */}
      <FeeStructureModal
        isOpen={feeStructureOpen}
        onClose={() => setFeeStructureOpen(false)}
        onOpenLogin={handleOpenLogin}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
