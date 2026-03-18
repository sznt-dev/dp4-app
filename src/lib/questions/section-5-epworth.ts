import type { Question } from '@/types';

/**
 * Seção 5: Teste Epworth (Sonolência Diurna)
 * 8 situações, escala 0-3 (NUNCA=0, ÀS VEZES=1, FREQUENTEMENTE=2, SEMPRE=3)
 * Score: 1-6=normal, 7-8=médio, 9-24=anormal
 */

const epworthOptions = [
  { value: 0, label: 'NUNCA', color: '#10B981' },
  { value: 1, label: 'ÀS VEZES', color: '#84CC16' },
  { value: 2, label: 'FREQUENTEMENTE', color: '#F59E0B' },
  { value: 3, label: 'SEMPRE', color: '#EF4444' },
];

export const section5Questions: Question[] = [
  {
    id: 'epworth_1',
    section: 5,
    type: 'scale_0_3',
    label: 'Sentado e lendo',
    description: 'Com qual frequência você costuma dormir nessa situação?',
    required: true,
    options: epworthOptions,
    dbField: 'teste_epworth.sentado_lendo',
  },
  {
    id: 'epworth_2',
    section: 5,
    type: 'scale_0_3',
    label: 'Sentado, inativo em lugar público (Ex: sala de espera)',
    description: 'Com qual frequência você costuma dormir nessa situação?',
    required: true,
    options: epworthOptions,
    dbField: 'teste_epworth.lugar_publico',
  },
  {
    id: 'epworth_3',
    section: 5,
    type: 'scale_0_3',
    label: 'Deitando-se para descansar à tarde quando as circunstâncias permitem',
    description: 'Com qual frequência você costuma dormir nessa situação?',
    required: true,
    options: epworthOptions,
    dbField: 'teste_epworth.descanso_tarde',
  },
  {
    id: 'epworth_4',
    section: 5,
    type: 'scale_0_3',
    label: 'Sentado calmamente após o almoço sem uso de álcool',
    description: 'Com qual frequência você costuma dormir nessa situação?',
    required: true,
    options: epworthOptions,
    dbField: 'teste_epworth.apos_almoco',
  },
  {
    id: 'epworth_5',
    section: 5,
    type: 'scale_0_3',
    label: 'Assistindo televisão',
    description: 'Com qual frequência você costuma dormir nessa situação?',
    required: true,
    options: epworthOptions,
    dbField: 'teste_epworth.assistindo_tv',
  },
  {
    id: 'epworth_6',
    section: 5,
    type: 'scale_0_3',
    label: 'Como passageiro em carro, trem, ônibus, andando 1h sem parar',
    description: 'Com qual frequência você costuma dormir nessa situação?',
    required: true,
    options: epworthOptions,
    dbField: 'teste_epworth.passageiro',
  },
  {
    id: 'epworth_7',
    section: 5,
    type: 'scale_0_3',
    label: 'Sentado e conversando com alguém',
    description: 'Com qual frequência você costuma dormir nessa situação?',
    required: true,
    options: epworthOptions,
    dbField: 'teste_epworth.conversando',
  },
  {
    id: 'epworth_8',
    section: 5,
    type: 'scale_0_3',
    label: 'Dirigindo carro que está parado por alguns minutos em trânsito intenso',
    description: 'Com qual frequência você costuma dormir nessa situação?',
    required: true,
    options: epworthOptions,
    dbField: 'teste_epworth.dirigindo_transito',
  },
];
