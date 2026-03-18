import type { Question } from '@/types';

/**
 * Seção 3: Ritmo Sono-Vigília Pediátrico (26 perguntas)
 * Escala de frequência (0-4)
 * + 2 perguntas iniciais com opções específicas
 */

export const kidsSection3Questions: Question[] = [
  // Perguntas iniciais com opções específicas
  {
    id: 'kids_ritmo_horas_sono',
    section: 4 as const,
    subsection: 'Ritmo Sono-Vigília',
    type: 'select' as const,
    label: 'Quantas horas por noite a criança geralmente dorme?',
    required: true,
    options: [
      { value: '5-6', label: '5 a 6 horas' },
      { value: '7-8', label: '7 a 8 horas' },
      { value: '9-10', label: '9 a 10 horas' },
      { value: '11+', label: '11 horas ou mais' },
    ],
    dbField: 'ritmo_sono.horas_sono',
  },
  {
    id: 'kids_ritmo_tempo_adormecer',
    section: 4 as const,
    subsection: 'Ritmo Sono-Vigília',
    type: 'select' as const,
    label: 'Quanto tempo a criança leva para adormecer?',
    required: true,
    options: [
      { value: 'menos15', label: 'Menos de 15 minutos' },
      { value: '15-30', label: '15 a 30 minutos' },
      { value: '30-60', label: '30 a 60 minutos' },
      { value: 'mais60', label: 'Mais de 60 minutos' },
    ],
    dbField: 'ritmo_sono.tempo_adormecer',
  },
];

// Perguntas de frequência (escala 0-4)
const ritmoQuestions: string[] = [
  'A criança vai dormir na hora certa',
  'A criança tem dificuldade para adormecer',
  'A criança fica inquieta e se mexe muito durante o sono',
  'A criança acorda durante a noite',
  'Quando acorda à noite, tem dificuldade para voltar a dormir',
  'A criança tem pesadelos',
  'A criança grita durante o sono',
  'A criança fala durante o sono',
  'A criança range os dentes durante o sono',
  'A criança ronca durante o sono',
  'A criança sua excessivamente durante o sono',
  'A criança anda durante o sono (sonambulismo)',
  'A criança vai para a cama dos pais durante a noite',
  'A criança resiste a ir para a cama',
  'A criança tem medo de dormir no escuro',
  'A criança tem medo de dormir sozinha',
  'A criança acorda com dificuldade de manhã',
  'A criança acorda de mau humor',
  'A criança é acordada pelos adultos',
  'A criança tem dificuldade de levantar da cama',
  'A criança tem sono excessivo durante o dia',
  'A criança cochila durante o dia',
  'A criança fica sonolenta assistindo TV',
  'A criança fica sonolenta viajando de carro',
];

const frequencyOptions = [
  { value: 0, label: 'Nunca', color: '#10B981' },
  { value: 1, label: 'Ocasionalmente', color: '#6EE7B7' },
  { value: 2, label: 'Algumas vezes', color: '#F59E0B' },
  { value: 3, label: 'Quase sempre', color: '#F97316' },
  { value: 4, label: 'Sempre', color: '#EF4444' },
];

const ritmoFrequencyQuestions: Question[] = ritmoQuestions.map((label, i) => ({
  id: `kids_ritmo_${i + 1}`,
  section: 4 as const,
  subsection: 'Ritmo Sono-Vigília',
  type: 'frequency_scale' as const,
  label,
  required: true,
  options: frequencyOptions,
  dbField: `ritmo_sono.q${i + 1}`,
}));

// Combine initial questions + frequency questions
kidsSection3Questions.push(...ritmoFrequencyQuestions);
