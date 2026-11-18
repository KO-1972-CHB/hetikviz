import React from 'react';
import { CefrLevel, QuizPackage } from '../types';
import { Calendar, Sparkles, HelpCircle, BookOpen } from 'lucide-react';

interface HeaderProps {
  currentQuiz: QuizPackage;
  currentLevel: CefrLevel;
  questionIndex: number;
  totalQuestions: number;
  score: number;
  onOpenArchive: () => void;
  onOpenTeacherStudio: () => void;
  onOpenDiagnostic: () => void;
  onGoHome: () => void;
  completedAttemptsCount: number;
  isAdmin: boolean;
  onLogoutAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentQuiz,
  currentLevel,
  questionIndex,
  totalQuestions,
  score,
  onOpenArchive,
  onOpenTeacherStudio,
  onOpenDiagnostic,
  onGoHome,
  completedAttemptsCount,
  isAdmin,
  onLogoutAdmin,
}) => {
  const progressPercent = Math.min(100, Math.round(((questionIndex + 1) / totalQuestions) * 100));

  return (
    <header className="w-full">
      {/* Top coral banner matching Gyakorlatias Angol brand */}
      <div className="bg-[#EF5B5B] text-white py-2 px-3 sm:px-4 shadow-xs flex items-center justify-between">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-2">
          {/* Brand button: also navigates to home base */}
          <button
            onClick={onGoHome}
            className="flex items-center space-x-2 font-medium tracking-tight text-sm sm:text-base hover:opacity-90 transition cursor-pointer text-left shrink-0"
            title="Vissza a heti kvízek alapoldalára"
          >
            <span className="text-lg">☕</span>
            <span>GYAKORLATIAS ANGOL</span>
            <span className="hidden md:inline-block text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full ml-1">
              Heti Kvízek • A1-B2
            </span>
          </button>

          <div className="flex items-center space-x-1 sm:space-x-2 text-xs font-medium">
            {/* Direct Heti Kvízek button to go back to quiz base page */}
            <button
              onClick={onGoHome}
              className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-md transition cursor-pointer shadow-2xs"
              title="Vissza a heti kvízek alapoldalára"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Heti Kvízek</span>
            </button>

            <button
              onClick={onOpenDiagnostic}
              className="hidden sm:flex items-center space-x-1 bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-md transition cursor-pointer"
              title="20 kérdéses szintfelmérő (A1-től B2-ig)"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Szintfelmérő (20 kérdés)</span>
            </button>

            <button
              onClick={onOpenArchive}
              className="flex items-center space-x-1 bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-md transition cursor-pointer"
              title="Korábbi hetek kvízei"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Heti Archívum</span>
            </button>

            {/* AI Kvízkészítő is ONLY visible when Tanári/Admin mód is active */}
            {isAdmin ? (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={onOpenTeacherStudio}
                  className="flex items-center space-x-1 bg-amber-400 hover:bg-amber-300 text-slate-900 px-2.5 py-1 rounded-md font-medium transition shadow-xs cursor-pointer"
                  title="Tanári vezérlő és AI Kvízgenerátor"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                  <span>AI Kvízkészítő</span>
                </button>
                <button
                  onClick={onLogoutAdmin}
                  className="text-[10px] bg-black/30 hover:bg-black/50 text-white/90 px-1.5 py-1 rounded transition"
                  title="Tanári mód kikapcsolása (Diák nézet)"
                >
                  Kilépés
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Fresh Lime-to-Teal/Sky Gradient Hero Block (Faithfully matching uploaded reference) */}
      <div className="w-full bg-gradient-to-r from-[#bbf7d0] via-[#86efac] to-[#38bdf8] text-slate-900 py-6 px-4 border-b border-emerald-200/50 shadow-inner">
        <div className="max-w-xl mx-auto text-center">
          {/* Week badge and Level Tag */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-900 text-white shadow-xs">
              🗓️ {currentQuiz.weekNumber}. heti kvíz
            </span>
            <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-800 text-white shadow-xs">
              {currentLevel} SZINT
            </span>
            {currentQuiz.badgeText && (
              <span className="hidden sm:inline-flex items-center text-xs font-normal px-2 py-0.5 rounded-full bg-white/80 text-emerald-900 border border-emerald-300">
                {currentQuiz.badgeText}
              </span>
            )}
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 drop-shadow-xs">
            {currentQuiz.title}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base font-normal text-slate-800 mt-1">
            {currentQuiz.subtitle}
          </p>

          {/* Progress row exactly as in screenshot: Black pill [1 / 1], Progress bar, [1 / 10] */}
          <div className="mt-4 flex items-center justify-between gap-3 max-w-md mx-auto">
            {/* Score Pill */}
            <div className="bg-[#1f2421] text-white text-xs sm:text-sm font-bold px-3 py-1 rounded-full shadow-sm shrink-0 flex items-center space-x-1">
              <span>Helyes: {score}</span>
            </div>

            {/* Central Progress Bar */}
            <div className="w-full bg-emerald-700/20 h-2.5 rounded-full overflow-hidden p-0.5 border border-emerald-600/30">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Question Counter */}
            <div className="text-xs sm:text-sm font-extrabold text-slate-800 shrink-0">
              {questionIndex + 1} / {totalQuestions}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
