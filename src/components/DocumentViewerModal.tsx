import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { NoteItem } from '../types';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  FileText, 
  ShieldCheck, 
  Lock, 
  Clock, 
  Sun, 
  Moon, 
  Printer, 
  Share2, 
  CheckCheck 
} from 'lucide-react';

interface DocumentViewerModalProps {
  note: NoteItem | null;
  onClose: () => void;
  onTriggerDownload: (note: NoteItem) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  note,
  onClose,
  onTriggerDownload,
}) => {
  const { user, token } = useAuth();
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [signedUrlInfo, setSignedUrlInfo] = useState<{ url: string; expiresAt: number } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (!note) return;

    let isMounted = true;
    setIsLoading(true);
    setError('');

    const fetchNoteContent = async () => {
      try {
        // Step 1: Request a time-limited HMAC signed URL
        const signRes = await fetch(`/api/notes/${note.id}/signed-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!signRes.ok) {
          throw new Error('Failed to obtain authenticated signed URL for private document.');
        }

        const signData = await signRes.json();
        if (!signData.success || !signData.signedUrl) {
          throw new Error(signData.message || 'Signature token rejected by storage authority.');
        }

        if (!isMounted) return;
        setSignedUrlInfo({ url: signData.signedUrl, expiresAt: signData.expiresAt });

        // Step 2: Stream content using the time-limited signed URL
        const contentRes = await fetch(signData.signedUrl);
        if (!contentRes.ok) {
          throw new Error('Secure document stream access denied or token expired.');
        }

        const text = await contentRes.text();
        if (isMounted) {
          setContent(text);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error loading secure file.');
          setIsLoading(false);
        }
      }
    };

    fetchNoteContent();

    return () => {
      isMounted = false;
    };
  }, [note, token]);

  if (!note) return null;

  const handleCopySecureLink = () => {
    if (!signedUrlInfo) return;
    const fullUrl = `${window.location.origin}${signedUrlInfo.url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden text-white">
        {/* Top Control Bar */}
        <div className="bg-slate-900 px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          {/* Note Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-['Outfit'] font-bold text-sm sm:text-base text-white truncate">
                  {note.title}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                  Class {note.classGrade} • {note.subject}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {note.chapter} • Uploaded by {note.uploadedBy}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-slate-300 min-w-[45px] text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer border-l border-slate-700 ml-1"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Reading Mode Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
              title={isDarkMode ? 'Switch to Paper Mode' : 'Switch to Dark Slate Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-teal-300" />}
            </button>

            {/* Secure Download Button */}
            <button
              onClick={() => onTriggerDownload(note)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Secure Download</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 transition-colors cursor-pointer border border-slate-700"
              title="Close Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security Watermark & Signed URL Status Subheader */}
        <div className="bg-slate-950 px-4 sm:px-6 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Secure Private Stream • Time-Limited HMAC-SHA256 Token (15m valid)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {signedUrlInfo && (
              <button
                onClick={handleCopySecureLink}
                className="hover:text-slate-200 flex items-center gap-1 text-[11px] cursor-pointer"
                title="Copy temporary signed URL"
              >
                {copiedLink ? (
                  <>
                    <CheckCheck className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Signed URL Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3 h-3" />
                    <span>Copy Signed Link</span>
                  </>
                )}
              </button>
            )}
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              License: {user?.rollNo || 'FACULTY'}
            </span>
          </div>
        </div>

        {/* Reader Document Canvas */}
        <div 
          className={`flex-1 overflow-y-auto p-4 sm:p-8 relative transition-colors ${
            isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-stone-50 text-stone-900'
          }`}
        >
          {/* Anti-Piracy Floating Watermark */}
          <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.04]">
            <div className="text-center transform -rotate-25 text-3xl sm:text-5xl font-extrabold uppercase font-mono tracking-widest text-slate-900">
              GOODWAY SCIENCE COACHING • {user?.name || 'FACULTY'} • {user?.rollNo || 'CONFIDENTIAL'} • {new Date().toLocaleDateString()}
            </div>
          </div>

          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-400">
                Decrypting document with time-limited signed URL...
              </p>
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center space-y-3">
              <Lock className="w-8 h-8 text-rose-400 mx-auto" />
              <h4 className="font-bold text-base text-rose-200">Access Restricted</h4>
              <p className="text-xs text-rose-300/80">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <div 
              className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-md border border-stone-200 dark:border-slate-800 p-6 sm:p-10 transition-all origin-top"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              {/* Document Header */}
              <div className="border-b-2 border-emerald-600 pb-4 mb-6 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    GOODWAY SCIENCE COACHING CENTER • VERIFIED REVISION MODULE
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold font-['Outfit'] mt-1 text-slate-900 dark:text-white">
                    {note.title}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Target: Class {note.classGrade} Science • {note.subject} • {note.chapter}
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <div className="font-mono">{note.fileSize}</div>
                  <div>ID: {note.id}</div>
                </div>
              </div>

              {/* Document Rendered Content */}
              <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans space-y-4">
                {content}
              </div>

              {/* Document Footer End Note */}
              <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>© Goodway Science Coaching Center. Proprietary Study Material.</span>
                <span className="font-mono">Watermark Tag: {user?.rollNo}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
