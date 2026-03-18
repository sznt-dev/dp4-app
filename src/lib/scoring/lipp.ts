import type { ScoreResult } from '@/types';

/**
 * Questionário de Estresse Lipp
 * 12 perguntas binárias (0=NÃO, 1=SIM)
 * Score: soma de todas as respostas (0-12)
 */
export function calculateLipp(answers: Record<string, number>): ScoreResult {
  const values = Object.values(answers).filter((v) => typeof v === 'number');
  const score = values.reduce((sum, v) => sum + v, 0);
  const maxScore = 12;

  if (score === 0) {
    return { score, maxScore, classification: 'Sem estresse', severity: 'normal', color: '#10B981' };
  }
  if (score <= 3) {
    return { score, maxScore, classification: 'Estresse baixo', severity: 'low', color: '#84CC16' };
  }
  if (score <= 7) {
    return { score, maxScore, classification: 'Estresse alto', severity: 'high', color: '#F59E0B' };
  }
  return { score, maxScore, classification: 'Estresse severo', severity: 'severe', color: '#EF4444' };
}
