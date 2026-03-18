import type { Question } from '@/types';

/**
 * Seção 1: Questionário do Sono (22 perguntas)
 * Todas SIM/NÃO, respondidas pelos pais sobre a criança.
 * Score: % de SIM → ≥33% = risco de AOS
 */

const sonoQuestions: string[] = [
  'Ronca mais da metade do tempo de sono?',
  'Sempre ronca?',
  'Ronca alto?',
  'Tem dificuldade para respirar ou luta para respirar?',
  'Tem respiração alta ou "pesada"?',
  'Você já viu seu filho(a) parar de respirar durante a noite?',
  'Tende a respirar pela boca durante o dia?',
  'Tem a boca seca ao acordar de manhã?',
  'Ocasionalmente faz xixi na cama?',
  'Acorda sentindo-se cansado(a) pela manhã?',
  'Tem problema de sonolência durante o dia?',
  'Algum professor comentou que seu filho(a) fica sonolento durante o dia?',
  'É difícil acordá-lo(a) de manhã?',
  'Ele(a) acorda com dor de cabeça de manhã?',
  'Parou de crescer numa velocidade normal em alguma idade desde o nascimento?',
  'Está com sobrepeso?',
  'Parece não ouvir quando falamos com ele(a)?',
  'Tem dificuldade organizando tarefas e atividades?',
  'É facilmente distraído(a) por estímulos externos?',
  'Tem os pés e as mãos inquietos ou se contorce ao sentar?',
  'Age como se estivesse "ligado(a) na tomada"?',
  'Se intromete ou interrompe os outros?',
];

export const kidsSection1Questions: Question[] = sonoQuestions.map((label, i) => ({
  id: `kids_sono_${i + 1}`,
  section: 2 as const,
  subsection: 'Questionário do Sono',
  type: 'yes_no' as const,
  label,
  required: true,
  dbField: `sono_pediatrico.q${i + 1}`,
}));
