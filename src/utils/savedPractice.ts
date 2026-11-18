import type { CefrLevel, QuizPackage, QuizQuestion } from '../types';
import { isReviewableQuestion } from './quizReview';

const storageKey = 'gyakorlatias_saved_practice_v1';

export interface SavedQuestion {
  key: string;
  level: CefrLevel;
  topic: string;
  question: QuizQuestion;
}

export function savedQuestion(quiz: QuizPackage, question: QuizQuestion): SavedQuestion {
  const topic = quiz.topic || quiz.title;
  const key = JSON.stringify([
    quiz.level, topic, question.question.trim(), question.options[question.correctIndex],
    [...question.options].sort(),
  ]);
  return { key, level: quiz.level, topic, question };
}

export function readSavedQuestions(): SavedQuestion[] {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter(item => typeof item?.key === 'string' && typeof item.topic === 'string' &&
      ['A1', 'A2', 'B1', 'B2'].includes(item.level) && typeof item.question?.id === 'string' &&
      isReviewableQuestion(item.question));
  } catch {
    return [];
  }
}

export function setQuestionSaved(item: SavedQuestion, shouldSave: boolean) {
  const questions = readSavedQuestions().filter(question => question.key !== item.key);
  if (shouldSave) questions.unshift(item);
  localStorage.setItem(storageKey, JSON.stringify(questions));
  return questions;
}
