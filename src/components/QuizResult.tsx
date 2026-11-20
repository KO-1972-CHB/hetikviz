import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { QuizPackage, QuizQuestion } from '../types';
import { generateShareText, playEnglishPronunciation } from '../utils/quizUtils';
import { Trophy, CheckCircle2, XCircle, RotateCcw, Volume2, Sparkles, Copy, Check, Bookmark, Eye, EyeOff } from 'lucide-react';

interface QuizResultProps {
  quiz: QuizPackage;
  score: number;
  totalQuestions: number;
  selectedAnswers: (number | null)[];
  onRetry: () => void;
  isSaved: (question: QuizQuestion) => boolean;
  onToggleSaved: (question: QuizQuestion) => void;
  saveError: string;
  onRetryMistakes?: (mistakeQuestions: QuizQuestion[]) => void;
  onSelectAnotherLevel: () => void;
  onOpenArchive: () => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({
  quiz,
  score,
  totalQuestions,
  selectedAnswers,
  onRetry,
  isSaved,
  onToggleSaved,
  saveError,
  onRetryMistakes,
  onSelectAnotherLevel,
  onOpenArchive,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const percent = Math.round((score / totalQuestions) * 100);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Confetti fires only for great performance: 80% and above (8/10, 9/10, 10/10)
    if (percent >= 80) {
      if (score === totalQuestions) {
        // 100% Hibátlan teljesítmény: látványos dupla tűzijáték burst
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { y: 0.55 },
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 60,
            origin: { x: 0.1, y: 0.6 },
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 60,
            origin: { x: 0.9, y: 0.6 },
          });
        }, 300);
      } else {
        // 80% vagy 90%: szép, elismerő konfetti zápor
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  }, [percent, score, totalQuestions]);

  // Compute mistake items
  const mistakeItems = quiz.questions
    .map((q, idx) => ({ q, idx, userAnsIdx: selectedAnswers[idx] }))
    .filter((item) => item.userAnsIdx !== item.q.correctIndex);

  const handleCopyTextOnly = () => {
    const text = generateShareText(quiz, score, totalQuestions);
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 3000);
  };

  const getEvaluation = () => {
    if (score === totalQuestions) {
      return {
        badge: '🏆 Hibátlan Mester (100%)',
        badgeColor: 'bg-emerald-500 text-white',
        text: 'Fantasztikus! Egyetlen hibát sem ejtettél. Ez a nyelvtani téma már a kisujjadban van!',
      };
    }
    if (score >= Math.ceil(totalQuestions * 0.8)) {
      return {
        badge: '⭐ Nagyszerű Teljesítmény!',
        badgeColor: 'bg-emerald-600 text-white',
        text: 'Bravó! Nagyon stabil és magabiztos tudás, csak 1-2 apró figyelmetlenség történt.',
      };
    }
    if (score >= Math.ceil(totalQuestions * 0.6)) {
      return {
        badge: '👍 Jó Úton Jársz!',
        badgeColor: 'bg-amber-500 text-slate-900',
        text: 'Az alapok már megvannak! Érdemes átolvasnod a hibás kérdések magyarázatát.',
      };
    }
    return {
      badge: '💪 Gyakorlással Menni Fog!',
      badgeColor: 'bg-[#EF5B5B] text-white',
      text: 'Semmi gond! A magyar tanulók pont ezekbe a csapdákba esnek bele leggyakrabban. Nézd át a magyarázatokat és gyakorold újra a hibákat!',
    };
  };

  const evaluation = getEvaluation();

  // Questions to display: either only mistakes (default) or all questions
  const displayedQuestions = showAllQuestions
    ? quiz.questions.map((q, idx) => ({ q, idx, userAnsIdx: selectedAnswers[idx], isMistake: selectedAnswers[idx] !== q.correctIndex }))
    : mistakeItems.map((m) => ({ ...m, isMistake: true }));

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div className="quiz-surface rounded-3xl p-5 sm:p-7">
        {/* Score Header */}
        <div className="text-center mb-6 rounded-2xl bg-[#edf6fb] p-4 sm:p-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#d3eaf6] text-[#07577d] mb-3">
            <Trophy className="w-7 h-7" />
          </div>

          <div className="mb-2 block text-sm font-semibold text-[#07577d]">
            {quiz.weekNumber}. heti kvíz eredmény
          </div>

          <h2 className="text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight">
            {quiz.title}
          </h2>

          <div className="mt-4 flex items-center justify-center space-x-3">
            <span className="text-5xl font-medium text-slate-900">{score}</span>
            <span className="text-2xl font-normal text-slate-400">/ {totalQuestions}</span>
            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium shadow-xs ${evaluation.badgeColor}`}>
              {percent}%
            </span>
          </div>

          <p className="mt-3 text-sm sm:text-base font-normal text-slate-700 max-w-md mx-auto">
            {evaluation.text}
          </p>
        </div>

        {/* Score Copy Link (Facebook share removed as requested) */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleCopyTextOnly}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center space-x-1 transition cursor-pointer"
          >
            {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedShare ? 'Eredmény kimásolva!' : 'Eredmény szövegének másolása'}</span>
          </button>
        </div>

        {/* Mistakes Review Section (Focuses exclusively on mistakes as requested) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-medium uppercase tracking-wider text-slate-700 flex items-center space-x-2">
              <span>
                {showAllQuestions
                  ? `Összes kérdés (${totalQuestions})`
                  : mistakeItems.length > 0
                  ? `Átnézendő hibák (${mistakeItems.length} mondat)`
                  : 'Kérdések áttekintése'}
              </span>
            </h3>

            {(mistakeItems.length > 0 || !showAllQuestions) && (
              <button
                onClick={() => setShowAllQuestions(!showAllQuestions)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center space-x-1"
              >
                {showAllQuestions ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Csak a hibák mutatása ({mistakeItems.length})</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Minden kérdés ({totalQuestions})</span>
                  </>
                )}
              </button>
            )}
          </div>

          {saveError && <p role="alert" className="mb-3 text-sm text-rose-800">{saveError}</p>}
          {mistakeItems.length === 0 && !showAllQuestions ? (
            /* 100% correct, no mistakes */
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-1.5">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Hibátlan feladatsor! 🎉
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Nem ejtettél egyetlen hibát sem. Minden mondatszerkezetet hibátlanul megválaszoltál!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedQuestions.map((item) => {
                const q = item.q;
                const idx = item.idx;
                const userAnsIdx = item.userAnsIdx;
                const isCorrect = userAnsIdx === q.correctIndex;

                return (
                  <div
                    key={q.id || idx}
                    className={`p-3.5 rounded-2xl border transition ${
                      isCorrect
                        ? 'bg-white border-emerald-300'
                        : 'bg-rose-50/70 border-2 border-rose-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <span className="text-xs font-black text-slate-800">
                          {idx + 1}. kérdés
                        </span>
                        {!isCorrect && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-200 text-rose-800">
                            Hibás válasz
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          const full = q.question.replace(/_+/g, q.options[q.correctIndex]);
                          playEnglishPronunciation(full);
                        }}
                        className="text-slate-400 hover:text-slate-700 p-1"
                        title="Kiejtés meghallgatása"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="quiz-dialog-tab" aria-pressed={isSaved(q)} onClick={() => onToggleSaved(q)}>
                        <Bookmark aria-hidden="true" size={16} />
                        {isSaved(q) ? 'Mentve · eltávolítás' : 'Mentés gyakorláshoz'}
                      </button>
                    </div>

                    {/* Question text with complete correct answer */}
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 mb-2 leading-relaxed">
                      {q.question.split(/(_+)/g).map((part, pIdx) => {
                        if (part.startsWith('_')) {
                          return (
                            <span
                              key={pIdx}
                              className="inline-block px-1.5 py-0.5 mx-1 font-black rounded bg-emerald-100 text-emerald-900 border border-emerald-300"
                            >
                              {q.options[q.correctIndex]}
                            </span>
                          );
                        }
                        return <span key={pIdx}>{part}</span>;
                      })}
                    </div>

                    {/* User answer vs Correct answer */}
                    {!isCorrect && userAnsIdx !== null && userAnsIdx !== undefined && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs mb-2">
                        <span className="text-slate-500 font-semibold">Te válaszod:</span>
                        <span className="line-through bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                          {q.options[userAnsIdx]}
                        </span>
                        <span className="text-slate-400 font-bold">→</span>
                        <span className="text-emerald-700 font-semibold">Helyes:</span>
                        <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold border border-emerald-300">
                          {q.options[q.correctIndex]}
                        </span>
                      </div>
                    )}

                    {/* Hungarian Explanation */}
                    <div className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-200 mb-1.5 leading-relaxed">
                      💡 <strong>Magyarázat:</strong> {q.explanation}
                    </div>

                    {/* Hungarian Translation */}
                    <div className="text-xs font-semibold text-slate-800 italic bg-amber-50/60 px-2.5 py-1.5 rounded-xl border border-amber-200/60">
                      <span className="font-bold text-amber-900 not-italic mr-1.5">HU:</span>
                      {q.translation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* New feature: "Csak a hibák újra gyakorlása" button if there are mistakes */}
          {mistakeItems.length > 0 && onRetryMistakes && (
            <button
              onClick={() => onRetryMistakes(mistakeItems.map((m) => m.q))}
              className="w-full py-4 px-4 rounded-2xl font-black text-slate-900 text-sm sm:text-base flex items-center justify-center space-x-2 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
              style={{
                background: 'linear-gradient(90deg, #facc15 0%, #fb923c 50%, #f87171 100%)',
              }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Csak a hibák újra gyakorlása ({mistakeItems.length} mondat) 🔄</span>
            </button>
          )}

          {/* Full Quiz Retry button with safe arrow-function execution */}
          <button
            onClick={() => onRetry()}
            className="quiz-primary w-full py-3.5 px-4 rounded-2xl gap-2 font-bold text-sm sm:text-base"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kvíz újratöltése (Mind a {totalQuestions} kérdés)</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => onSelectAnotherLevel()}
              className="py-3 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm text-center transition cursor-pointer"
            >
              Szintváltás
            </button>

            <button
              onClick={() => onOpenArchive()}
              className="py-3 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm text-center transition cursor-pointer"
            >
              Másik heti kvíz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
