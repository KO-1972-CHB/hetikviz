import { useState } from 'react';
import { Bookmark, Play, X } from 'lucide-react';
import type { SavedQuestion } from '../utils/savedPractice';

interface Props {
  questions: SavedQuestion[];
  onClose: () => void;
  onRemove: (question: SavedQuestion) => void;
  onPractice: (questions: SavedQuestion[]) => void;
  error: string;
}

export function SavedPracticeModal({ questions, onClose, onRemove, onPractice, error }: Props) {
  const [filter, setFilter] = useState('');
  const topicKey = (q: SavedQuestion) => JSON.stringify([q.level, q.topic]);
  const topics = new Map(questions.map(q => [topicKey(q), `${q.level} · ${q.topic}`]));
  const selection = topics.has(filter) ? filter : '';
  const visible = selection ? questions.filter(q => topicKey(q) === selection) : questions;

  return (
    <div className="quiz-dialog-backdrop">
      <section role="dialog" aria-labelledby="saved-practice-title" className="quiz-dialog max-w-2xl">
        <header className="quiz-dialog-heading">
          <div className="flex items-center gap-3">
            <span className="quiz-dialog-icon bg-[#d3eaf6] text-[#07577d]"><Bookmark aria-hidden="true" /></span>
            <h2 id="saved-practice-title" className="text-xl font-bold">Saját gyakorlás</h2>
          </div>
          <button className="quiz-dialog-close" aria-label="Saját gyakorlás bezárása" onClick={onClose}><X aria-hidden="true" /></button>
        </header>
        <div className="min-h-0 space-y-3 overflow-y-auto px-1 py-3">
          {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
          {questions.length === 0 ? (
            <p className="text-sm">Még nincs elmentett kérdésed. A kvíz eredményoldalán a „Mentés gyakorláshoz” gombbal vehetsz fel kérdéseket.</p>
          ) : (
            <>
              <label className="block text-sm font-semibold">Szint és témakör
                <select className="quiz-dialog-input mt-1 w-full px-3 py-2" value={selection} onChange={e => setFilter(e.target.value)}>
                  <option value="">Minden mentett kérdés</option>
                  {[...topics].map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </label>
              <button className="quiz-primary min-h-11 items-center gap-2 rounded-xl px-4 font-bold" onClick={() => onPractice(visible)}>
                <Play aria-hidden="true" size={17} /> Gyakorlás indítása ({visible.length})
              </button>
              <ul className="space-y-2">
                {visible.map(item => (
                  <li key={item.key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#cce1eb] bg-white p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#426075]">{item.level} · {item.topic}</p>
                      <p lang="en" className="break-words font-semibold">{item.question.question}</p>
                    </div>
                    <button className="quiz-dialog-tab" aria-label={`Eltávolítás: ${item.question.question}`} onClick={() => onRemove(item)}>Eltávolítás</button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
