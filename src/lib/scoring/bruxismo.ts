import type { ScoreResult } from '@/types';

/**
 * Grau de Bruxismo - Simplificado
 * 10 perguntas escala 0-2 (NÃO=0, ÀS VEZES=1, SIM=2)
 * Score: soma de todas as respostas (0-20)
 */
export function calculateBruxismo(answers: Record<string, number>): ScoreResult {
  const values = Object.values(answers).filter((v) => typeof v === 'number');
  const score = values.reduce((sum, v) => sum + v, 0);
  const maxScore = 20;

  if (score <= 5) {
    return { score, maxScore, classification: 'Ausência de Bruxismo', severity: 'normal', color: '#10B981' };
  }
  if (score <= 10) {
    return { score, maxScore, classification: 'Bruxismo Leve', severity: 'low', color: '#84CC16' };
  }
  if (score <= 15) {
    return { score, maxScore, classification: 'Bruxismo Moderado', severity: 'moderate', color: '#F59E0B' };
  }
  return { score, maxScore, classification: 'Bruxismo Avançado', severity: 'severe', color: '#EF4444' };
}
