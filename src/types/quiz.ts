/**
 * Quiz Types
 * Defines interfaces and types for quiz-related data structures
 */

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'concept_check' | 'mechanism_check' | 'application_check' | 'misconception_trap' | 'why_question';

export interface Question {
  id: number;
  type?: QuestionType;
  difficulty?: QuestionDifficulty;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuestionTiming {
  questionIndex: number;
  startTime: number;
  endTime?: number;
  timeTakenSeconds: number;
}

export interface QuizCompletionResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  totalTime: number;
  coinsEarned: number;
  rewardBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface QuestionReward {
  questionIndex: number;
  difficulty: QuestionDifficulty;
  isCorrect: boolean;
  coinsEarned: number;
}
