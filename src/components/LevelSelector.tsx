import React from 'react';
import { CefrLevel } from '../types';
import { CEFR_LEVELS } from '../data/quizzes';
import { ArrowRight, Check, HelpCircle } from 'lucide-react';

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
    <section className="app-container my-5 sm:my-7" aria-labelledby="level-selector-heading">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 id="level-selector-heading" className="text-lg font-bold">Válassz nyelvi szintet</h2>
        <button onClick={onOpenDiagnostic} className="quiz-nav-button">
          <HelpCircle aria-hidden="true" size={17} /> 20 kérdéses szintfelmérő
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {CEFR_LEVELS.map(({ level, name }) => {
          const isSelected = currentLevel === level;
          return (
            <button key={level} onClick={() => onSelectLevel(level)}
              aria-pressed={isSelected} className="level-tile" data-level={level}>
              <span className="level-badge">{level}</span>
              <span className="min-w-0 flex-1">
                <span className="block break-words font-bold leading-tight">{name}</span>
                <span className="mt-1 block text-xs text-[#476277]">{quizCountsByLevel[level] || 0} kvíz</span>
              </span>
              {isSelected ? <Check aria-hidden="true" size={17} className="level-arrow" /> :
                <ArrowRight aria-hidden="true" size={17} className="level-arrow" />}
            </button>
          );
        })}
      </div>
    </section>
  );
};
