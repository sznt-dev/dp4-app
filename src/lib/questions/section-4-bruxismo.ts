import type { Question } from '@/types';

/**
 * Seção 4: Grau de Bruxismo - Simplificado
 * 10 perguntas escala 0-2 (NÃO=0, ÀS VEZES=1, SIM=2)
 * Score: 0-5=ausente, 6-10=leve, 10-15=moderado, 16-20=avançado
 */

const bruxOptions = [
  { value: 0, label: 'NÃO', color: '#10B981' },
  { value: 1, label: 'ÀS VEZES', color: '#F59E0B' },
  { value: 2, label: 'SIM', color: '#EF4444' },
];

export const section4Questions: Question[] = [
  {
    id: 'brux_1',
    section: 4,
    type: 'scale_0_2',
    label: 'Você reclama ou sente dor de cabeça, na face, no pescoço ou nos ombros?',
    required: true,
    options: bruxOptions,
    dbField: 'grau_bruxismo.dor_cabeca_face',
  },
  {
    id: 'brux_2',
    section: 4,
    type: 'scale_0_2',
    label: 'Se sente cansado ou com algum tipo de desconforto na face ao acordar?',
    required: true,
    options: bruxOptions,
    dbField: 'grau_bruxismo.desconforto_acordar',
  },
  {
    id: 'brux_3',
    section: 4,
    type: 'scale_0_2',
    label: 'Tem dificuldade para dormir? (Sono agitado e/ou leve)',
    required: true,
    options: bruxOptions,
    dbField: 'grau_bruxismo.dificuldade_dormir',
  },
  {
    id: 'brux_4',
    section: 4,
    type: 'scale_0_2',
    label: 'Usa algum medicamento para dormir?',
    required: true,
    options: bruxOptions,
    dbField: 'grau_bruxismo.medicamento_dormir',
  },
  {
    id: 'brux_5',
    section: 4,
    type: 'scale_0_2',
    label: 'Você tem o hábito de apertar ou ranger os dentes?',
    required: true,
    options: bruxOptions,
    dbField: 'grau_bruxismo.apertar_ranger',
  },
  {
    id: 'brux_6',
    section: 4,
    type: 'scale_0_2',
    label: 'Você tem o hábito de consumir café, tabaco ou algum outro estimulante?',
    required: true,
    options: bruxOptions,
    dbField: 'grau_bruxismo.cafe_tabaco',
  },
  {
    id: 'brux_7',
    section: 4,
    type: 'scale_0_2',
    label: 'Você tem o hábito de consumir derivados de glúten e/ou lactose (Ex.: pão, leite, etc)?',
    required: true,
    options: bruxOptions,
    dbField: 'grau_bruxismo.gluten_lactose',
  },
  {
    id: 'brux_8',
    section: 4,
    type: 'scale_0_2',
    label: 'Você assiste muita TV e/ou fica no celular, computador ou tablet com frequência?',
    required: true,
    options: bruxOptions,
    dbField: 'grau_bruxismo.telas',
  },
  {
    id: 'brux_9',
    section: 4,
    type: 'scale_0_2',
    label: 'Você é hipertenso ou tem sobrepeso ou usa medicamentos para emagrecer?',
    required: true,
    options: bruxOptions,
    dbField: 'grau_bruxismo.hipertenso_sobrepeso',
  },
  {
    id: 'brux_10',
    section: 4,
    type: 'scale_0_2',
    label: 'Você se considera uma pessoa tensa, nervosa ou ansiosa?',
    required: true,
    options: bruxOptions,
    dbField: 'grau_bruxismo.tenso_ansioso',
  },
];
