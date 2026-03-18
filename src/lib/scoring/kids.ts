import type { ScoreResult } from '@/types';

/**
 * AOS Risk Score (Questionário do Sono)
 * Count SIM (true) out of 22 questions.
 * < 33% → Risco menor | ≥ 33% → Risco de AOS
 */
export function calculateAOS(answers: Record<string, unknown>): ScoreResult {
  let simCount = 0;
  let total = 0;

  for (let i = 1; i <= 22; i++) {
    const val = answers[`kids_sono_${i}`];
    if (val !== undefined && val !== null) {
      total++;
      if (val === true) simCount++;
    }
  }

  if (total === 0) {
    return { score: 0, maxScore: 22, classification: 'Sem respostas', severity: 'normal', color: '#6B7280' };
  }

  const percentage = (simCount / total) * 100;

  return {
    score: simCount,
    maxScore: total,
    classification: percentage >= 33 ? 'Risco de AOS' : 'Risco menor',
    severity: percentage >= 33 ? 'high' : 'normal',
    color: percentage >= 33 ? '#EF4444' : '#10B981',
  };
}

/**
 * SCARED Score (Ansiedade)
 * Sum all 41 questions (0-2 each). Max = 82.
 * Score ≥ 25 → Pode indicar Transtorno de Ansiedade
 *
 * Subescalas (por grupo de perguntas):
 * - Pânico/Somáticos: q1,6,9,12,15,18,19,22,24,27,30,34,38 (threshold: 7)
 * - Ansiedade Generalizada: q5,7,14,21,23,28,33,35,37 (threshold: 9)
 * - Ansiedade de Separação: q4,8,13,16,20,25,29,31 (threshold: 5)
 * - Ansiedade Social: q3,10,26,32,39,40,41 (threshold: 8)
 * - Evitação Escolar: q2,11,17,36 (threshold: 3)
 */
export function calculateSCARED(answers: Record<string, unknown>): ScoreResult & {
  subscales: { name: string; score: number; threshold: number; alert: boolean }[];
} {
  let totalScore = 0;
  let answeredCount = 0;

  for (let i = 1; i <= 41; i++) {
    const val = answers[`kids_scared_${i}`];
    if (typeof val === 'number') {
      totalScore += val;
      answeredCount++;
    }
  }

  const subscaleConfig = [
    { name: 'Pânico/Somáticos', questions: [1,6,9,12,15,18,19,22,24,27,30,34,38], threshold: 7 },
    { name: 'Ansiedade Generalizada', questions: [5,7,14,21,23,28,33,35,37], threshold: 9 },
    { name: 'Ansiedade de Separação', questions: [4,8,13,16,20,25,29,31], threshold: 5 },
    { name: 'Ansiedade Social', questions: [3,10,26,32,39,40,41], threshold: 8 },
    { name: 'Evitação Escolar', questions: [2,11,17,36], threshold: 3 },
  ];

  const subscales = subscaleConfig.map((sub) => {
    let score = 0;
    for (const q of sub.questions) {
      const val = answers[`kids_scared_${q}`];
      if (typeof val === 'number') score += val;
    }
    return {
      name: sub.name,
      score,
      threshold: sub.threshold,
      alert: score >= sub.threshold,
    };
  });

  const hasAnxiety = totalScore >= 25;

  return {
    score: totalScore,
    maxScore: 82,
    classification: hasAnxiety ? 'Possível Transtorno de Ansiedade' : 'Normal',
    severity: hasAnxiety ? 'high' : 'normal',
    color: hasAnxiety ? '#EF4444' : '#10B981',
    subscales,
  };
}

/**
 * Ritmo Sono-Vigília Score
 * Sum all 24 frequency questions (0-4 each). Max = 96.
 * Higher = more sleep disturbances.
 */
export function calculateRitmoSono(answers: Record<string, unknown>): ScoreResult {
  let totalScore = 0;
  let answeredCount = 0;

  for (let i = 1; i <= 24; i++) {
    const val = answers[`kids_ritmo_${i}`];
    if (typeof val === 'number') {
      totalScore += val;
      answeredCount++;
    }
  }

  const maxScore = answeredCount * 4;
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  let classification: string;
  let severity: ScoreResult['severity'];
  let color: string;

  if (percentage < 25) {
    classification = 'Sono adequado';
    severity = 'normal';
    color = '#10B981';
  } else if (percentage < 50) {
    classification = 'Distúrbio leve';
    severity = 'low';
    color = '#F59E0B';
  } else if (percentage < 75) {
    classification = 'Distúrbio moderado';
    severity = 'moderate';
    color = '#F97316';
  } else {
    classification = 'Distúrbio severo';
    severity = 'severe';
    color = '#EF4444';
  }

  return {
    score: totalScore,
    maxScore: maxScore || 96,
    classification,
    severity,
    color,
  };
}
