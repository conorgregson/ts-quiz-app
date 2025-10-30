import { QuestionKind } from "./enums.js";
import { AnyQuestion } from "./types.js";

export const QUESTIONS: AnyQuestion[] = [
  {
    id: "question1",
    kind: QuestionKind.Text,
    prompt: "Which of theses defines a union type?",
    data: {
      options: ["string:number", "string|number", "string&number"],
      correctIndex: 1,
    },
    seconds: 20,
    explanation: "Unions use the pipe character: e.g., string | number.",
  },
  {
    id: "question2",
    kind: QuestionKind.Boolean,
    prompt: "Enums in TypeScript can be numeric or string.",
    data: { correct: true },
    seconds: 15,
    explanation: "TS supports both numeric and string enums.",
  },
  {
    id: "question3",
    kind: QuestionKind.Text,
    prompt: "Optional property syntax is…",
    data: {
      options: ["name?: string", "?name: string", "name: string?"],
      correctIndex: 0,
    },
    seconds: 20,
    explanation: "Use the question mark after the key: name?: string.",
  },
];
