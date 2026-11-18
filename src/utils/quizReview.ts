import type { QuizPackage, QuizQuestion } from '../types';

export const publishedQuizId = /^published-[a-f0-9]{32}$/;

const normalize = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const isText = (value: unknown, limit: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= limit;

export function isReviewableQuestion(value: unknown): value is QuizQuestion {
  if (!value || typeof value !== 'object') return false;
  const q = value as Partial<QuizQuestion>;
  return isText(q.question, 500) && Array.isArray(q.options) && q.options.length >= 3 &&
    q.options.length <= 4 && q.options.every(option => isText(option, 200)) &&
    typeof q.correctIndex === 'number' && Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length &&
    isText(q.explanation, 1500) && isText(q.translation, 750) &&
    (q.tip === undefined || q.tip === '' || isText(q.tip, 750));
}

export function reviewQuiz(value: unknown): string[] {
  if (!value || typeof value !== 'object') return ['Érvénytelen kvíz.'];
  const quiz = value as Partial<QuizPackage>;
  const errors: string[] = [];
  if (!isText(quiz.title, 250) || !isText(quiz.subtitle, 500) || !isText(quiz.topic, 300) ||
      !['A1', 'A2', 'B1', 'B2'].includes(quiz.level ?? '') ||
      typeof quiz.weekNumber !== 'number' || !Number.isInteger(quiz.weekNumber) || quiz.weekNumber < 1 || quiz.weekNumber > 53 ||
      typeof quiz.year !== 'number' || !Number.isInteger(quiz.year) || quiz.year < 2000 || quiz.year > 2100) {
    errors.push('Ellenőrizd a címet, a leírást, a témát, a szintet és a hetet.');
  }
  if (!Array.isArray(quiz.questions) || quiz.questions.length !== 10) {
    return [...errors, 'A heti kvíznek pontosan tíz kérdést kell tartalmaznia.'];
  }
  const seen = new Set<string>();
  quiz.questions.forEach((question, i) => {
    const label = `${i + 1}. kérdés`;
    if (!isReviewableQuestion(question)) {
      errors.push(`${label}: ellenőrizd a mondatot, a 3–4 választ, a megoldókulcsot, a magyarázatot és a fordítást.`);
      return;
    }
    if ((question.question.match(/_{2,}/g) ?? []).length !== 1) {
      errors.push(`${label}: pontosan egy hiányzó részt jelölj legalább két aláhúzással.`);
    }
    if (new Set(question.options.map(normalize)).size !== question.options.length) {
      errors.push(`${label}: ismétlődő válaszlehetőség.`);
    }
    const text = normalize(question.question);
    if (seen.has(text)) errors.push(`${label}: ismétlődő mondat.`);
    seen.add(text);
  });
  return errors;
}
