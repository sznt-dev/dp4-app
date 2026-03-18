import type { Question } from '@/types';

/**
 * Seção 4: Diário de Sono (1 entrada por dia)
 * O pai/mãe preenche informações sobre uma noite de sono.
 * Na prática, pode preencher múltiplas vezes (controle diário).
 * Aqui definimos as perguntas para UMA entrada.
 */
export const kidsSection4Questions: Question[] = [
  {
    id: 'kids_diario_data',
    section: 5 as const,
    subsection: 'Diário de Sono',
    type: 'date' as const,
    label: 'Qual a data desta noite de sono?',
    required: true,
    dbField: 'diario_sono.data',
  },
  {
    id: 'kids_diario_ultima_refeicao',
    section: 5 as const,
    subsection: 'Diário de Sono',
    type: 'text' as const,
    label: 'A que horas foi a última refeição antes de dormir?',
    required: true,
    placeholder: 'Ex: 19:30',
    dbField: 'diario_sono.ultima_refeicao',
  },
  {
    id: 'kids_diario_hora_dormir',
    section: 5 as const,
    subsection: 'Diário de Sono',
    type: 'text' as const,
    label: 'A que horas a criança dormiu?',
    required: true,
    placeholder: 'Ex: 21:00',
    dbField: 'diario_sono.hora_dormir',
  },
  {
    id: 'kids_diario_hora_acordar',
    section: 5 as const,
    subsection: 'Diário de Sono',
    type: 'text' as const,
    label: 'A que horas a criança acordou?',
    required: true,
    placeholder: 'Ex: 06:30',
    dbField: 'diario_sono.hora_acordar',
  },
  {
    id: 'kids_diario_despertares',
    section: 5 as const,
    subsection: 'Diário de Sono',
    type: 'number' as const,
    label: 'Quantas vezes a criança acordou durante a noite?',
    required: true,
    min: 0,
    max: 20,
    placeholder: '0',
    dbField: 'diario_sono.despertares',
  },
  {
    id: 'kids_diario_comportamentos',
    section: 5 as const,
    subsection: 'Comportamentos durante o sono',
    type: 'checkbox_group' as const,
    label: 'Quais comportamentos foram observados durante o sono?',
    required: false,
    options: [
      { value: 'ranger_dentes', label: 'Ranger de dentes' },
      { value: 'ronco', label: 'Ronco' },
      { value: 'engasgo', label: 'Engasgo' },
      { value: 'para_respirar', label: 'Parou de respirar' },
      { value: 'banheiro_xixi', label: 'Ida ao banheiro / xixi na cama' },
      { value: 'baba_travesseiro', label: 'Baba no travesseiro' },
      { value: 'asma_bronquite', label: 'Crise de asma / bronquite' },
      { value: 'rinite_espirros', label: 'Rinite ou espirros / nariz entupido' },
      { value: 'cama_pais', label: 'Acordou para ir para cama dos pais' },
    ],
    dbField: 'diario_sono.comportamentos',
  },
  {
    id: 'kids_diario_observacoes',
    section: 5 as const,
    subsection: 'Diário de Sono',
    type: 'textarea' as const,
    label: 'Observações adicionais sobre esta noite',
    required: false,
    placeholder: 'Algo que você tenha notado...',
    dbField: 'diario_sono.observacoes',
  },
];
