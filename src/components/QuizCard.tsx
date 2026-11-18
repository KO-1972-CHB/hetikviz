import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { playEnglishPronunciation } from '../utils/quizUtils';
import { Volume2, CheckCircle2, XCircle, ArrowRight, Lightbulb, Sparkles } from 'lucide-react';

interface QuizCardProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  onAnswerSelected: (selectedIndex: number, isCorrect: boolean) => void;
  onNextQuestion: () => void;
  selectedAnswer: number | null;
  answersHistory: boolean[];
}

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  onAnswerSelected,
  onNextQuestion,
  selectedAnswer,
  answersHistory,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const isAnswered = selectedAnswer !== null;
  const isCorrect = isAnswered && selectedAnswer === question.correctIndex;

  // Compute option letter (a, b, c, d)
  const letters = ['a', 'b', 'c', 'd', 'e'];

  // Default pill color styles matching the user's reference screenshot
  const optionPillStyles = [
    'bg-emerald-500 text-white',
    'bg-sky-400 text-white',
    'bg-teal-400 text-white',
    'bg-amber-400 text-slate-900',
  ];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    const correct = idx === question.correctIndex;
    onAnswerSelected(idx, correct);

    // Automatically speak correct complete sentence after answering
    const fullSentence = question.question.replace(/_+/g, question.options[question.correctIndex]);
    playEnglishPronunciation(fullSentence);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingAudio(true);
    // Replace blank with either selected answer or correct answer
    const word = isAnswered ? question.options[question.correctIndex] : 'something';
    const sentenceToSpeak = question.question.replace(/_+/g, word);
    playEnglishPronunciation(sentenceToSpeak);
    setTimeout(() => setIsPlayingAudio(false), 1800);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-3">
      <div className="bg-[#FAF7F2] border border-[#f1e9dc] rounded-3xl p-4 sm:p-6 shadow-sm">
        {/* ================= Question Box (Distinct Coral Border) ================= */}
        <div className="bg-white rounded-2xl border-2 border-[#f87171] p-5 shadow-xs mb-4 relative transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium tracking-wider text-[#EF5B5B] uppercase">
              KÉRDÉS {questionIndex + 1} / {totalQuestions}
            </span>

            {/* Audio pronunciation button */}
            <button
              onClick={handleSpeak}
              className={`p-1.5 rounded-full transition flex items-center space-x-1 text-xs font-medium ${
                isPlayingAudio
                  ? 'bg-amber-100 text-amber-800 scale-105'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Kiejtés meghallgatása (anyanyelvi hang)"
            >
              <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce text-amber-600' : ''}`} />
              <span className="hidden sm:inline text-[11px]">Kiejtés</span>
            </button>
          </div>

          {/* English sentence with blank (clean single line) */}
          <div className="text-xl sm:text-2xl font-medium text-slate-900 tracking-tight leading-relaxed">
            {question.question.split(/(_+)/g).map((part, idx) => {
              if (part.startsWith('_')) {
                if (isAnswered) {
                  return (
                    <span
                      key={idx}
                      className={`inline-block border-b-3 px-2 mx-1 transition-all font-medium ${
                        isCorrect
                          ? 'border-emerald-600 text-emerald-700'
                          : 'border-rose-500 text-rose-600'
                      }`}
                    >
                      {question.options[question.correctIndex]}
                    </span>
                  );
                }
                // Unanswered: clean single solid gap line without double underscore
                return (
                  <span
                    key={idx}
                    className="inline-block border-b-3 border-[#f87171] min-w-[75px] sm:min-w-[95px] mx-1.5 align-baseline h-1"
                    aria-label="hiányzó rész"
                  />
                );
              }
              return <span key={idx}>{part}</span>;
            })}
          </div>
        </div>

        {/* ================= Options List ================= */}
        <div className="space-y-2.5 mb-4">
          {question.options.map((option, idx) => {
            const letter = letters[idx] || `${idx + 1}`;
            const isThisSelected = selectedAnswer === idx;
            const isThisCorrect = idx === question.correctIndex;

            // Compute styling states
            let cardStyle = 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-800';
            let letterPill = optionPillStyles[idx % optionPillStyles.length];

            if (isAnswered) {
              if (isThisCorrect) {
                cardStyle = 'bg-emerald-50/90 border-2 border-emerald-600 text-emerald-950 font-bold shadow-xs';
                letterPill = 'bg-emerald-600 text-white';
              } else if (isThisSelected && !isThisCorrect) {
                cardStyle = 'bg-rose-50/90 border-2 border-rose-500 text-rose-950 font-medium';
                letterPill = 'bg-rose-500 text-white';
              } else {
                cardStyle = 'bg-white/60 border-slate-200 text-slate-400 opacity-70';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${cardStyle} ${
                  !isAnswered ? 'active:scale-98' : ''
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  {/* Option letter pill (a, b, c) */}
                  <span
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0 ${letterPill}`}
                  >
                    {letter}
                  </span>

                  {/* Option Text */}
                  <span className="text-base sm:text-lg font-semibold tracking-tight">{option}</span>
                </div>

                {/* Status indicator icon if answered */}
                {isAnswered && (
                  <div>
                    {isThisCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-in fade-in zoom-in" />
                    )}
                    {isThisSelected && !isThisCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500 animate-in fade-in zoom-in" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ================= Feedback Box (Pedagogical Explanation & Translation) ================= */}
        {isAnswered && (
          <div
            className={`rounded-2xl p-4 mb-4 border transition-all animate-in fade-in slide-in-from-top-2 ${
              isCorrect
                ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950'
                : 'bg-amber-50/80 border-amber-300 text-amber-950'
            }`}
          >
            {/* Header / Explanation */}
            <div className="flex items-start space-x-2 mb-2">
              <span className="font-medium text-base">
                {isCorrect ? '✓ Helyes!' : '✗ Nem egészen...'}
              </span>
              <p className="text-sm font-normal leading-relaxed">
                {question.explanation}
              </p>
            </div>

            {/* Hungarian Translation */}
            <div className="flex items-center space-x-2 pt-2 border-t border-emerald-200/50 text-sm">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wider bg-slate-900 text-white shrink-0">
                HU
              </span>
              <span className="font-normal italic text-slate-800">
                {question.translation}
              </span>
            </div>

            {/* Memory tip if available */}
            {question.tip && (
              <div className="mt-2.5 flex items-start space-x-1.5 text-xs text-slate-700 bg-white/70 p-2 rounded-lg border border-emerald-200/40">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-900 font-medium">Gyakorlati tipp:</strong> {question.tip}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ================= Vibrant Gradient CTA Button ================= */}
        {isAnswered && (
          <button
            onClick={onNextQuestion}
            className="w-full py-3.5 px-6 rounded-2xl font-medium text-slate-900 text-base sm:text-lg tracking-tight shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2 cursor-pointer"
            style={{
              background: 'linear-gradient(90deg, #f87171 0%, #fb923c 25%, #facc15 50%, #60a5fa 75%, #a855f7 100%)',
            }}
          >
            <span>
              {questionIndex + 1 === totalQuestions ? 'Eredmények megtekintése 🏆' : 'Következő kérdés →'}
            </span>
          </button>
        )}

        {/* ================= Dots Indicator (Matching Bottom of Screenshot) ================= */}
        <div className="mt-5 flex items-center justify-center space-x-2">
          {Array.from({ length: totalQuestions }).map((_, idx) => {
            const isPast = idx < answersHistory.length;
            const wasCorrect = isPast ? answersHistory[idx] : null;
            const isCurrent = idx === questionIndex;

            let dotColor = 'bg-slate-300';
            if (isCurrent) {
              dotColor = 'bg-[#EF5B5B] ring-2 ring-rose-200 scale-125';
            } else if (isPast) {
              dotColor = wasCorrect ? 'bg-emerald-500' : 'bg-rose-400';
            }

            return (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${dotColor}`}
                title={`Kérdés ${idx + 1}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
