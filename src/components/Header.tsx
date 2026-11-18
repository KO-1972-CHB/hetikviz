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
  isAdmin,
  onLogoutAdmin,
}) => {
  const progressPercent = Math.min(100, Math.round(((questionIndex + 1) / totalQuestions) * 100));

  return (
    <header>
      <div className="border-b border-[#ccdee8] bg-[#eff7fb]">
        <div className="app-container flex flex-wrap items-center justify-between gap-x-5 gap-y-2 py-3">
          <button onClick={onGoHome} className="flex items-center gap-2.5 rounded-xl text-left font-bold text-[#142c3d] cursor-pointer">
            <span className="brand-mark" aria-hidden="true">GyA</span>
            <span>Gyakorlatias Angol</span>
            <span className="hidden lg:inline border-l border-[#bfd5e0] pl-3 text-sm font-medium text-[#426075]">Heti kvízek</span>
          </button>

          <nav aria-label="Kvíz navigáció" className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
            <button onClick={onGoHome} className="quiz-nav-button quiz-nav-current">
              <BookOpen aria-hidden="true" size={17} /> Heti kvízek
            </button>
            <button onClick={onOpenArchive} className="quiz-nav-button">
              <Calendar aria-hidden="true" size={17} /> Heti archívum
            </button>
            <button onClick={onOpenDiagnostic} className="quiz-nav-button">
              <HelpCircle aria-hidden="true" size={17} /> Szintfelmérő
            </button>
            {isAdmin && (
              <>
                <button onClick={onOpenTeacherStudio} className="quiz-nav-button quiz-nav-current">
                  <Sparkles aria-hidden="true" size={17} /> AI Kvízkészítő
                </button>
                <button onClick={onLogoutAdmin} className="quiz-nav-button">Kilépés</button>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="app-container pt-5 sm:pt-8">
        <div className="quiz-hero">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span className="quiz-hero-tag"><Calendar aria-hidden="true" size={15} /> {currentQuiz.weekNumber}. heti kvíz</span>
              <span className="quiz-hero-tag">{currentLevel}</span>
              {currentQuiz.badgeText && <span className="text-[#d5effd]">{currentQuiz.badgeText}</span>}
            </div>
            <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{currentQuiz.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#e0f3fe] sm:text-base">{currentQuiz.subtitle}</p>
          </div>
          <div className="quiz-hero-progress">
            <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm font-semibold">
              <span>{questionIndex + 1} / {totalQuestions}. kérdés</span>
              <span>Helyes: {score}</span>
            </div>
            <div role="progressbar" aria-label="Haladás a kvízben"
              aria-valuenow={questionIndex + 1} aria-valuemin={0} aria-valuemax={totalQuestions}
              className="h-2 overflow-hidden rounded-full bg-[#073f5b]">
              <div className="h-full rounded-full bg-[#b4e6fa] transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
