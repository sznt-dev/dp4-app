import type { Question } from '@/types';

/**
 * Seção 3: Questionário de Estresse Lipp
 * 12 perguntas binárias (0=NÃO, 1=SIM)
 * Score: 0=ok, 1-3=baixo, 4-8=alto, 8-12=severo
 */

export const section3Questions: Question[] = [
  {
    id: 'lipp_1',
    section: 3,
    type: 'scale_0_1',
    label: 'Tensão muscular (Ex.: Aperto de mandíbula, dor na nuca).',
    required: true,
    options: [
      { value: 0, label: 'NÃO', color: '#10B981' },
      { value: 1, label: 'SIM', color: '#EF4444' },
    ],
    dbField: 'estresse_lipp.tensao_muscular',
  },
  {
    id: 'lipp_2',
    section: 3,
    type: 'scale_0_1',
    label: 'Pensar em um só assunto ou repetir o mesmo assunto.',
    required: true,
    options: [
      { value: 0, label: 'NÃO', color: '#10B981' },
      { value: 1, label: 'SIM', color: '#EF4444' },
    ],
    dbField: 'estresse_lipp.pensar_mesmo_assunto',
  },
  {
    id: 'lipp_3',
    section: 3,
    type: 'scale_0_1',
    label: 'Esquecimento de coisas corriqueiras (ex.: onde colocou as chaves).',
    required: true,
    options: [
      { value: 0, label: 'NÃO', color: '#10B981' },
      { value: 1, label: 'SIM', color: '#EF4444' },
    ],
    dbField: 'estresse_lipp.esquecimento',
  },
  {
    id: 'lipp_4',
    section: 3,
    type: 'scale_0_1',
    label: 'Ansiedade.',
    required: true,
    options: [
      { value: 0, label: 'NÃO', color: '#10B981' },
      { value: 1, label: 'SIM', color: '#EF4444' },
    ],
    dbField: 'estresse_lipp.ansiedade',
  },
  {
    id: 'lipp_5',
    section: 3,
    type: 'scale_0_1',
    label: 'Hiperacidez estomacal (azia) sem causa aparente.',
    required: true,
    options: [
      { value: 0, label: 'NÃO', color: '#10B981' },
      { value: 1, label: 'SIM', color: '#EF4444' },
    ],
    dbField: 'estresse_lipp.hiperacidez',
  },
  {
    id: 'lipp_6',
    section: 3,
    type: 'scale_0_1',
    label: 'Distúrbio do sono ou dormir de mais/menos.',
    required: true,
    options: [
      { value: 0, label: 'NÃO', color: '#10B981' },
      { value: 1, label: 'SIM', color: '#EF4444' },
    ],
    dbField: 'estresse_lipp.disturbio_sono',
  },
  {
    id: 'lipp_7',
    section: 3,
    type: 'scale_0_1',
    label: 'Irritabilidade excessiva.',
    required: true,
    options: [
      { value: 0, label: 'NÃO', color: '#10B981' },
      { value: 1, label: 'SIM', color: '#EF4444' },
    ],
    dbField: 'estresse_lipp.irritabilidade',
  },
  {
    id: 'lipp_8',
    section: 3,
    type: 'scale_0_1',
    label: 'Cansaço ao acordar.',
    required: true,
    options: [
      { value: 0, label: 'NÃO', color: '#10B981' },
      { value: 1, label: 'SIM', color: '#EF4444' },
    ],
    dbField: 'estresse_lipp.cansaco_acordar',
  },
  {
    id: 'lipp_9',
    section: 3,
    type: 'scale_0_1',
    label: 'Ter vontade de "sumir".',
    required: true,
    options: [
      { value: 0, label: 'NÃO', color: '#10B981' },
      { value: 1, label: 'SIM', color: '#EF4444' },
    ],
    dbField: 'estresse_lipp.vontade_sumir',
  },
  {
    id: 'lipp_10',
    section: 3,
    type: 'scale_0_1',
    label: 'Trabalhar com um nível de competência abaixo do (seu) normal.',
    required: true,
    options: [
      { value: 0, label: 'NÃO', color: '#10B981' },
      { value: 1, label: 'SIM', color: '#EF4444' },
    ],
    dbField: 'estresse_lipp.competencia_abaixo',
  },
  {
    id: 'lipp_11',
    section: 3,
    type: 'scale_0_1',
    label: 'Sensação de incompetência, de que não vai conseguir lidar com o que está ocorrendo.',
    required: true,
    options: [
      { value: 0, label: 'NÃO', color: '#10B981' },
      { value: 1, label: 'SIM', color: '#EF4444' },
    ],
    dbField: 'estresse_lipp.incompetencia',
  },
  {
    id: 'lipp_12',
    section: 3,
    type: 'scale_0_1',
    label: 'Ter a sensação de que nada mais vale a pena.',
    required: true,
    options: [
      { value: 0, label: 'NÃO', color: '#10B981' },
      { value: 1, label: 'SIM', color: '#EF4444' },
    ],
    dbField: 'estresse_lipp.nada_vale_pena',
  },
];
