import type { ScoreResult } from '@/types';

/**
 * Teste Epworth (Sonolência Diurna)
 * 8 situações, escala 0-3 (NUNCA=0, ÀS VEZES=1, FREQUENTEMENTE=2, SEMPRE=3)
 * Score: soma de todas as respostas (0-24)
 */
export function calculateEpworth(answers: Record<string, number>): ScoreResult {
  const values = Object.values(answers).filter((v) => typeof v === 'number');
  const score = values.reduce((sum, v) => sum + v, 0);
  const maxScore = 24;

  if (score <= 6) {
    return { score, maxScore, classification: 'Sono normal', severity: 'normal', color: '#10B981' };
  }
  if (score <= 8) {
    return { score, maxScore, classification: 'Média sonolência', severity: 'moderate', color: '#F59E0B' };
  }
  return { score, maxScore, classification: 'Sonolência anormal', severity: 'severe', color: '#EF4444' };
}
