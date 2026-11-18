import React, { useState, useEffect, useMemo } from 'react';
import { CefrLevel, QuizPackage, UserQuizAttempt } from './types';
import { INITIAL_QUIZZES } from './data/quizzes';
import {
  getAllQuizzes,
  getCurrentWeekNumber,
  saveAttempt,
  getStoredAttempts,
  shuffleQuizOptions,
  deleteCustomQuiz,
  hideQuiz,
  unhideQuiz,
  getHiddenQuizIds,
  getPinnedWeeklyQuizzes,
  setPinnedWeeklyQuiz,
  getActiveWeeklyQuizForLevel,
} from './utils/quizUtils';
import { Header } from './components/Header';
import { LevelSelector } from './components/LevelSelector';
import { QuizCard } from './components/QuizCard';
import { QuizResult } from './components/QuizResult';
import { WeeklyArchiveModal } from './components/WeeklyArchiveModal';
import { TeacherStudioModal } from './components/TeacherStudioModal';
import { DiagnosticModal } from './components/DiagnosticModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ChangelogModal } from './components/ChangelogModal';
import { MessageCircle, ExternalLink, Calendar, Users, Sparkles, BookOpen, Lock, ShieldCheck, FileText } from 'lucide-react';

export default function App() {
  const currentWeekNumber = useMemo(() => getCurrentWeekNumber(), []);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/teacher/session', { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(session => {
        if (!controller.signal.aborted && session?.authenticated) setIsAdmin(true);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    setIsTeacherStudioOpen(true);
  };

  const handleLogoutAdmin = async () => {
    try {
      const response = await fetch('/api/teacher/session', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error();
      setIsAdmin(false);
      setIsTeacherStudioOpen(false);
    } catch {
      window.alert('A kijelentkezés sikertelen. Próbáld újra!');
    }
  };

  // All quizzes available in system (initial + custom)
  const [allQuizzes, setAllQuizzes] = useState<QuizPackage[]>(() => getAllQuizzes());

  // URL query parameter parsing for Facebook group deep links (e.g. ?level=B1&quiz=...)
  const [currentLevel, setCurrentLevel] = useState<CefrLevel>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const lvlParam = params.get('level') as CefrLevel;
      if (['A1', 'A2', 'B1', 'B2'].includes(lvlParam)) {
        return lvlParam;
      }
    }
    return 'A1';
  });

  // Teacher-pinned active weekly quizzes per level
  const [pinnedQuizzes, setPinnedQuizzes] = useState<Record<CefrLevel, string | null>>(() => getPinnedWeeklyQuizzes());

  // Selected Quiz
  const [currentQuiz, setCurrentQuiz] = useState<QuizPackage>(() => {
    const list = getAllQuizzes();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const quizIdParam = params.get('quiz');
      if (quizIdParam) {
        const found = list.find((q) => q.id === quizIdParam);
        if (found) return found;
      }
      const lvlParam = params.get('level') as CefrLevel;
      if (lvlParam) {
        const found = getActiveWeeklyQuizForLevel(lvlParam, list);
        if (found) return found;
      }
    }
    // Default to A1 active quiz
    return getActiveWeeklyQuizForLevel('A1', list) || list[0];
  });

  // Quiz Gameplay State
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answersHistory, setAnswersHistory] = useState<boolean[]>([]);
  const [selectedAnswersHistory, setSelectedAnswersHistory] = useState<(number | null)[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // Modals state
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isTeacherStudioOpen, setIsTeacherStudioOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [hiddenQuizIds, setHiddenQuizIds] = useState<string[]>(() => getHiddenQuizIds());

  // Delete a custom quiz
  const handleDeleteQuiz = (quizId: string) => {
    deleteCustomQuiz(quizId);
    const updated = getAllQuizzes();
    setAllQuizzes(updated);
    if (currentQuiz.id === quizId) {
      const fallback = updated[0];
      if (fallback) {
        resetQuizState(fallback);
        updateUrlParams(fallback.level, fallback.id);
      }
    }
  };

  // Hide or unhide a quiz (Teacher control)
  const handleToggleHideQuiz = (quizId: string) => {
    if (hiddenQuizIds.includes(quizId)) {
      unhideQuiz(quizId);
    } else {
      hideQuiz(quizId);
    }
    const updatedHidden = getHiddenQuizIds();
    setHiddenQuizIds(updatedHidden);
    setAllQuizzes(getAllQuizzes(isAdmin));
  };

  // User attempts tracking
  const [attempts, setAttempts] = useState<UserQuizAttempt[]>(() => getStoredAttempts());

  // Count quizzes per level
  const quizCountsByLevel = useMemo(() => {
    const counts: Record<CefrLevel, number> = { A1: 0, A2: 0, B1: 0, B2: 0 };
    allQuizzes.forEach((q) => {
      counts[q.level] = (counts[q.level] || 0) + 1;
    });
    return counts;
  }, [allQuizzes]);

  // Sync URL when level or quiz changes
  const updateUrlParams = (lvl: CefrLevel, quizId: string) => {
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const newUrl = `${window.location.pathname}?level=${lvl}&quiz=${quizId}`;
      window.history.replaceState(null, '', newUrl);
    }
  };

  // Reset quiz state with randomized option order (safely ignores MouseEvents)
  const resetQuizState = (targetQuiz?: QuizPackage | unknown) => {
    const isQuizPackage = (obj: any): obj is QuizPackage =>
      Boolean(obj && typeof obj === 'object' && Array.isArray(obj.questions) && obj.questions.length > 0);

    const quiz = isQuizPackage(targetQuiz) ? targetQuiz : currentQuiz;
    const shuffled = shuffleQuizOptions(quiz);
    setCurrentQuiz(shuffled);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnswersHistory([]);
    setSelectedAnswersHistory([]);
    setIsFinished(false);
  };

  // Practice only the mistaken questions
  const handleRetryMistakes = (mistakeQuestions: QuizPackage['questions']) => {
    if (mistakeQuestions.length === 0) return;
    const practiceQuiz: QuizPackage = {
      ...currentQuiz,
      id: `${currentQuiz.id}-mistakes-${Date.now()}`,
      title: `${currentQuiz.title} (Hibák javítása)`,
      subtitle: `Gyakorold újra az elrontott ${mistakeQuestions.length} mondatot!`,
      questions: mistakeQuestions,
    };
    resetQuizState(practiceQuiz);
  };

  // Toggle teacher pin for a quiz as active weekly quiz for that level
  const handleTogglePinQuiz = (level: CefrLevel, quizId: string) => {
    setPinnedWeeklyQuiz(level, quizId);
    const updated = getPinnedWeeklyQuizzes();
    setPinnedQuizzes(updated);
    if (level === currentLevel) {
      const match = allQuizzes.find((q) => q.id === quizId) || currentQuiz;
      resetQuizState(match);
      updateUrlParams(level, match.id);
    }
  };

  // Handle Level Selection
  const handleSelectLevel = (lvl: CefrLevel) => {
    setCurrentLevel(lvl);
    const match = getActiveWeeklyQuizForLevel(lvl, allQuizzes) || allQuizzes[0];
    resetQuizState(match);
    updateUrlParams(lvl, match.id);
  };

  // Handle Specific Quiz Selection
  const handleSelectQuiz = (quiz: QuizPackage) => {
    setCurrentLevel(quiz.level);
    resetQuizState(quiz);
    updateUrlParams(quiz.level, quiz.id);
  };

  // Answering a question
  const handleAnswerSelected = (selectedOptionIndex: number, isCorrect: boolean) => {
    setSelectedAnswer(selectedOptionIndex);
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  // Move to Next Question or Finish
  const handleNextQuestion = () => {
    const isCorrect = selectedAnswer === currentQuiz.questions[questionIndex].correctIndex;
    const newAnswersHistory = [...answersHistory, isCorrect];
    const newSelectedHistory = [...selectedAnswersHistory, selectedAnswer];

    setAnswersHistory(newAnswersHistory);
    setSelectedAnswersHistory(newSelectedHistory);

    if (questionIndex + 1 < currentQuiz.questions.length) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      // Quiz finished
      setIsFinished(true);

      const finalScore = isCorrect ? score : score;
      const attempt: UserQuizAttempt = {
        quizId: currentQuiz.id,
        completedAt: new Date().toISOString(),
        score: finalScore,
        totalQuestions: currentQuiz.questions.length,
        selectedAnswers: newSelectedHistory.map((s) => s ?? -1),
      };
      saveAttempt(attempt);
      setAttempts(getStoredAttempts());
    }
  };

  const handleCustomQuizCreated = (newQuiz: QuizPackage) => {
    setPinnedWeeklyQuiz(newQuiz.level, newQuiz.id);
    setPinnedQuizzes(getPinnedWeeklyQuizzes());
    setAllQuizzes(getAllQuizzes());
    handleSelectQuiz(newQuiz);
  };

  // Navigates directly back to the active weekly quiz base view
  const handleGoHome = () => {
    setIsArchiveOpen(false);
    setIsTeacherStudioOpen(false);
    setIsDiagnosticOpen(false);
    setIsChangelogOpen(false);
    setIsAdminLoginOpen(false);
    const defaultQuiz = getActiveWeeklyQuizForLevel(currentLevel, allQuizzes) || allQuizzes[0];
    resetQuizState(defaultQuiz);
    updateUrlParams(defaultQuiz.level, defaultQuiz.id);
  };

  const currentQ = currentQuiz.questions[questionIndex] || currentQuiz.questions[0];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-[#202124] antialiased selection:bg-amber-200 selection:text-slate-900">
      {/* Header with Gyakorlatias Angol Brand Bar and Hero Gradient */}
      <Header
        currentQuiz={currentQuiz}
        currentLevel={currentLevel}
        questionIndex={questionIndex}
        totalQuestions={currentQuiz.questions.length}
        score={score}
        onOpenArchive={() => setIsArchiveOpen(true)}
        onOpenTeacherStudio={() => setIsTeacherStudioOpen(true)}
        onOpenDiagnostic={() => setIsDiagnosticOpen(true)}
        onGoHome={handleGoHome}
        completedAttemptsCount={attempts.length}
        isAdmin={isAdmin}
        onLogoutAdmin={handleLogoutAdmin}
      />

      {/* Main Interactive Stage */}
      <main className="flex-1 w-full flex flex-col items-center">
        {/* Level Switcher (A1, A2, B1, B2) */}
        {!isFinished && (
          <LevelSelector
            currentLevel={currentLevel}
            onSelectLevel={handleSelectLevel}
            onOpenDiagnostic={() => setIsDiagnosticOpen(true)}
            quizCountsByLevel={quizCountsByLevel}
          />
        )}

        {/* Weekly schedule hint banner */}
        {!isFinished && (
          <div className="w-full max-w-xl mx-auto px-4 pt-1 pb-1">
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center space-x-1.5 font-medium flex-wrap gap-y-1">
                <span className="text-emerald-700">🗓️</span>
                <span>
                  <strong>Heti feladatsor ({currentQuiz.weekNumber}. hét)</strong> • 10 kérdés azonnali magyar magyarázattal
                </span>
                {pinnedQuizzes[currentLevel] === currentQuiz.id && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-400 text-amber-950 font-black text-[10px] shadow-xs">
                    ⭐ Heti kiemelt
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsArchiveOpen(true)}
                className="text-emerald-800 font-bold underline hover:text-emerald-950 shrink-0 ml-2 cursor-pointer"
              >
                További kvízek →
              </button>
            </div>
          </div>
        )}

        {/* Active Quiz Card or Finished Results */}
        {!isFinished ? (
          <QuizCard
            question={currentQ}
            questionIndex={questionIndex}
            totalQuestions={currentQuiz.questions.length}
            onAnswerSelected={handleAnswerSelected}
            onNextQuestion={handleNextQuestion}
            selectedAnswer={selectedAnswer}
            answersHistory={answersHistory}
          />
        ) : (
          <QuizResult
            quiz={currentQuiz}
            score={score}
            totalQuestions={currentQuiz.questions.length}
            selectedAnswers={selectedAnswersHistory}
            onRetry={() => resetQuizState()}
            onRetryMistakes={handleRetryMistakes}
            onSelectAnotherLevel={() => {
              resetQuizState();
              setIsDiagnosticOpen(true);
            }}
            onOpenArchive={() => setIsArchiveOpen(true)}
          />
        )}

        {/* Community Info Banner */}
        <div className="w-full max-w-xl mx-auto px-4 py-4 mt-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-medium text-slate-900 tracking-tight">
                  Gyakorlatias Angol Facebook Közösség
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Minden héten új 10 kérdéses feladatsor A1-től B2-ig a csoportban!
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsTeacherStudioOpen(true)}
                className="py-1.5 px-3 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shrink-0 flex items-center space-x-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Kvízkészítő</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-900 text-white py-6 px-4 text-xs mt-6 border-t border-slate-800">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-base">☕</span>
            <span className="font-medium text-white tracking-tight">GYAKORLATIAS ANGOL</span>
            <span>— Hetente megújuló A1-B2 kvízrendszer</span>
          </div>

          <div className="flex flex-wrap items-center space-x-3 sm:space-x-4 font-normal">
            <button
              onClick={handleGoHome}
              className="hover:text-white transition cursor-pointer font-medium text-white"
            >
              Heti Kvízek
            </button>
            <button
              onClick={() => setIsDiagnosticOpen(true)}
              className="hover:text-white transition cursor-pointer"
            >
              Szintfelmérő
            </button>
            <button
              onClick={() => setIsArchiveOpen(true)}
              className="hover:text-white transition cursor-pointer"
            >
              Kvízarchívum
            </button>
            <button
              onClick={() => setIsChangelogOpen(true)}
              className="hover:text-amber-300 text-slate-300 text-[11px] sm:text-xs transition flex items-center space-x-1 cursor-pointer"
              title="Rendszerverzió és funkciókalauz megtekintése"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>v4.0 Verziókövetés</span>
            </button>

            {isAdmin ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsTeacherStudioOpen(true)}
                  className="hover:text-amber-300 transition text-amber-400 font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Kvízkészítő</span>
                </button>
                <button
                  onClick={handleLogoutAdmin}
                  className="hover:text-rose-400 text-slate-500 text-[11px] transition cursor-pointer"
                  title="Kilépés a Tanári módból (Diák nézet)"
                >
                  (Kilépés)
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdminLoginOpen(true)}
                className="hover:text-slate-300 transition text-slate-500 text-[11px] flex items-center space-x-1 cursor-pointer"
                title="Tanári belépés az AI Kvízkészítőhöz"
              >
                <Lock className="w-3 h-3" />
                <span>Tanári belépés</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <WeeklyArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        quizzes={allQuizzes}
        onSelectQuiz={handleSelectQuiz}
        currentQuizId={currentQuiz.id}
        isAdmin={isAdmin}
        onDeleteQuiz={handleDeleteQuiz}
        onToggleHideQuiz={handleToggleHideQuiz}
        hiddenQuizIds={hiddenQuizIds}
        pinnedQuizzes={pinnedQuizzes}
        onTogglePinQuiz={handleTogglePinQuiz}
      />

      <TeacherStudioModal
        isOpen={isAdmin && isTeacherStudioOpen}
        onClose={() => setIsTeacherStudioOpen(false)}
        onQuizCreatedOrSelected={handleCustomQuizCreated}
        currentWeekNumber={currentWeekNumber}
        onQuizDeleted={() => setAllQuizzes(getAllQuizzes())}
        onOpenChangelog={() => setIsChangelogOpen(true)}
      />

      <DiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        onSelectLevel={handleSelectLevel}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
        isAdmin={isAdmin}
        onOpenTeacherStudio={() => setIsTeacherStudioOpen(true)}
      />
    </div>
  );
}
