import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CefrLevel } from '../types';
import { DiagnosticQuestion, generateRandomDiagnosticTest } from '../data/diagnosticBank';
import { playEnglishPronunciation } from '../utils/quizUtils';
import {
  X,
  CheckCircle2,
  XCircle,
  Volume2,
  Sparkles,
  Trophy,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  CheckCheck,
} from 'lucide-react';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLevel: (lvl: CefrLevel) => void;
}

interface DiagnosticDiagnosis {
  level: CefrLevel;
  title: string;
  summary: string;
  advice: string;
  badgeColor: string;
}

interface DiagnosticSummary {
  totalScore: number;
  diagnosis: DiagnosticDiagnosis;
  levelScores: {
    A1: { correct: number; total: number };
    A2: { correct: number; total: number };
    B1: { correct: number; total: number };
    B2: { correct: number; total: number };
  };
  mistakes: { question: DiagnosticQuestion; userIndex: number; isCorrect: boolean }[];
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({
  isOpen,
  onClose,
  onSelectLevel,
}) => {
  // Test stages: 'intro' | 'testing' | 'finished'
  const [stage, setStage] = useState<'intro' | 'testing' | 'finished'>('intro');

  // 20 randomly selected questions (5 per level: A1, A2, B1, B2)
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ question: DiagnosticQuestion; userIndex: number; isCorrect: boolean }[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Mistake retry state: preserves initial 20-question score and diagnosis
  const [savedSummary, setSavedSummary] = useState<DiagnosticSummary | null>(null);
  const [isMistakeMode, setIsMistakeMode] = useState(false);
  const [mistakesReviewed, setMistakesReviewed] = useState(false);

  useEffect(() => {
    if (isOpen && stage === 'intro') {
      // Prepare new random 20-question test on open
      setQuestions(generateRandomDiagnosticTest(5));
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setUserAnswers([]);
      setSavedSummary(null);
      setIsMistakeMode(false);
      setMistakesReviewed(false);
    }
  }, [isOpen, stage]);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];
  const isAnswered = selectedAnswer !== null;

  const handleStartTest = () => {
    const newQuestions = generateRandomDiagnosticTest(5);
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setUserAnswers([]);
    setSavedSummary(null);
    setIsMistakeMode(false);
    setMistakesReviewed(false);
    setStage('testing');
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedAnswer(idx);

    const fullSentence = currentQ.question.replace(/_+/g, currentQ.options[currentQ.correctIndex]);
    playEnglishPronunciation(fullSentence);
  };

  const calculateDiagnosis = (
    lScores: { A1: { correct: number }; A2: { correct: number }; B1: { correct: number }; B2: { correct: number } },
    tScore: number
  ): DiagnosticDiagnosis => {
    if (lScores.B2.correct >= 3 && lScores.B1.correct >= 4) {
      return {
        level: 'B2',
        title: 'B2 — Haladó (Upper-Intermediate)',
        summary: 'Kiemelkedő nyelvtudás! Az összetett mondatszerkezetek, idiomatikus kifejezések és vonzatos igék világa már természetes számodra.',
        advice: 'Neked a heti B2-es kvízek hozzák a legértékesebb finomhangolást és anyanyelvi fordulatokat.',
        badgeColor: 'bg-purple-600 text-white',
      };
    }
    if (lScores.B1.correct >= 3 && lScores.A2.correct >= 3) {
      return {
        level: 'B1',
        title: 'B1 — Középhaladó (Intermediate)',
        summary: 'Stabil, jó nyelvtani alapokkal rendelkezel! Az alapfokú és újrakezdő témák (prepozíciók, múlt idő) már biztosak, most a Present Perfect és a feltételes mondatok csiszolása a cél.',
        advice: 'Kezdj a heti B1-es feladatsorokkal, és ha magabiztos vagy, bátran kóstolj bele a B2-es feladatokba is!',
        badgeColor: 'bg-orange-500 text-white',
      };
    }
    if (lScores.A2.correct >= 3 || tScore >= 7) {
      return {
        level: 'A2',
        title: 'A2 — Alapfok / Újrakezdő (Elementary)',
        summary: 'Nagyszerű alapok! A szókincsed és az alap mondatok már megvannak, de a tipikus magyar hibalehetőségek (in/on/at, much/many, egyszerű múlt) még gyakorlást igényelnek.',
        advice: 'A heti A2-es kvízek pont neked szólnak: ezek segítenek megszilárdítani a mindennapi mondatalkotást.',
        badgeColor: 'bg-amber-500 text-slate-900',
      };
    }
    return {
      level: 'A1',
      title: 'A1 — Kezdő (Beginner)',
      summary: 'Kezdd a tiszta alapokkal! A létezés (There is/are), a have/has és az egyszerű jelen mondatfűzés a leggyorsabb módja az önbizalom építésének.',
      advice: 'Indulj a heti A1-es feladatsorokkal, ahol részletes magyar magyarázatokkal építheted fel a biztos alapokat.',
      badgeColor: 'bg-emerald-600 text-white',
    };
  };

  const handleNext = () => {
    if (!currentQ || selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQ.correctIndex;
    const nextAnswers = [
      ...userAnswers,
      {
        question: currentQ,
        userIndex: selectedAnswer,
        isCorrect,
      },
    ];
    setUserAnswers(nextAnswers);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      if (isMistakeMode) {
        // Finished practicing mistakes: keep initial score/diagnosis intact!
        setStage('finished');
        setMistakesReviewed(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        // Finished original 20-question diagnostic test
        const lScores = {
          A1: { correct: 0, total: 5 },
          A2: { correct: 0, total: 5 },
          B1: { correct: 0, total: 5 },
          B2: { correct: 0, total: 5 },
        };

        nextAnswers.forEach((ans) => {
          if (ans.isCorrect && lScores[ans.question.level]) {
            lScores[ans.question.level].correct += 1;
          }
        });

        const tScore = nextAnswers.filter((a) => a.isCorrect).length;
        const diag = calculateDiagnosis(lScores, tScore);
        const mistakes = nextAnswers.filter((a) => !a.isCorrect);

        setSavedSummary({
          totalScore: tScore,
          diagnosis: diag,
          levelScores: lScores,
          mistakes,
        });

        setStage('finished');
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentQ) return;
    setIsPlayingAudio(true);
    const word = isAnswered ? currentQ.options[currentQ.correctIndex] : 'something';
    const text = currentQ.question.replace(/_+/g, word);
    playEnglishPronunciation(text);
    setTimeout(() => setIsPlayingAudio(false), 1800);
  };

  const handleStartMistakePractice = () => {
    if (!savedSummary || savedSummary.mistakes.length === 0) return;
    setIsMistakeMode(true);
    setQuestions(savedSummary.mistakes.map((m) => m.question));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setUserAnswers([]);
    setStage('testing');
  };

  // Evaluation values to display in results view
  const displayScore = savedSummary ? savedSummary.totalScore : userAnswers.filter((a) => a.isCorrect).length;
  const displayDiagnosis = savedSummary
    ? savedSummary.diagnosis
    : calculateDiagnosis(
        { A1: { correct: 0 }, A2: { correct: 0 }, B1: { correct: 0 }, B2: { correct: 0 } },
        0
      );
  const displayLevelScores = savedSummary
    ? savedSummary.levelScores
    : {
        A1: { correct: 0, total: 5 },
        A2: { correct: 0, total: 5 },
        B1: { correct: 0, total: 5 },
        B2: { correct: 0, total: 5 },
      };

  const handleCopyResultText = () => {
    const text = `🎯 Kitöltöttem a Gyakorlatias Angol 20 kérdéses szintfelmérőjét!
📊 Eredményem: ${displayScore}/20 pont
🏆 Ajánlott szintem: ${displayDiagnosis.title}
💡 Tanári tanács: ${displayDiagnosis.advice}`;

    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 3000);
  };

  const letters = ['a', 'b', 'c', 'd'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black shadow-xs">
              🎯
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-medium text-slate-900 tracking-tight">
                20 Kérdéses Angol Szintfelmérő
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                {isMistakeMode
                  ? 'Hibák újra gyakorlása és elmélyítése'
                  : '300 kérdéses adatbázisból • A1-től B2-ig növekvő nehézségben'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= STAGE 1: INTRO ================= */}
        {stage === 'intro' && (
          <div className="py-6 space-y-5 text-center my-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-700 mb-1">
              <Sparkles className="w-10 h-10 animate-pulse" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-medium text-slate-900 tracking-tight">
                Tudd meg pontosan, hol tartasz!
              </h3>
              <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                A teszt véletlenszerűen válogat <strong>20 mondatot</strong> a <strong>300 kérdéses</strong> nyelvtani adatbázisból (szintenként 75-75 feladatból a teljes 100 témás tematikára építve):
              </p>
            </div>

            {/* Level distribution pills */}
            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto text-xs font-bold">
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-900">
                <span className="block text-sm font-black">5 db</span>
                <span>A1 Kezdő</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-900">
                <span className="block text-sm font-black">5 db</span>
                <span>A2 Alapfok</span>
              </div>
              <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-xl text-orange-900">
                <span className="block text-sm font-black">5 db</span>
                <span>B1 Közép</span>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-xl text-purple-900">
                <span className="block text-sm font-black">5 db</span>
                <span>B2 Haladó</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              ⏱️ Időtartam: kb. 4-5 perc • Kérdésenként azonnali magyar magyarázattal
            </div>

            <button
              onClick={handleStartTest}
              className="w-full max-w-md mx-auto py-4 px-6 rounded-2xl font-black text-slate-900 text-base sm:text-lg shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center space-x-2"
              style={{
                background: 'linear-gradient(90deg, #f87171 0%, #fb923c 25%, #facc15 50%, #60a5fa 75%, #a855f7 100%)',
              }}
            >
              <span>Szintfelmérő Indítása (20 Kérdés) 🚀</span>
            </button>
          </div>
        )}

        {/* ================= STAGE 2: TESTING ================= */}
        {stage === 'testing' && currentQ && (
          <div className="py-2 overflow-y-auto flex-1 flex flex-col justify-between">
            {/* Question Progress bar & Level Tag */}
            <div>
              {isMistakeMode && (
                <div className="mb-2 p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex items-center space-x-2">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Hibák javítása ({currentIndex + 1} / {questions.length} mondat) • Az eredeti szintfelmérő pontszámod megmarad!</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                      currentQ.level === 'A1'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : currentQ.level === 'A2'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : currentQ.level === 'B1'
                        ? 'bg-orange-100 text-orange-800 border border-orange-300'
                        : 'bg-purple-100 text-purple-800 border border-purple-300'
                    }`}
                  >
                    {currentQ.level} Szint • {currentQ.topic}
                  </span>
                </div>

                <span className="text-slate-500 font-extrabold">
                  {currentIndex + 1} / {questions.length}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4 border border-slate-200">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%` }}
                />
              </div>

              {/* Question Sentence Box */}
              <div className="bg-[#FAF7F2] rounded-2xl border-2 border-[#f87171] p-4 sm:p-5 mb-3 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black tracking-wider text-[#EF5B5B] uppercase">
                    KÉRDÉS {currentIndex + 1} / {questions.length}
                  </span>

                  <button
                    onClick={handleSpeak}
                    className={`p-1 rounded-full text-xs transition flex items-center space-x-1 cursor-pointer ${
                      isPlayingAudio ? 'bg-amber-200 text-amber-900' : 'bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                    title="Kiejtés"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Kiejtés</span>
                  </button>
                </div>

                <div className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                  {currentQ.question.split(/(_+)/g).map((part, idx) => {
                    if (part.startsWith('_')) {
                      if (isAnswered) {
                        return (
                          <span
                            key={idx}
                            className={`inline-block border-b-2 px-1.5 mx-0.5 font-black ${
                              selectedAnswer === currentQ.correctIndex
                                ? 'border-emerald-600 text-emerald-700'
                                : 'border-rose-500 text-rose-600'
                            }`}
                          >
                            {currentQ.options[currentQ.correctIndex]}
                          </span>
                        );
                      }
                      return (
                        <span
                          key={idx}
                          className="inline-block border-b-3 border-[#f87171] min-w-[70px] sm:min-w-[85px] mx-1 align-baseline h-1"
                        />
                      );
                    }
                    return <span key={idx}>{part}</span>;
                  })}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 mb-3">
                {currentQ.options.map((opt, idx) => {
                  const letter = letters[idx] || `${idx + 1}`;
                  const isThisSelected = selectedAnswer === idx;
                  const isThisCorrect = idx === currentQ.correctIndex;

                  let style = 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800';
                  let pillStyle = 'bg-slate-200 text-slate-800';

                  if (isAnswered) {
                    if (isThisCorrect) {
                      style = 'bg-emerald-50 border-2 border-emerald-600 text-emerald-950 font-bold';
                      pillStyle = 'bg-emerald-600 text-white';
                    } else if (isThisSelected && !isThisCorrect) {
                      style = 'bg-rose-50 border-2 border-rose-500 text-rose-950 font-medium';
                      pillStyle = 'bg-rose-500 text-white';
                    } else {
                      style = 'bg-white/60 border-slate-200 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${style}`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${pillStyle}`}>
                          {letter}
                        </span>
                        <span className="text-sm sm:text-base font-semibold">{opt}</span>
                      </div>
                      {isAnswered && isThisCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {isAnswered && isThisSelected && !isThisCorrect && <XCircle className="w-4 h-4 text-rose-500" />}
                    </button>
                  );
                })}
              </div>

              {/* Feedback box */}
              {isAnswered && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 animate-in fade-in ${
                    selectedAnswer === currentQ.correctIndex
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="font-bold flex items-center space-x-1">
                    <span>{selectedAnswer === currentQ.correctIndex ? '✓ Helyes!' : '✗ Nem egészen...'}</span>
                    <span className="font-medium text-slate-800">{currentQ.explanation}</span>
                  </div>
                  <div className="text-slate-600 italic">HU: {currentQ.translation}</div>
                </div>
              )}
            </div>

            {/* Next Button */}
            {isAnswered && (
              <div className="pt-3">
                <button
                  onClick={handleNext}
                  className="w-full py-3.5 px-4 rounded-xl font-black text-slate-900 text-base shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                  style={{
                    background: 'linear-gradient(90deg, #f87171 0%, #fb923c 25%, #facc15 50%, #60a5fa 75%, #a855f7 100%)',
                  }}
                >
                  <span>
                    {currentIndex + 1 === questions.length
                      ? isMistakeMode
                        ? 'Javítás befejezése & Eredmény 🏆'
                        : 'Részletes Szintkiértékelés 🏆'
                      : 'Következő mondat →'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= STAGE 3: DETAILED DIAGNOSIS & BREAKDOWN ================= */}
        {stage === 'finished' && (
          <div className="py-2 overflow-y-auto space-y-4">
            {/* Header Result */}
            <div className="text-center pt-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-emerald-400 text-white shadow-md mb-2">
                <Trophy className="w-7 h-7 text-slate-900" />
              </div>

              <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                A 20 Kérdéses Szintfelmérő Eredménye
              </span>

              <div className="text-4xl font-black text-slate-900 mt-1">
                {displayScore} <span className="text-xl font-bold text-slate-400">/ 20 pont</span>
              </div>

              {/* Recommended CEFR Badge */}
              <div className="mt-3 inline-block">
                <span className={`px-4 py-1.5 rounded-full text-sm font-black shadow-xs ${displayDiagnosis.badgeColor}`}>
                  {displayDiagnosis.title}
                </span>
              </div>

              <p className="mt-2.5 text-xs sm:text-sm font-semibold text-slate-700 max-w-md mx-auto">
                {displayDiagnosis.summary}
              </p>
            </div>

            {/* Success Banner if Mistakes were successfully reviewed */}
            {mistakesReviewed && savedSummary && savedSummary.mistakes.length > 0 && (
              <div className="bg-emerald-50 border-2 border-emerald-400 p-3.5 rounded-2xl flex items-start space-x-3 text-emerald-950 shadow-xs">
                <CheckCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-extrabold text-sm text-emerald-900">
                    Bravó! Sikeresen átnézted mind a(z) {savedSummary.mistakes.length} hibás mondatot!
                  </div>
                  <div className="text-emerald-800 leading-relaxed font-medium">
                    A szerkezeteket most már jól rögzítetted. Az eredeti 20 kérdéses felmérőd alapján a hivatalos szinted:{' '}
                    <strong>{displayDiagnosis.title}</strong> maradt ({displayScore}/20 pont).
                  </div>
                </div>
              </div>
            )}

            {/* Level by level breakdown (A1, A2, B1, B2) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-medium uppercase tracking-wider text-slate-700">
                Szintenkénti Teljesítményed:
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* A1 */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-emerald-800">A1 Kezdő</span>
                    <span className="font-black text-slate-900">{displayLevelScores.A1.correct} / 5</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${(displayLevelScores.A1.correct / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* A2 */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-amber-800">A2 Alapfok</span>
                    <span className="font-black text-slate-900">{displayLevelScores.A2.correct} / 5</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${(displayLevelScores.A2.correct / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* B1 */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-orange-800">B1 Közép</span>
                    <span className="font-black text-slate-900">{displayLevelScores.B1.correct} / 5</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-500 h-full"
                      style={{ width: `${(displayLevelScores.B1.correct / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* B2 */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-purple-800">B2 Haladó</span>
                    <span className="font-black text-slate-900">{displayLevelScores.B2.correct} / 5</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full"
                      style={{ width: `${(displayLevelScores.B2.correct / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                💡 <strong>Tanári tanács:</strong> {displayDiagnosis.advice}
              </div>
            </div>

            {/* Mistakes Review & Retry if any mistakes */}
            {savedSummary && savedSummary.mistakes.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Átnézendő hibák ({savedSummary.mistakes.length} mondat)
                  </h4>
                  {mistakesReviewed ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Átismételve</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      Gyakorolható
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {savedSummary.mistakes.map((m, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/60 text-xs">
                      <div className="font-bold text-slate-900 mb-1">
                        {m.question.question.replace(/_+/g, `[${m.question.options[m.question.correctIndex]}]`)}
                      </div>
                      <div className="text-[11px] text-rose-800 mb-1">
                        Te válaszod: <span className="line-through">{m.question.options[m.userIndex]}</span> → Helyes:{' '}
                        <span className="font-bold underline text-emerald-800">{m.question.options[m.question.correctIndex]}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">💡 {m.question.explanation}</div>
                      <div className="text-[10px] text-slate-500 italic mt-0.5">HU: {m.question.translation}</div>
                    </div>
                  ))}
                </div>

                {!mistakesReviewed && (
                  <button
                    onClick={handleStartMistakePractice}
                    className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-slate-900 transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                    style={{
                      background: 'linear-gradient(90deg, #facc15 0%, #fb923c 50%, #f87171 100%)',
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Csak a hibák újra gyakorlása ({savedSummary.mistakes.length} mondat) 🔄</span>
                  </button>
                )}
              </div>
            )}

            {/* Copy Result Link (Facebook share button removed as requested) */}
            <div className="pt-1">
              <button
                onClick={handleCopyResultText}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedShare ? 'Eredmény szövege vágólapra másolva!' : 'Eredmény szövegének másolása'}</span>
              </button>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  onSelectLevel(displayDiagnosis.level);
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer"
              >
                <span>Ugrás az ajánlott heti kvízhez ({displayDiagnosis.level})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleStartTest}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Új 20 kérdéses szintfelmérő (új kérdések a 300 mondatos bankból)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
