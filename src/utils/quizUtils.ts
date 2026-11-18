import { CefrLevel, QuizPackage, UserQuizAttempt } from '../types';
import { INITIAL_QUIZZES } from '../data/quizzes';

const STORAGE_KEY_CUSTOM_QUIZZES = 'gyakorlatias_custom_quizzes';
const STORAGE_KEY_ATTEMPTS = 'gyakorlatias_user_attempts';
const STORAGE_KEY_PINNED_QUIZZES = 'gyakorlatias_pinned_weekly_quizzes';

// Current ISO week calculator (1 - 52)
export function getCurrentWeekNumber(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNo || 45; // default fallback
}

// Pinned weekly quiz management (Teacher control per CEFR level)
export function getPinnedWeeklyQuizzes(): Record<CefrLevel, string | null> {
  if (typeof window === 'undefined') {
    return { A1: null, A2: null, B1: null, B2: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PINNED_QUIZZES);
    return raw ? JSON.parse(raw) : { A1: null, A2: null, B1: null, B2: null };
  } catch {
    return { A1: null, A2: null, B1: null, B2: null };
  }
}

export function setPinnedWeeklyQuiz(level: CefrLevel, quizId: string): void {
  if (typeof window === 'undefined') return;
  const current = getPinnedWeeklyQuizzes();
  // Toggle off if already pinned, or set as new pinned
  if (current[level] === quizId) {
    current[level] = null;
  } else {
    current[level] = quizId;
  }
  localStorage.setItem(STORAGE_KEY_PINNED_QUIZZES, JSON.stringify(current));
}

// Find the active weekly quiz for a given level (Pinned override -> ISO Week Match -> First available)
export function getActiveWeeklyQuizForLevel(level: CefrLevel, allQuizzesList?: QuizPackage[]): QuizPackage | undefined {
  const quizzes = allQuizzesList || getAllQuizzes();
  const pinned = getPinnedWeeklyQuizzes();
  const pinnedId = pinned[level];
  if (pinnedId) {
    const foundPinned = quizzes.find((q) => q.id === pinnedId && q.level === level);
    if (foundPinned) return foundPinned;
  }
  const currentWeek = getCurrentWeekNumber();
  const foundByWeek = quizzes.find((q) => q.level === level && q.weekNumber === currentWeek);
  if (foundByWeek) return foundByWeek;
  return quizzes.find((q) => q.level === level);
}

// Speak English text with native accent using ResponsiveVoice (primary) or Web Speech API (fallback)
export function playEnglishPronunciation(text: string, voiceName: 'UK English Female' | 'US English Female' = 'UK English Female'): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Clean sentence (e.g., replace blank underscores with a natural pause or filler)
  const cleanText = text
    .replace(/_+/g, '...')
    .replace(/\[\.\.\.\]/g, '')
    .trim();

  // 1. Prioritize ResponsiveVoice (Key: zfxll7vG)
  const rv = (window as any).responsiveVoice;
  if (rv && typeof rv.speak === 'function') {
    try {
      if (typeof rv.cancel === 'function') {
        rv.cancel();
      }
      rv.speak(cleanText, voiceName, {
        pitch: 1,
        rate: 0.95,
        volume: 1,
      });
      return true;
    } catch (e) {
      console.warn('ResponsiveVoice playback warning, falling back to browser speech synthesis', e);
    }
  }

  // 2. Fallback to native Web Speech API if script is loading or offline
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText.replace(/\.\.\./g, 'something'));
      utterance.lang = voiceName.includes('US') ? 'en-US' : 'en-GB';
      utterance.rate = 0.9;

      const voices = window.speechSynthesis.getVoices();
      const englishVoice =
        voices.find((v) => (v.lang.startsWith('en-') || v.lang === 'en_US' || v.lang === 'en_GB') && v.localService) ||
        voices.find((v) => v.lang.startsWith('en'));

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e) {
      console.error('Speech synthesis error', e);
    }
  }

  return false;
}

// Custom Quizzes Storage
export function getStoredCustomQuizzes(): QuizPackage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_QUIZZES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading custom quizzes from storage', e);
    return [];
  }
}

export function saveCustomQuiz(quiz: QuizPackage): void {
  if (typeof window === 'undefined') return;
  const current = getStoredCustomQuizzes();
  const filtered = current.filter((q) => q.id !== quiz.id);
  const updated = [quiz, ...filtered];
  localStorage.setItem(STORAGE_KEY_CUSTOM_QUIZZES, JSON.stringify(updated));
}

export function deleteCustomQuiz(quizId: string): void {
  if (typeof window === 'undefined') return;
  const current = getStoredCustomQuizzes();
  const updated = current.filter((q) => q.id !== quizId);
  localStorage.setItem(STORAGE_KEY_CUSTOM_QUIZZES, JSON.stringify(updated));
}

// Helper to shuffle options and keep correctIndex synchronized
export function shuffleOptionsWithCorrectIndex(options: string[], correctIndex: number): {
  shuffledOptions: string[];
  newCorrectIndex: number;
} {
  const correctText = options[correctIndex];
  const items = [...options];

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  const newIndex = items.indexOf(correctText);
  return {
    shuffledOptions: items,
    newCorrectIndex: newIndex >= 0 ? newIndex : 0,
  };
}

// Ensure questions have randomized option orders so correct answers aren't always 'a'
export function shuffleQuizOptions(quiz: QuizPackage): QuizPackage {
  return {
    ...quiz,
    questions: quiz.questions.map((q) => {
      const { shuffledOptions, newCorrectIndex } = shuffleOptionsWithCorrectIndex(
        q.options,
        q.correctIndex
      );
      return {
        ...q,
        options: shuffledOptions,
        correctIndex: newCorrectIndex,
      };
    }),
  };
}

const STORAGE_KEY_HIDDEN_QUIZZES = 'gyakorlatias_hidden_quizzes';

export function getHiddenQuizIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HIDDEN_QUIZZES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function hideQuiz(quizId: string): void {
  if (typeof window === 'undefined') return;
  const list = getHiddenQuizIds();
  if (!list.includes(quizId)) {
    list.push(quizId);
    localStorage.setItem(STORAGE_KEY_HIDDEN_QUIZZES, JSON.stringify(list));
  }
}

export function unhideQuiz(quizId: string): void {
  if (typeof window === 'undefined') return;
  const list = getHiddenQuizIds().filter((id) => id !== quizId);
  localStorage.setItem(STORAGE_KEY_HIDDEN_QUIZZES, JSON.stringify(list));
}

// All available quizzes (initial + custom) with options properly shuffled and hidden filters applied
export function getAllQuizzes(includeHidden = false): QuizPackage[] {
  const custom = getStoredCustomQuizzes();
  const all = [...custom, ...INITIAL_QUIZZES];
  const hiddenIds = getHiddenQuizIds();
  const visible = includeHidden ? all : all.filter((q) => !hiddenIds.includes(q.id));
  return visible.map((q) => shuffleQuizOptions(q));
}

// User Attempts Storage
export function getStoredAttempts(): UserQuizAttempt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveAttempt(attempt: UserQuizAttempt): void {
  if (typeof window === 'undefined') return;
  const list = getStoredAttempts();
  list.unshift(attempt);
  localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(list.slice(0, 50)));
}

// Generate Facebook community share text
export function generateShareText(quiz: QuizPackage, score: number, total: number): string {
  const percent = Math.round((score / total) * 100);
  const stars = score === total ? '⭐⭐⭐⭐⭐' : score >= Math.ceil(total * 0.8) ? '⭐⭐⭐⭐' : score >= Math.ceil(total * 0.6) ? '⭐⭐⭐' : '⭐⭐';

  return `🎯 Megoldottam a heti Gyakorlatias Angol kvízt!
📌 Kvíz: ${quiz.title} (${quiz.level} szint)
📊 Eredményem: ${score}/${total} (${percent}%) ${stars}`;
}

// Diagnostic level test questions (3 questions to guide learners to the right level)
export interface LevelDiagnosticQuestion {
  id: number;
  question: string;
  options: { text: string; recommendedLevel: CefrLevel }[];
}

export const DIAGNOSTIC_QUESTIONS: LevelDiagnosticQuestion[] = [
  {
    id: 1,
    question: 'Hogyan mondanád angolul, hogy "Van egy autó a ház előtt"?',
    options: [
      { text: 'It has a car before the house.', recommendedLevel: 'A1' },
      { text: 'There is a car in front of the house.', recommendedLevel: 'A2' },
      { text: 'There has been a car parked upfront.', recommendedLevel: 'B1' },
    ],
  },
  {
    id: 2,
    question: 'Mit választanál: "I _______ to London three years ago."',
    options: [
      { text: 'have been', recommendedLevel: 'A1' },
      { text: 'went', recommendedLevel: 'B1' },
      { text: 'was going', recommendedLevel: 'A2' },
    ],
  },
  {
    id: 3,
    question: 'Mit jelent a "We have to call off the event"?',
    options: [
      { text: 'Fel kell hívnunk a szervezőket.', recommendedLevel: 'A2' },
      { text: 'Le kell mondanunk az eseményt.', recommendedLevel: 'B2' },
      { text: 'El kell kezdenünk a műsort.', recommendedLevel: 'A1' },
    ],
  },
];
