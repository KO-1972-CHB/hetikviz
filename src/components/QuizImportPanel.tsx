import { useState } from 'react';
import type { CefrLevel, QuizPackage, QuizQuestion } from '../types';

interface Props {
  level: CefrLevel;
  topic: string;
  weekNumber: number;
  disabled: boolean;
  onImport: (quiz: QuizPackage) => void;
}

export function QuizImportPanel({ level, topic, weekNumber, disabled, onImport }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const prompt = `Készíts pontosan 10 angol mondatkiegészítő kérdést magyar tanulóknak.
Szint: ${level}. Téma: ${topic.trim() || 'Angol nyelvtan'}.
Minden mondatban egyetlen hiányzó rész legyen: ___. Adj 3 vagy 4 különböző válaszlehetőséget, amelyek közül pontosan egy helyes. Az index 0-tól indul. Add meg a szabály rövid magyar magyarázatát, a kitöltött mondat magyar fordítását és opcionálisan egy tippet.
Adj rövid, témaközpontú címet (legfeljebb 55 karakter) és tárgyilagos leírást (legfeljebb 85 karakter). A válasz kizárólag JSON-objektum legyen az alábbi mezőkkel. A minta egyetlen kérdést mutat, a tényleges válaszban pontosan tíz különböző kérdés legyen:
{"title":"A kvíz címe","description":"Rövid leírás","level":"${level}","questions":[{"question":"She ___ every morning.","options":["runs","run","running"],"correctIndex":0,"explanation":"Egyes szám harmadik személyben az igéhez -s végződés kerül.","translation":"Minden reggel fut.","tip":"Figyeld az alanyt."}]}`;

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyStatus('A minta másolva.');
    } catch {
      setCopyStatus('A böngésző nem engedte a másolást. Jelöld ki a mintát a mezőben.');
    }
  }

  function importQuiz() {
    setError('');
    try {
      const raw = input.trim().replace(/^\x60{3}(?:json)?\s*([\s\S]*?)\s*\x60{3}$/i, '$1');
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error('Illeszd be a teljes JSON-választ a nyitó és záró kapcsos zárójellel együtt.');
      }
      if (!Array.isArray(data?.questions) || data.questions.length !== 10) {
        throw new Error('A JSON „questions” mezőjében pontosan tíz kérdésnek kell lennie.');
      }
      const id = `custom-import-${crypto.randomUUID()}`;
      const questions = data.questions.map((q: Partial<QuizQuestion> | null, index: number): QuizQuestion => {
        if (typeof q?.question !== 'string' || !Array.isArray(q.options) ||
            q.options.length > 4 || !q.options.every(option => typeof option === 'string') ||
            typeof q.explanation !== 'string' || typeof q.translation !== 'string' ||
            (q.tip !== undefined && typeof q.tip !== 'string')) {
          throw new Error(`${index + 1}. kérdés: a mondat, a legfeljebb négy szöveges válasz, a magyarázat és a fordítás mezője szükséges.`);
        }
        return {
          id: `${id}-${index + 1}`,
          question: q.question,
          options: q.options,
          correctIndex: typeof q.correctIndex === 'number' && Number.isInteger(q.correctIndex) &&
            q.correctIndex >= 0 && q.correctIndex < q.options.length ? q.correctIndex : -1,
          explanation: q.explanation,
          translation: q.translation,
          tip: q.tip,
        };
      });
      const chosenTopic = topic.trim() || 'Angol nyelvtan';
      onImport({
        id,
        title: typeof data.title === 'string' ? data.title : `${chosenTopic} (${level})`,
        subtitle: typeof data.description === 'string' ? data.description
          : typeof data.subtitle === 'string' ? data.subtitle : 'Importált heti kvíz',
        level, topic: chosenTopic, weekNumber, year: new Date().getFullYear(), questions, isCustom: true,
      });
      setInput('');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'A kvíz importálása sikertelen.');
    }
  }

  return (
    <details className="quiz-surface rounded-2xl p-4">
      <summary className="cursor-pointer font-bold text-[#07577d]">Kvíz importálása JSON-ból</summary>
      <div className="mt-3 space-y-3 text-sm">
        <p>Készíts kvízt a Google AI Studióban, majd illeszd be a JSON-választ. Az importált kvíz szerkeszthető tervezetként nyílik meg.</p>
        <p className="text-[#426075]">A szintet, témát és hetet a fenti mezőkből vesszük át. Jelenleg {level} · {topic.trim() || 'Angol nyelvtan'} · {weekNumber}. hét.</p>
        <details>
          <summary className="cursor-pointer font-semibold">Minta az AI Studióhoz</summary>
          <textarea aria-label="Minta az AI Studióhoz" readOnly className="quiz-dialog-input mt-2 w-full p-3" rows={5} value={prompt} onFocus={e => e.target.select()} />
          <button className="quiz-dialog-tab" onClick={copyPrompt}>Minta másolása</button>
          {copyStatus && <p role="status">{copyStatus}</p>}
        </details>
        <label className="block font-semibold">Kvíz JSON-válasza
          <textarea className="quiz-dialog-input mt-1 block w-full p-3 font-mono text-xs" rows={6} maxLength={100_000}
            spellCheck={false} placeholder={'{"title":"…","questions":[…]}'}
            value={input} onChange={e => { setInput(e.target.value); setError(''); }} />
        </label>
        {error && <p role="alert" className="text-rose-800">{error}</p>}
        <button className="quiz-primary min-h-11 items-center rounded-xl px-4 font-bold disabled:opacity-50"
          disabled={disabled || !input.trim()} onClick={importQuiz}>Importálás tervezetként</button>
      </div>
    </details>
  );
}
