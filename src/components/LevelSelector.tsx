import React from 'react';
import { CefrLevel } from '../types';
import { CEFR_LEVELS } from '../data/quizzes';
import { Sparkles, HelpCircle } from 'lucide-react';

interface LevelSelectorProps {
  currentLevel: CefrLevel;
  onSelectLevel: (lvl: CefrLevel) => void;
  onOpenDiagnostic: () => void;
  quizCountsByLevel: Record<CefrLevel, number>;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  currentLevel,
  onSelectLevel,
  onOpenDiagnostic,
  quizCountsByLevel,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-3 pb-1">
      <div className="flex items-center justify-between mb-1.5 text-xs text-slate-600 font-medium">
        <span className="font-bold uppercase tracking-wider text-slate-700">Válassz nyelvi szintet:</span>
        <button
          onClick={onOpenDiagnostic}
          className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1 underline decoration-dotted"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>20 kérdéses szintfelmérő 🎯</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {CEFR_LEVELS.map((info) => {
          const isSelected = currentLevel === info.level;
          const count = quizCountsByLevel[info.level] || 0;

          return (
            <button
              key={info.level}
              onClick={() => onSelectLevel(info.level)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all border text-center relative ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-102 ring-2 ring-emerald-500/30'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-1">
                <span className="font-extrabold text-sm sm:text-base">{info.level}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
              </div>
              <span className={`text-[10px] sm:text-xs font-semibold truncate max-w-full ${isSelected ? 'text-emerald-300' : 'text-slate-500'}`}>
                {info.name}
              </span>
              <span className={`text-[9px] mt-0.5 px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {count} kvíz
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
