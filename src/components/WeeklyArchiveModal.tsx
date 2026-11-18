import React, { useState } from 'react';
import { CefrLevel, QuizPackage } from '../types';
import { X, Search, Calendar, Check, Copy, Play, ArrowRight, Tag, Trash2, Eye, EyeOff, Star } from 'lucide-react';

interface WeeklyArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizzes: QuizPackage[];
  onSelectQuiz: (quiz: QuizPackage) => void;
  currentQuizId: string;
  isAdmin?: boolean;
  onDeleteQuiz?: (quizId: string) => void;
  onToggleHideQuiz?: (quizId: string) => void;
  hiddenQuizIds?: string[];
  pinnedQuizzes?: Record<CefrLevel, string | null>;
  onTogglePinQuiz?: (level: CefrLevel, quizId: string) => void;
}

export const WeeklyArchiveModal: React.FC<WeeklyArchiveModalProps> = ({
  isOpen,
  onClose,
  quizzes,
  onSelectQuiz,
  currentQuizId,
  isAdmin = false,
  onDeleteQuiz,
  onToggleHideQuiz,
  hiddenQuizIds = [],
  pinnedQuizzes = { A1: null, A2: null, B1: null, B2: null },
  onTogglePinQuiz,
}) => {
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<CefrLevel | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesLevel = selectedLevelFilter === 'ALL' || q.level === selectedLevelFilter;
    const matchesSearch =
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.subtitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const handleCopyLink = (quiz: QuizPackage, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?level=${quiz.level}&quiz=${quiz.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(quiz.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-medium text-slate-900 tracking-tight">
                Heti Kvíz Archívum & Csomagok
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Böngészd az összes 10 kérdéses heti feladatsort szintek szerint
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="pt-3 pb-2 space-y-2 shrink-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Keresés témára vagy nyelvtani kifejezésre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Level Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {(['ALL', 'A1', 'A2', 'B1', 'B2'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevelFilter(lvl)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition shrink-0 ${
                  selectedLevelFilter === lvl
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {lvl === 'ALL' ? 'Minden Szint' : `${lvl} Szint`}
              </button>
            ))}
          </div>
        </div>

        {/* List of quizzes */}
        <div className="overflow-y-auto py-2 space-y-2.5 pr-1 flex-1">
          {filteredQuizzes.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Nem található a keresésnek megfelelő kvízcsomag.
            </div>
          ) : (
            filteredQuizzes.map((q) => {
              const isCurrent = q.id === currentQuizId;
              const isPinned = pinnedQuizzes[q.level] === q.id;

              return (
                <div
                  key={q.id}
                  onClick={() => {
                    onSelectQuiz(q);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/30'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-white">
                        {q.level}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        🗓️ {q.weekNumber}. hét
                      </span>
                      {isPinned && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 flex items-center space-x-1 shadow-xs">
                          <Star className="w-3 h-3 fill-amber-950 text-amber-950" />
                          <span>Heti Aktív Kvíz</span>
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">
                          Éppen ez van megnyitva
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-medium text-slate-900 tracking-tight">
                      {q.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-1">{q.subtitle}</p>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 pt-0.5">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span>{q.topic}</span>
                      <span>•</span>
                      <span>{q.questions.length} kérdés</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center flex-wrap gap-y-1">
                    {isAdmin && (
                      <>
                        {onTogglePinQuiz && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePinQuiz(q.level, q.id);
                            }}
                            className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                              isPinned
                                ? 'bg-amber-100 border-amber-400 text-amber-950 hover:bg-amber-200'
                                : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-950 border-slate-200 hover:border-amber-300'
                            }`}
                            title={isPinned ? 'Kijelölés visszavonása (visszatér az aktuális naptári hétre)' : `Kijelölés a(z) ${q.level} szint heti aktív kvízének`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                            <span className="text-[11px]">{isPinned ? 'Heti aktív ⭐' : 'Heti aktívnak'}</span>
                          </button>
                        )}
                        {onToggleHideQuiz && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleHideQuiz(q.id);
                            }}
                            className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                              hiddenQuizIds.includes(q.id)
                                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                            title={hiddenQuizIds.includes(q.id) ? 'Rejtett kvíz (kattints a megjelenítéshez)' : 'Kvíz elrejtése a diákok elől'}
                          >
                            {hiddenQuizIds.includes(q.id) ? (
                              <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {q.isCustom && onDeleteQuiz && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Biztosan törölni szeretnéd a(z) "${q.title}" kvízt? Ez a művelet nem visszavonható.`)) {
                                onDeleteQuiz(q.id);
                              }
                            }}
                            className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition cursor-pointer"
                            title="Egyéni kvíz végleges törlése"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}

                    <button
                      onClick={(e) => handleCopyLink(q, e)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                      title="Közvetlen link másolása a Facebook csoporthoz"
                    >
                      {copiedId === q.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 text-[11px]">Másolva!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px] hidden sm:inline">Link</span>
                        </>
                      )}
                    </button>

                    <button className="py-2 px-3.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center space-x-1 hover:bg-slate-800 transition shadow-xs cursor-pointer">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Kitöltés</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
