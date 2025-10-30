import { QuestionKind } from "./enums.js";

export interface BaseQuestion {
  id: string;
  kind: QuestionKind;
  prompt: string;
  seconds?: number;
  explanation?: string;
}

export interface TextData {
  options: string[];
  correctIndex: number;
}

export interface BooleanData {
  correct: boolean;
}

export interface TextQuestion extends BaseQuestion {
  kind: QuestionKind.Text;
  data: TextData;
}

export interface BooleanQuestion extends BaseQuestion {
  kind: QuestionKind.Boolean;
  data: BooleanData;
}

export type AnyQuestion = TextQuestion | BooleanQuestion;

export type AnswerFor<K extends QuestionKind> = K extends QuestionKind.Text
  ? number
  : K extends QuestionKind.Boolean
  ? boolean
  : never;

export interface QuizConfig {
  perQuestionDefaultSeconds: number;
  shuffle?: boolean;
}

export interface Score {
  correct: number;
  total: number;
  streak: number;
  bestStreak: number;
}

export interface MissedQuestion {
  id: string;
  prompt: string;
  yourAnswer: string;
  correctAnswer: string;
  explanation?: string;
}
