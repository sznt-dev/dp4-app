import type { Question } from '@/types';

/**
 * Seção 2: SCARED — Questionário de Ansiedade (41 perguntas)
 * Escala: "Não verdadeira" (0) / "Às vezes verdadeira" (1) / "Verdadeira" (2)
 * Score total ≥ 25 → pode indicar Transtorno de Ansiedade
 */

const scaredQuestions: string[] = [
  'Quando fico com medo, sinto dificuldade para respirar',
  'Tenho dor de cabeça quando estou na escola',
  'Não gosto de estar com pessoas que não conheço bem',
  'Fico com medo quando durmo fora de casa',
  'Me preocupo se as pessoas vão gostar de mim',
  'Quando fico com medo, sinto que vou desmaiar',
  'Sou nervoso(a)',
  'Sigo minha mãe ou meu pai para todo lugar',
  'As pessoas me dizem que pareço nervoso(a)',
  'Fico nervoso(a) com pessoas que não conheço bem',
  'Tenho dor de barriga na escola',
  'Quando fico com medo, sinto que vou ficar louco(a)',
  'Me preocupo em dormir sozinho(a)',
  'Me preocupo em ser tão bom(a) quanto as outras crianças',
  'Quando fico com medo, sinto como se coisas não fossem reais',
  'Tenho pesadelos sobre algo ruim acontecendo com meus pais',
  'Me preocupo em ir para a escola',
  'Quando fico com medo, meu coração bate rápido',
  'Fico tremendo',
  'Tenho pesadelos de que algo ruim vai acontecer comigo',
  'Me preocupo se as coisas vão dar certo para mim',
  'Quando fico com medo, suo muito',
  'Sou uma pessoa preocupada',
  'Fico realmente com medo sem razão',
  'Tenho medo de ficar sozinho(a) em casa',
  'É difícil para mim conversar com pessoas que não conheço bem',
  'Quando fico com medo, sinto como se estivesse sufocando',
  'As pessoas me dizem que me preocupo demais',
  'Não gosto de ficar longe da minha família',
  'Tenho medo de ter ataques de ansiedade (ou pânico)',
  'Me preocupo que algo ruim vá acontecer com meus pais',
  'Fico tímido(a) com pessoas que não conheço bem',
  'Me preocupo com o que vai acontecer no futuro',
  'Quando fico com medo, sinto vontade de vomitar',
  'Me preocupo sobre como faço as coisas',
  'Tenho medo de ir para a escola',
  'Me preocupo com coisas que já aconteceram',
  'Quando fico com medo, fico tonto(a)',
  'Fico nervoso(a) quando estou com outras crianças ou adultos e tenho que fazer algo enquanto eles me observam',
  'Fico nervoso(a) quando vou a festas, danças ou qualquer lugar onde haverá pessoas que não conheço bem',
  'Sou tímido(a)',
];

export const kidsSection2Questions: Question[] = scaredQuestions.map((label, i) => ({
  id: `kids_scared_${i + 1}`,
  section: 3 as const,
  subsection: 'SCARED — Ansiedade',
  type: 'scale_0_2' as const,
  label,
  required: true,
  options: [
    { value: 0, label: 'Não verdadeira', color: '#10B981' },
    { value: 1, label: 'Às vezes', color: '#F59E0B' },
    { value: 2, label: 'Verdadeira', color: '#EF4444' },
  ],
  dbField: `scared.q${i + 1}`,
}));
