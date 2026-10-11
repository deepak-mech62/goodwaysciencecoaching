import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Share2, 
  FileText,
  Sparkles
} from 'lucide-react';
import { TestSeriesItem } from '../data/curriculumData';

interface PracticeTestModalProps {
  test: TestSeriesItem | null;
  onClose: () => void;
  onOpenLogin?: () => void;
}

export const PracticeTestModal: React.FC<PracticeTestModalProps> = ({ test, onClose, onOpenLogin }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);

  useEffect(() => {
    if (!test) return;
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setShowConfirmSubmit(false);
    setSecondsRemaining((test.durationMinutes || 15) * 60);
  }, [test]);

  // Timer countdown
  useEffect(() => {
    if (!test || isSubmitted || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [test, isSubmitted, secondsRemaining]);

  if (!test) return null;

  const currentQ = test.questions[currentQuestionIndex];
  const totalQuestions = test.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optIdx,
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    test.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });
    const percentage = Math.round((correct / totalQuestions) * 100);
    const marksObtained = (correct / totalQuestions) * test.totalMarks;
    return { correct, percentage, marksObtained };
  };

  const scoreData = calculateScore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold">
                  Class {test.classGrade}th
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {test.subjectName}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white font-['Outfit'] line-clamp-1">
                {test.hindiTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isSubmitted && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-bold ${
                secondsRemaining < 120 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                  : 'bg-slate-800 text-emerald-400 border border-slate-700'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Test"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {!isSubmitted ? (
            <>
              {/* Question Navigation & Progress */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <span className="text-xs text-slate-500">
                    Answered: <strong className="text-emerald-700">{answeredCount}/{totalQuestions}</strong>
                  </span>
                </div>

                {/* Quick Question jump pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {test.questions.map((_, idx) => {
                    const isAnswered = selectedAnswers[idx] !== undefined;
                    const isCurrent = currentQuestionIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-900 text-white shadow-sm'
                            : isAnswered
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Question Box */}
              {currentQ && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      Q{currentQuestionIndex + 1}. {currentQ.hindiQuestion}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium italic">
                      ({currentQ.question})
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {currentQ.options.map((option, optIdx) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                      const optLabel = String.fromCharCode(65 + optIdx);
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(optIdx)}
                          className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                              : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/70'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {optLabel}
                            </span>
                            <span className={`text-sm font-semibold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                              {option}
                            </span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Result Screen */
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-emerald-50 to-teal-50/40 border border-emerald-200 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                    Test Completed Successfully!
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Goodway Science Coaching Center • Official Evaluation Sheet
                  </p>
                </div>

                {/* Scorecard Metric Grid */}
                <div className="grid grid-cols-3 gap-3 pt-3 max-w-md mx-auto">
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-sm">
                    <span className="text-[11px] text-slate-500 block">Score</span>
                    <strong className="text-lg font-extrabold text-emerald-700">
                      {scoreData.correct} / {totalQuestions}
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-sm">
                    <span className="text-[11px] text-slate-500 block">Percentage</span>
                    <strong className="text-lg font-extrabold text-blue-700">
                      {scoreData.percentage}%
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-sm">
                    <span className="text-[11px] text-slate-500 block">Marks</span>
                    <strong className="text-lg font-extrabold text-purple-700">
                      {scoreData.marksObtained} / {test.totalMarks}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Solutions & Explanation Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    Detailed Answer Key & Explanations (उत्तर एवं सटीक व्याख्या):
                  </h5>
                  <span className="text-xs text-emerald-700 font-semibold">
                    Class {test.classGrade}th • {test.subjectName}
                  </span>
                </div>

                <div className="space-y-3">
                  {test.questions.map((q, idx) => {
                    const studentAns = selectedAnswers[idx];
                    const isCorrect = studentAns === q.correctIndex;
                    const isSkipped = studentAns === undefined;

                    return (
                      <div 
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          isCorrect 
                            ? 'bg-emerald-50/40 border-emerald-200' 
                            : isSkipped
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-rose-50/40 border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-bold text-slate-900 text-sm">
                            Q{idx + 1}. {q.hindiQuestion}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isCorrect 
                              ? 'bg-emerald-600 text-white' 
                              : isSkipped 
                              ? 'bg-slate-500 text-white' 
                              : 'bg-rose-600 text-white'
                          }`}>
                            {isCorrect ? 'Correct (+)' : isSkipped ? 'Skipped' : 'Incorrect (-)'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2.5">
                          <div className={`p-2 rounded-lg border ${
                            isCorrect ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950 font-semibold' : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}>
                            Your Answer: <strong>{isSkipped ? 'Not Attempted' : q.options[studentAns]}</strong>
                          </div>
                          <div className="p-2 rounded-lg bg-emerald-100/90 border border-emerald-300 text-emerald-950 font-semibold">
                            Correct Answer: <strong>{q.options[q.correctIndex]}</strong>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-emerald-800">Concept Explanation:</strong> {q.explanation}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between gap-3">
          {!isSubmitted ? (
            <>
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmSubmit(true)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    Submit Test
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setCurrentQuestionIndex(0);
                  setSelectedAnswers({});
                  setSecondsRemaining((test.durationMinutes || 15) * 60);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reattempt Test
              </button>

              <div className="flex items-center gap-2">
                {onOpenLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLogin();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold cursor-pointer"
                  >
                    Login to Student Vault
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>

        {/* Confirmation Modal overlay before submission */}
        {showConfirmSubmit && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 font-['Outfit']">
                Submit Test Evaluation?
              </h4>
              <p className="text-xs text-slate-600">
                You have answered <strong>{answeredCount}</strong> out of <strong>{totalQuestions}</strong> questions. Are you ready to see your scorecard and answer key?
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Continue Test
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmSubmit(false);
                    setIsSubmitted(true);
                  }}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
