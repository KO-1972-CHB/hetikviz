export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  translation: string;
  tip?: string;
}

export interface QuizPackage {
  id: string;
  title: string;
  subtitle: string;
  level: CefrLevel;
  weekNumber: number;
  year: number;
  topic: string;
  badgeText?: string;
  questions: QuizQuestion[];
  isCustom?: boolean;
}

export interface UserQuizAttempt {
  quizId: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
  selectedAnswers: number[]; // chosen option index for each question
}

export interface LevelInfo {
  level: CefrLevel;
  name: string;
  badgeColor: string;
  description: string;
  targetAudience: string;
  topics: string[];
}
