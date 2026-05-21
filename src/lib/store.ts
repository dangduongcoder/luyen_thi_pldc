import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Question } from './api';

export type ExamResult = {
  id: string; // unique string id
  date: string; // ISO date string
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeSpent: number; // in seconds
  wrongQuestionIds: number[];
  type: 'full' | 'quick' | 'retry';
  questions?: Question[];
  answers?: Record<number, string>;
};

export type CurrentExamState = {
  questions: Question[];
  answers: Record<number, string>; // questionId -> selected option
  timeRemaining: number;
  totalTime: number;
  isFinished: boolean;
  type: 'full' | 'quick' | 'retry';
};

// Helper to interact with LocalStorage safely
function createPersistentStore<T>(key: string, initialValue: T) {
  let initial = initialValue;
  if (browser) {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        initial = JSON.parse(stored);
      } catch (e) {
        console.error(`Error parsing ${key} from localStorage`, e);
      }
    }
  }

  const store = writable<T>(initial);

  if (browser) {
    store.subscribe(value => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }

  return store;
}

// Stores
export const examHistory = createPersistentStore<ExamResult[]>('pldc_exam_history', []);
export const currentExam = writable<CurrentExamState | null>(null);

// Actions
export function saveExamResult(result: ExamResult) {
  examHistory.update(history => {
    return [result, ...history];
  });
}

export function getAllWrongQuestionIds(): number[] {
  const history = get(examHistory);
  const wrongIds = new Set<number>();
  history.forEach(exam => {
    exam.wrongQuestionIds.forEach(id => wrongIds.add(id));
  });
  return Array.from(wrongIds);
}
