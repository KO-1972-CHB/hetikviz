import React, { useState } from 'react';
import { QuizImportPanel } from './QuizImportPanel';
import { QuizReviewPanel } from './QuizReviewPanel';
import { CefrLevel, QuizPackage, QuizQuestion } from '../types';
import {
  Sparkles,
  X,
  Check,
  Copy,
  Download,
  Trash2,
  BookOpen,
  AlertCircle,
  RefreshCw,
  Layers,
  Star,
  CheckCheck,
  ArrowRight,
  ExternalLink,
  Code2,
  FileCode,
  FolderOpen,
  Search,
} from 'lucide-react';
import { saveCustomQuiz, deleteCustomQuiz, getStoredCustomQuizzes } from '../utils/quizUtils';
import { NYELVTAN_CURRICULUM, CurriculumTopic } from '../data/curriculum';

interface TeacherStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizCreatedOrSelected: (quiz: QuizPackage) => void;
  currentWeekNumber: number;
  onQuizDeleted?: () => void;
  onPublished: () => void;
  onOpenChangelog?: () => void;
}

export const TeacherStudioModal: React.FC<TeacherStudioModalProps> = ({
  isOpen,
  onClose,
  onQuizCreatedOrSelected,
  currentWeekNumber,
  onQuizDeleted,
  onPublished,
  onOpenChangelog,
}) => {
  const [activeTab, setActiveTab] = useState<'generator' | 'curriculum' | 'source'>('generator');
  const [level, setLevel] = useState<CefrLevel>('A2');
  const [topic, setTopic] = useState('Gyakori hibák és prepozíciók');
  const [week, setWeek] = useState(currentWeekNumber + 1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizPackage | null>(null);
  const [customList, setCustomList] = useState<QuizPackage[]>(() => getStoredCustomQuizzes());
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Source code explorer state
  const [sourceFiles, setSourceFiles] = useState<{ path: string; content: string; size: number }[]>([]);
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('package.json');
  const [sourceSearch, setSourceSearch] = useState('');
  const [copiedSourceFile, setCopiedSourceFile] = useState(false);

  // 1-Click Multi-Level Bundle State
  const [isGeneratingBundle, setIsGeneratingBundle] = useState(false);
  const [bundleQuizzes, setBundleQuizzes] = useState<QuizPackage[] | null>(null);
  const [bundleFailures, setBundleFailures] = useState<{ level: CefrLevel; topic: string; error: string }[]>([]);
  const [copiedBundlePost, setCopiedBundlePost] = useState(false);

  const handleDownloadSourceZip = () => {
    setIsDownloadingZip(true);
    const link = document.createElement('a');
    link.href = '/api/download-source-zip';
    link.setAttribute('download', 'gyakorlatias-angol-source.zip');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloadingZip(false), 2500);
  };

  const loadSourceFiles = async () => {
    setIsLoadingSource(true);
    setSourceError(null);
    try {
      const res = await fetch('/api/source-files');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Nem sikerült betölteni a forrásfájlokat.');
      }
      setSourceFiles(json.files || []);
      if (json.files?.length && !json.files.some((f: any) => f.path === selectedFilePath)) {
        setSelectedFilePath(json.files[0].path);
      }
    } catch (err: any) {
      setSourceError(err?.message || 'Hiba a forrásfájlok betöltése közben.');
    } finally {
      setIsLoadingSource(false);
    }
  };

  const handleOpenSourceTab = () => {
    setActiveTab('source');
    if (sourceFiles.length === 0) {
      loadSourceFiles();
    }
  };

  // Curriculum tab state
  const [curriculumLevel, setCurriculumLevel] = useState<CefrLevel>('A1');
  const [curriculumSearch, setCurriculumSearch] = useState('');

  if (!isOpen) return null;

  const quickTopicSuggestions = [
    { label: 'Present Simple vs Continuous', level: 'A1' },
    { label: 'In / On / At idő & hely', level: 'A2' },
    { label: 'Past Simple vs Present Perfect', level: 'B1' },
    { label: 'Feltételes mód (Conditionals 1-2)', level: 'B1' },
    { label: 'Phrasal verbs a munkahelyen', level: 'B2' },
    { label: 'Much vs Many & Mennyiségek', level: 'A2' },
  ];

  // 1-Click: Generate all 4 levels (A1 + A2 + B1 + B2) simultaneously
  const handleGenerateBundle = async () => {
    setIsGeneratingBundle(true);
    setErrorMessage(null);
    setBundleFailures([]);

    try {
      const response = await fetch('/api/generate-weekly-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNumber: Number(week) || currentWeekNumber }),
      });

      const json = await response.json();
      setBundleFailures(json.failures || []);
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Hiba történt a 4 szintes heti kvízcsomag generálása közben.');
      }

      const createdPackages: QuizPackage[] = json.quizzes.map((item: any, idx: number) => {
        const d = item.data;
        const pkg: QuizPackage = {
          id: `custom-bundle-${item.level.toLowerCase()}-${Date.now()}-${idx}`,
          title: d.title || `${item.topic} (${item.level})`,
          subtitle: d.description || `10 kérdéses heti feladatsor (${item.level})`,
          level: item.level as CefrLevel,
          weekNumber: Number(week) || currentWeekNumber,
          year: new Date().getFullYear(),
          topic: item.topic,
          badgeText: `Heti ${item.level}`,
          isCustom: true,
          questions: d.questions.map((q: any, i: number) => ({
            id: `ai-bundle-${item.level.toLowerCase()}-${i + 1}-${Date.now()}`,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            translation: q.translation,
            tip: q.tip,
          })),
        };
        return pkg;
      });

      setBundleQuizzes(createdPackages);
      setGeneratedQuiz(createdPackages[0] ?? null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Nem sikerült legenerálni a 4 szintes kvízcsomagot. Ellenőrizd a kapcsolatot!');
    } finally {
      setIsGeneratingBundle(false);
    }
  };

  // Generate single quiz
  const handleGenerateAI = async (overrideTopic?: string, overrideLevel?: CefrLevel) => {
    const topicToUse = overrideTopic || topic;
    const levelToUse = overrideLevel || level;

    setIsLoading(true);
    setErrorMessage(null);
    setGeneratedQuiz(null);
    setActiveTab('generator');

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: levelToUse,
          topic: topicToUse,
          count: 10,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'A szerver hibát jelzett a kvíz generálása közben.');
      }

      const data = json.data;
      const newPackage: QuizPackage = {
        id: `custom-${Date.now()}`,
        title: data.title || `${topicToUse} (${levelToUse})`,
        subtitle: data.description || '10 kérdéses heti gyakorló kvíz',
        level: levelToUse,
        weekNumber: Number(week) || currentWeekNumber,
        year: new Date().getFullYear(),
        topic: topicToUse,
        badgeText: 'AI Hetes Kvíz',
        isCustom: true,
        questions: data.questions.map((q: any, i: number) => ({
          id: `ai-q-${i + 1}-${Date.now()}`,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          translation: q.translation,
          tip: q.tip,
        })),
      };

      if (bundleQuizzes?.[0]?.weekNumber === newPackage.weekNumber &&
          !bundleQuizzes.some(quiz => quiz.level === newPackage.level) &&
          bundleFailures.some(failure => failure.level === newPackage.level && failure.topic === newPackage.topic)) {
        setBundleQuizzes(current => current ? [...current, newPackage].sort((a, b) => a.level.localeCompare(b.level)) : current);
        setBundleFailures(failures => failures.filter(failure => failure.level !== newPackage.level));
      }
      setGeneratedQuiz(newPackage);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Nem sikerült legenerálni a kvízt. Ellenőrizd a kapcsolatot!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndUse = (quizToSave: QuizPackage) => {
    updateDraft(quizToSave);
    saveCustomQuiz(quizToSave);
    setCustomList(getStoredCustomQuizzes());
    onQuizCreatedOrSelected(quizToSave);
    onClose();
  };

  const updateDraft = (quiz: QuizPackage) => {
    setBundleQuizzes(current => current?.map(item => item.id === quiz.id ? quiz : item) ?? null);
    setGeneratedQuiz(quiz);
  };

  const handlePublished = (quiz: QuizPackage) => {
    updateDraft(quiz);
    try {
      saveCustomQuiz(quiz);
      setCustomList(getStoredCustomQuizzes());
      onPublished();
    } catch {
      setErrorMessage('A kvíz közzétéve. A helyi másolat mentése sikertelen, másold ki a linket.');
    }
  };

  const handleDeleteSaved = (quiz: QuizPackage, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Biztosan törölni szeretnéd a(z) "${quiz.title}" heti kvízt? A művelet végleges.`)) {
      deleteCustomQuiz(quiz.id);
      setCustomList(getStoredCustomQuizzes());
      if (onQuizDeleted) {
        onQuizDeleted();
      }
    }
  };

  const getBundleFacebookPost = (quizzes: QuizPackage[], weekNo: number) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gyakorlatiasangol.hu';
    const a1 = quizzes.find((q) => q.level === 'A1');
    const a2 = quizzes.find((q) => q.level === 'A2');
    const b1 = quizzes.find((q) => q.level === 'B1');
    const b2 = quizzes.find((q) => q.level === 'B2');

    return `📢 SZIA CSOPORT! MEGÉRKEZTEK A HETI KVÍZEK MIND A 4 SZINTEN! 🇬🇧✨
📅 ${weekNo}. HÉT | 10-10 kérdéses villámtesztek azonnali magyar magyarázatokkal és kiejtéssel:

🟢 A1 KEZDŐ: "${a1?.title || 'Kezdő heti feladatsor'}"
👉 Teszteld le itt: ${origin}/?level=A1&quiz=${a1?.publishedId || ''}

🟡 A2 ALAPFOK / ÚJRAKEZDŐ: "${a2?.title || 'Alapfokú heti feladatsor'}"
👉 Teszteld le itt: ${origin}/?level=A2&quiz=${a2?.publishedId || ''}

🟠 B1 KÖZÉPHALADÓ: "${b1?.title || 'Középhaladó heti feladatsor'}"
👉 Teszteld le itt: ${origin}/?level=B1&quiz=${b1?.publishedId || ''}

🟣 B2 HALADÓ: "${b2?.title || 'Haladó heti feladatsor'}"
👉 Teszteld le itt: ${origin}/?level=B2&quiz=${b2?.publishedId || ''}

🎯 Nem vagy biztos benne, melyik szint a tiéd? Töltsd ki a 20 kérdéses szintfelmérőt az oldalon!
Kommentben írjátok meg a csoportban, kinek hány pont lett a saját szintjén! 🏆👇`;
  };

  const handleCopyBundlePost = (quizzes: QuizPackage[]) => {
    const text = getBundleFacebookPost(quizzes, Number(week) || currentWeekNumber);
    navigator.clipboard.writeText(text);
    setCopiedBundlePost(true);
    setTimeout(() => setCopiedBundlePost(false), 3000);
  };

  const handleSelectCurriculumTopic = (item: CurriculumTopic) => {
    setTopic(`${item.title} (${item.pattern})`);
    setLevel(item.level);
    setActiveTab('generator');
  };

  // Filter curriculum topics
  const filteredCurriculum = NYELVTAN_CURRICULUM[curriculumLevel].filter((t) => {
    const s = curriculumSearch.toLowerCase();
    return t.title.toLowerCase().includes(s) || t.pattern.toLowerCase().includes(s);
  });

  return (
    <div className="quiz-dialog-backdrop">
      <div
        role="dialog"
        aria-labelledby="teacher-studio-title"
        className={`quiz-dialog ${
          activeTab === 'source' ? 'max-w-5xl' : 'max-w-3xl'
        }`}
      >
        {/* Header */}
        <div className="quiz-dialog-heading">
          <div className="flex min-w-0 items-center gap-3">
            <div className="quiz-dialog-icon bg-[#ede3fa] text-[#62408d]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="teacher-studio-title" className="text-lg font-bold leading-tight tracking-tight sm:text-2xl">
                Tanári Vezérlő & AI Kvízkészítő
              </h2>
              <p className="mt-1 text-sm text-[#426075]">
                Készíts új 10 kérdéses heti csomagokat a közösségnek másodpercek alatt!
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleDownloadSourceZip}
              disabled={isDownloadingZip}
              className="py-1 px-2 sm:px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] sm:text-xs font-bold transition flex items-center space-x-1 cursor-pointer border border-emerald-200"
              title="A teljes forráskód letöltése .zip archívumban"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isDownloadingZip ? 'Tömörítés...' : 'Forráskód (.ZIP)'}</span>
            </button>

            {onOpenChangelog && (
              <button
                onClick={onOpenChangelog}
                className="py-1 px-2 sm:px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] sm:text-xs font-medium transition flex items-center space-x-1 cursor-pointer"
                title="Rendszerverzió és funkciókalauz megtekintése"
              >
                <span>4.0 útmutató</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Tanári Stúdió bezárása"
              className="quiz-dialog-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs: AI Generator vs 100 Témás Tematika vs Forráskód */}
        <div className="flex flex-wrap gap-1.5 py-3 shrink-0">
          <button
            onClick={() => setActiveTab('generator')}
            aria-pressed={activeTab === 'generator'}
            className="quiz-dialog-tab"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Kvízgenerálás és szerkesztés</span>
          </button>

          <button
            onClick={() => setActiveTab('curriculum')}
            aria-pressed={activeTab === 'curriculum'}
            className="quiz-dialog-tab"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nyelvtani tematika (A1–B2)</span>
          </button>

          <button
            onClick={handleOpenSourceTab}
            aria-pressed={activeTab === 'source'}
            className="quiz-dialog-tab"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Forráskód</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-3 space-y-4 pr-1 text-slate-800 flex-1 min-h-0">
          {activeTab === 'generator' ? (
            <>
              {/* ========================================================================= */}
              {/* 1-CLICK MULTI-LEVEL WEEKLY BUNDLE GENERATOR (A1 + A2 + B1 + B2) */}
              {/* ========================================================================= */}
              <div className="bg-[#edf7fc] border border-[#b9d9e9] rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded-md shadow-2xs flex items-center space-x-1">
                        <Layers className="w-3 h-3" />
                        <span>Heti csomag</span>
                      </span>
                      <span className="text-xs font-medium text-slate-700">
                        {week}. heti feladatsorok
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-medium text-slate-900 tracking-tight">
                      Generálj egyszerre mind a 4 szintre heti kvízt (A1 + A2 + B1 + B2)
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Egyetlen kattintásra a AI mind a 4 szintre kiválaszt egy véletlenszerű tantervi témát, és legenerálja a heti 10-10 kérdéses feladatsort magyar magyarázatokkal!
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateBundle}
                    disabled={isGeneratingBundle || isLoading}
                    className="quiz-primary min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold disabled:opacity-50"
                  >
                    {isGeneratingBundle ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                        <span>4 szint generálása...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>4 heti kvíz generálása</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Progress bar during bundle generation */}
                {isGeneratingBundle && (
                  <div className="p-3 bg-white/90 rounded-xl border border-emerald-200 text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between font-bold text-slate-800 text-[11px]">
                      <span>AI dolgozik mind a 4 szinten (automatikus terhelésvédelemmel)...</span>
                      <span className="text-emerald-700">Folyamatban</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-extrabold">
                      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-900 animate-pulse">A1 Kezdő</div>
                      <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900 animate-pulse">A2 Alapfok</div>
                      <div className="p-1.5 rounded-lg bg-orange-100 text-orange-900 animate-pulse">B1 Közép</div>
                      <div className="p-1.5 rounded-lg bg-purple-100 text-purple-900 animate-pulse">B2 Haladó</div>
                    </div>
                  </div>
                )}

                {bundleFailures.length > 0 && (
                  <ul aria-label="Sikertelen szintek" className="space-y-2">
                    {bundleFailures.map(({ level: failedLevel, topic: failedTopic, error }) => (
                      <li key={failedLevel} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                        <p><strong>{failedLevel}</strong> · {failedTopic}</p>
                        <p>{error}</p>
                        <button className="quiz-dialog-tab mt-2" onClick={() => {
                          setLevel(failedLevel);
                          setTopic(failedTopic);
                        }}>{failedLevel} beállítása külön generáláshoz</button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Bundle Results Preview */}
                {bundleQuizzes && (
                  <div className="bg-white rounded-2xl p-4 border border-emerald-300 shadow-xs space-y-3 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <CheckCheck className="w-5 h-5 text-emerald-600" />
                        <span className="font-extrabold text-xs sm:text-sm text-emerald-950">
                          Elkészült {bundleQuizzes.length} heti kvíz a négyből ({bundleQuizzes[0].weekNumber}. hét).
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Kérdésenként ellenőrizhető tervezetek
                      </span>
                    </div>

                    {/* 4 Quizzes Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {bundleQuizzes.map((bq) => (
                        <div
                          key={bq.id}
                          className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-slate-50/50 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                bq.level === 'A1'
                                  ? 'bg-emerald-600 text-white'
                                  : bq.level === 'A2'
                                  ? 'bg-amber-500 text-slate-900'
                                  : bq.level === 'B1'
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-purple-600 text-white'
                              }`}
                            >
                              {bq.level} Szint
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">10 kérdés</span>
                          </div>
                          <div className="font-bold text-slate-900 line-clamp-1">{bq.title}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 italic">{bq.topic}</div>
                          <button className="quiz-dialog-tab" onClick={() => setGeneratedQuiz(bq)}>
                            {bq.level} {bq.publishedId ? 'közzétett kvíz' : 'ellenőrzése'}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Actions for the bundle */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        onClick={() => handleCopyBundlePost(bundleQuizzes)}
                        disabled={bundleQuizzes.length !== 4 || bundleQuizzes.some(quiz => !quiz.publishedId)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
                        title="Formázott Facebook bejegyzés a 4 szint közvetlen linkjeivel a csoport számára"
                      >
                        {copiedBundlePost ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedBundlePost ? 'Teljes poszt másolva!' : 'Heti 4-es Facebook poszt másolása 📋'}</span>
                      </button>


                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* SINGLE QUIZ GENERATOR & CUSTOMIZER */}
              {/* ========================================================================= */}
              <div className="bg-white p-4 rounded-2xl border border-[#cce1eb] space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-slate-700">
                    Egyedi Kvíz Generálása vagy Módosítása:
                  </h3>
                  <span className="text-[11px] text-slate-500 font-semibold">1 szint / témakör</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Célcsoport Szintje
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {(['A1', 'A2', 'B1', 'B2'] as CefrLevel[]).map((l) => (
                        <button
                          key={l}
                          onClick={() => setLevel(l)}
                          className={`py-1.5 font-bold text-xs rounded-lg border transition cursor-pointer ${
                            level === l
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Kvíz Hét Száma
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={week}
                      onChange={(e) => setWeek(Number(e.target.value))}
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-300 bg-white font-bold text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Téma vagy Nyelvtani Fókusz
                    </label>
                    <button
                      onClick={() => setActiveTab('curriculum')}
                      className="text-[11px] text-emerald-700 font-bold underline hover:text-emerald-900 cursor-pointer"
                    >
                      Böngészés a 100 témából →
                    </button>
                  </div>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Pl. Present Continuous vs Simple, Phrasal verbs..."
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold focus:outline-emerald-500"
                  />
                </div>

                {/* Quick Suggestions */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-2">
                    Gyakori témák:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {quickTopicSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setTopic(s.label);
                          setLevel(s.level as CefrLevel);
                        }}
                        className="text-[11px] bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-md transition cursor-pointer"
                      >
                        {s.label} ({s.level})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Action Button */}
                <button
                  onClick={() => handleGenerateAI()}
                  disabled={isLoading || isGeneratingBundle || !topic.trim()}
                  className="w-full py-3 px-4 rounded-xl font-bold text-slate-900 text-sm tracking-tight flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-50 cursor-pointer"
                  style={{
                    background: 'linear-gradient(90deg, #facc15 0%, #34d399 50%, #38bdf8 100%)',
                  }}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                      <span>10 kérdéses kvíz generálása AI-val...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Egyedi Kvíz Generálása ({level} szint • 10 kérdés)</span>
                    </>
                  )}
                </button>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span role="alert" className="font-medium leading-relaxed">{errorMessage}</span>
                  </div>
                  <button
                    onClick={() => handleGenerateAI()}
                    className="self-end sm:self-auto px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 cursor-pointer transition shadow-xs"
                  >
                    Újrapróbálás 🔄
                  </button>
                </div>
              )}

              <QuizImportPanel level={level} topic={topic} weekNumber={Number(week) || currentWeekNumber}
                disabled={isLoading || isGeneratingBundle}
                onImport={quiz => { setErrorMessage(null); setGeneratedQuiz(quiz); }}
              />

              {generatedQuiz && (
                <QuizReviewPanel
                  key={generatedQuiz.id}
                  quiz={generatedQuiz}
                  onDraftChange={updateDraft}
                  onSaveLocal={handleSaveAndUse}
                  onPublished={handlePublished}
                />
              )}

              {/* Already Saved Custom Quizzes */}
              {customList.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Általad készített heti csomagok ({customList.length}):
                  </h3>
                  <div className="space-y-2">
                    {customList.map((cq) => (
                      <div
                        key={cq.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                              {cq.level}
                            </span>
                            <span className="text-xs font-medium text-slate-900 tracking-tight">{cq.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {cq.weekNumber}. hét • {cq.questions.length} kérdés
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleSaveAndUse(cq)}
                            className="py-1 px-2.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer"
                          >
                            Megnyitás
                          </button>
                          <button className="quiz-dialog-tab" onClick={() => setGeneratedQuiz(cq)}>
                            {cq.publishedId ? 'Megosztás' : 'Ellenőrzés'}
                          </button>
                          <button
                            onClick={(e) => handleDeleteSaved(cq, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                            title="Törlés"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : activeTab === 'curriculum' ? (
            /* ================= 100 TÉMÁS NYELVTAN TEMATIKA TAB ================= */
            <div className="space-y-3">
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
                <p className="font-semibold">
                  A Gyakorlatias Angol teljes <strong>100 témás nyelvtani tematikája</strong> (A1–B2). Kattints bármelyik témára, hogy azonnal készíts rá egy 10 kérdéses heti kvízcsomagot!
                </p>
              </div>

              {/* Level switchers for curriculum */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex space-x-1">
                  {(['A1', 'A2', 'B1', 'B2'] as CefrLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setCurriculumLevel(lvl)}
                      className={`py-1 px-2.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        curriculumLevel === lvl
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lvl} (25 téma)
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Keresés a témák között..."
                  value={curriculumSearch}
                  onChange={(e) => setCurriculumSearch(e.target.value)}
                  className="py-1 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 w-44"
                />
              </div>

              {/* Topics list */}
              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                {filteredCurriculum.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-400 w-5 text-right">{item.number}.</span>
                        <span className="font-bold text-slate-900">{item.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 ml-7">
                        Minták: <span className="italic">{item.pattern}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectCurriculumTopic(item)}
                      className="py-1 px-2.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold text-[11px] shrink-0 transition cursor-pointer"
                    >
                      Kiválasztás →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ================= TELJES PROJEKT FORRÁSKÓD BÖNGÉSZŐ TAB ================= */
            <div className="flex flex-col space-y-3 h-full">
              {/* Top Info & Download Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-900">Projekt teljes eredeti forráskódja</span>{' '}
                  <span className="text-slate-500">
                    ({sourceFiles.length} fájl • src, components, data, utils, package.json, server.ts)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownloadSourceZip}
                    disabled={isDownloadingZip}
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloadingZip ? 'ZIP készítése...' : 'Teljes projekt letöltése (.ZIP)'}</span>
                  </button>
                </div>
              </div>

              {isLoadingSource ? (
                <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                  <span>Forrásfájlok betöltése...</span>
                </div>
              ) : sourceError ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                  <span>{sourceError}</span>
                  <button
                    onClick={loadSourceFiles}
                    className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                  >
                    Újrapróbálás
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[420px] max-h-[58vh]">
                  {/* Left File Tree */}
                  <div className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex flex-col overflow-hidden">
                    <div className="relative mb-2 shrink-0">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={sourceSearch}
                        onChange={(e) => setSourceSearch(e.target.value)}
                        placeholder="Fájl keresése (pl. App.tsx)..."
                        className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-emerald-500"
                      />
                    </div>

                    <div className="overflow-y-auto space-y-3 pr-1 flex-1">
                      {(() => {
                        const filtered = sourceFiles.filter((f) =>
                          f.path.toLowerCase().includes(sourceSearch.toLowerCase())
                        );
                        const groups: { label: string; items: typeof filtered }[] = [
                          {
                            label: 'Gyökérfájlok (Konfiguráció & Szerver)',
                            items: filtered.filter((f) => !f.path.includes('/')),
                          },
                          {
                            label: 'src/components/',
                            items: filtered.filter((f) => f.path.startsWith('src/components/')),
                          },
                          {
                            label: 'src/data/',
                            items: filtered.filter((f) => f.path.startsWith('src/data/')),
                          },
                          {
                            label: 'src/utils/',
                            items: filtered.filter((f) => f.path.startsWith('src/utils/')),
                          },
                          {
                            label: 'src/ (Alkalmazás gyökér)',
                            items: filtered.filter(
                              (f) =>
                                f.path.startsWith('src/') &&
                                !f.path.startsWith('src/components/') &&
                                !f.path.startsWith('src/data/') &&
                                !f.path.startsWith('src/utils/')
                            ),
                          },
                          {
                            label: 'scripts/ (Build eszközök)',
                            items: filtered.filter((f) => f.path.startsWith('scripts/')),
                          },
                        ];

                        return groups
                          .filter((g) => g.items.length > 0)
                          .map((group) => (
                            <div key={group.label} className="space-y-1">
                              <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1.5">
                                <FolderOpen className="w-3 h-3 text-amber-500 shrink-0" />
                                <span className="truncate">{group.label}</span>
                              </div>
                              <div className="space-y-0.5">
                                {group.items.map((f) => {
                                  const fileName = f.path.split('/').pop() || f.path;
                                  const isSelected = selectedFilePath === f.path;
                                  return (
                                    <button
                                      key={f.path}
                                      onClick={() => {
                                        setSelectedFilePath(f.path);
                                        setCopiedSourceFile(false);
                                      }}
                                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                                        isSelected
                                          ? 'bg-slate-900 text-white font-medium shadow-2xs'
                                          : 'text-slate-700 hover:bg-white hover:shadow-2xs'
                                      }`}
                                      title={f.path}
                                    >
                                      <span className="flex items-center space-x-1.5 truncate">
                                        <FileCode
                                          className={`w-3.5 h-3.5 shrink-0 ${
                                            isSelected ? 'text-amber-400' : 'text-slate-400'
                                          }`}
                                        />
                                        <span className="truncate">{fileName}</span>
                                      </span>
                                      <span
                                        className={`text-[10px] shrink-0 ml-1 ${
                                          isSelected ? 'text-slate-300' : 'text-slate-400'
                                        }`}
                                      >
                                        {(f.size / 1024).toFixed(1)} KB
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ));
                      })()}
                    </div>
                  </div>

                  {/* Right Code Viewer */}
                  <div className="md:col-span-8 bg-[#1e293b] text-slate-100 rounded-2xl border border-slate-700 flex flex-col overflow-hidden">
                    {(() => {
                      const activeFile = sourceFiles.find((f) => f.path === selectedFilePath) || sourceFiles[0];
                      if (!activeFile) {
                        return (
                          <div className="p-8 text-center text-xs text-slate-400">
                            Válassz ki egy fájlt a bal oldali listából!
                          </div>
                        );
                      }
                      const lineCount = activeFile.content.split('\n').length;

                      return (
                        <>
                          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-700 shrink-0">
                            <div className="flex items-center space-x-2 min-w-0">
                              <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="font-mono text-xs font-medium text-white truncate">
                                {activeFile.path}
                              </span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                ({lineCount} sor • {(activeFile.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(activeFile.content);
                                setCopiedSourceFile(true);
                                setTimeout(() => setCopiedSourceFile(false), 2500);
                              }}
                              className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center space-x-1 transition cursor-pointer shrink-0 border border-slate-600"
                            >
                              {copiedSourceFile ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-300">Kimásolva!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Fájl másolása</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="flex-1 overflow-auto p-3 font-mono text-[11px] sm:text-xs leading-relaxed">
                            <pre className="whitespace-pre text-slate-100">
                              <code>{activeFile.content}</code>
                            </pre>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
