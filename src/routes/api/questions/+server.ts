// src/routes/api/questions/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import allQuestions from '$lib/../data/questions.json';

/**
 * GET handler for /api/questions
 * Query parameters:
 *   - count: number of random questions to return (default: all)
 *   - ids: comma‑separated list of question IDs to fetch specific ones
 */
export const GET: RequestHandler = async ({ url }) => {
  const countParam = url.searchParams.get('count');
  const idsParam = url.searchParams.get('ids');

  // If specific IDs are requested, return those questions preserving order
  if (idsParam) {
    const ids = idsParam.split(',').map((s) => Number(s.trim())).filter(Boolean);
    const selected = ids.map((id) => allQuestions.find((q: any) => q.id === id)).filter(Boolean);
    return json(selected);
  }

  // If a count is provided, return that many random questions
  if (countParam) {
    const count = Math.max(0, Number(countParam));
    if (count <= 0) return json([]);
    // Shuffle using Fisher‑Yates
    const shuffled = [...allQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return json(shuffled.slice(0, count));
  }

  // Default: return all questions
  return json(allQuestions);
};
