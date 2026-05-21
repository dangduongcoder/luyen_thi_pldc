// src/lib/api.ts
// Updated to use Vercel Serverless Function endpoints for fetching questions
export type Question = {
  id: number;
  question: string;
  options: Record<string, string>;
  correct_answer: string;
};

/** Helper to fetch JSON from the API */
async function fetchFromApi(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return await res.json();
}

export const api = {
  /** Get a random list of questions (server decides random selection) */
  async getQuestions(limit: number = 40): Promise<Question[]> {
    const url = `/api/questions?count=${limit}`;
    return await fetchFromApi(url);
  },

  /** Get specific questions by IDs (for retrying wrong questions) */
  async getQuestionsByIds(ids: number[]): Promise<Question[]> {
    const url = `/api/questions?ids=${ids.join(',')}`;
    return await fetchFromApi(url);
  },

  /** Get total number of questions available */
  async getTotalQuestionsCount(): Promise<number> {
    const all = await fetchFromApi('/api/questions');
    return all.length;
  }
};
