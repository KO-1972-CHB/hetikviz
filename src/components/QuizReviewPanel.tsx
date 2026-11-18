import { useState } from 'react';
import type { QuizPackage, QuizQuestion } from '../types';
import { reviewQuiz } from '../utils/quizReview';

interface ReviewResult {
  number: number;
  matches: boolean;
  answers: number[];
  note: string;
}

interface Props {
  quiz: QuizPackage;
  onDraftChange: (quiz: QuizPackage) => void;
  onSaveLocal: (quiz: QuizPackage) => void;
  onPublished: (quiz: QuizPackage) => void;
}

const field = 'quiz-dialog-input w-full px-3 py-2 text-sm';

export function QuizReviewPanel({ quiz, onDraftChange, onSaveLocal, onPublished }: Props) {
  const [draft, setDraft] = useState(quiz);
  const [approved, setApproved] = useState(false);
  const [results, setResults] = useState<ReviewResult[] | null>(null);
  const [busy, setBusy] = useState<'review' | 'publish' | null>(null);
  const [error, setError] = useState('');
  const issues = reviewQuiz(draft);

  function edit(updated: QuizPackage) {
    const edited = { ...updated, publishedId: undefined };
    setDraft(edited);
    onDraftChange(edited);
    setApproved(false);
    setResults(null);
    setError('');
  }

  function editQuestion(index: number, update: Partial<QuizQuestion>) {
    edit({ ...draft, questions: draft.questions.map((q, i) => i === index ? { ...q, ...update } : q) });
  }

  async function submit(action: 'review' | 'publish') {
    setError('');
    setBusy(action);
    try {
      const endpoint = action === 'review' ? 'review-quiz' : 'published-quizzes';
      if (action === 'review') setResults(null);
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz: draft, approved }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(data?.error || 'A művelethez működő szerver szükséges.');
      if (action === 'review') {
        setResults(data.results);
        setApproved(false);
      } else {
        const published = { ...draft, publishedId: data.id };
        setDraft(published);
        onPublished(published);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'A művelet sikertelen. Próbáld újra!');
    } finally {
      setBusy(null);
    }
  }

  const link = draft.publishedId ? `${window.location.origin}/?quiz=${draft.publishedId}` : null;
  return (
    <section className="quiz-surface rounded-2xl p-4 space-y-4" aria-label="Kvíz ellenőrzése és közzététele">
      <div>
        <p className="text-sm font-bold text-[#07577d]">{link ? 'Közzétett kvíz' : 'Ellenőrzésre váró tervezet'}</p>
        <h3 className="mt-1 text-lg font-bold">{draft.title}</h3>
      </div>
      <fieldset disabled={busy !== null} className="min-w-0 space-y-2">
        <label className="block text-sm font-semibold">Kvíz címe
          <input className={field} value={draft.title} onChange={e => edit({ ...draft, title: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold">Leírás
          <input className={field} value={draft.subtitle} onChange={e => edit({ ...draft, subtitle: e.target.value })} />
        </label>
        <div className="grid grid-cols-[1fr_6rem] gap-2">
          <label className="block text-sm font-semibold">Témakör
            <input className={field} value={draft.topic} onChange={e => edit({ ...draft, topic: e.target.value })} />
          </label>
          <label className="block text-sm font-semibold">Hét
            <input className={field} type="number" min={1} max={53} value={draft.weekNumber} onChange={e => edit({ ...draft, weekNumber: Number(e.target.value) })} />
          </label>
        </div>
        {draft.questions.map((q, index) => {
          const result = results?.find(r => r.number === index + 1);
          return (
            <details key={q.id} className="rounded-xl border border-[#cce1eb] bg-[#f4f9fc] p-3">
              <summary className="cursor-pointer break-words font-semibold">
                {index + 1}. {q.question || 'Hiányzó kérdés'}
                {result && !result.matches && <span className="ml-2 text-rose-800">Ellenőrizendő</span>}
              </summary>
              <div className="mt-3 space-y-2">
                <label className="block text-sm">Angol mondat <input className={field} value={q.question} onChange={e => editQuestion(index, { question: e.target.value })} /></label>
                {q.options.map((option, j) => (
                  <label key={j} className="block text-sm">{j + 1}. válasz
                    <input className={field} value={option} onChange={e => editQuestion(index, { options: q.options.map((value, k) => k === j ? e.target.value : value) })} />
                  </label>
                ))}
                <div className="flex flex-wrap gap-2">
                  {q.options.length < 4 && <button type="button" className="quiz-dialog-tab" onClick={() => editQuestion(index, { options: [...q.options, ''] })}>Válasz hozzáadása</button>}
                  {q.options.length === 4 && <button type="button" className="quiz-dialog-tab" onClick={() => editQuestion(index, { options: q.options.slice(0, 3), correctIndex: q.correctIndex === 3 ? -1 : q.correctIndex })}>Utolsó válasz eltávolítása</button>}
                </div>
                <label className="block text-sm">Helyes válasz
                  <select className={field} value={q.correctIndex} onChange={e => editQuestion(index, { correctIndex: Number(e.target.value) })}>
                    <option value={-1}>Válassz megoldást</option>
                    {q.options.map((option, j) => <option key={j} value={j}>{j + 1}. {option}</option>)}
                  </select>
                </label>
                <label className="block text-sm">Magyar magyarázat<textarea className={field} value={q.explanation} onChange={e => editQuestion(index, { explanation: e.target.value })} /></label>
                <label className="block text-sm">Magyar fordítás<textarea className={field} value={q.translation} onChange={e => editQuestion(index, { translation: e.target.value })} /></label>
                <label className="block text-sm">Tipp <textarea className={field} value={q.tip ?? ''} onChange={e => editQuestion(index, { tip: e.target.value })} /></label>
                {result && <p className="text-sm">
                  AI által elfogadott válaszok: {result.answers.join(', ') || 'egyik sem'}. {result.note}
                </p>}
              </div>
            </details>
          );
        })}
      </fieldset>
      {issues.length > 0 && <ul className="list-disc space-y-1 pl-5 text-sm text-rose-800">{issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
      {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
      {results && <p role="status" className="text-sm">AI-ellenőrzés kész. Nyisd meg az érintett kérdéseket, és nézd át a javaslatokat.</p>}
      <label className="flex items-start gap-2 text-sm font-semibold">
        <input type="checkbox" className="mt-1" checked={approved} disabled={issues.length > 0 || busy !== null} onChange={e => setApproved(e.target.checked)} />
        Átnéztem a kérdéseket, a helyes válaszokat és a magyar magyarázatokat.
      </label>
      <div className="flex flex-wrap gap-2">
        <button className="quiz-dialog-tab disabled:opacity-50" disabled={issues.length > 0 || busy !== null} onClick={() => submit('review')}>
          {busy === 'review' ? 'Ellenőrzés…' : 'AI-ellenőrzés indítása'}
        </button>
        <button className="quiz-dialog-tab disabled:opacity-50" disabled={!approved || busy !== null} onClick={() => onSaveLocal(draft)}>Helyi mentés és kitűzés</button>
        <button className="quiz-primary rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50" disabled={!approved || busy !== null || Boolean(link)} onClick={() => submit('publish')}>
          {busy === 'publish' ? 'Közzététel…' : 'Jóváhagyás és közzététel'}
        </button>
      </div>
      {link && <div role="status" className="space-y-1 text-sm">
        <label className="block font-semibold">Megosztható kvízlink<input readOnly className={field} value={link} onFocus={e => e.target.select()} /></label>
        <a href={link} className="font-bold text-[#07577d] underline" target="_blank" rel="noreferrer">Közzétett kvíz megnyitása</a>
      </div>}
    </section>
  );
}
