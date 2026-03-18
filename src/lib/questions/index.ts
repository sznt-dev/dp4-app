import type { Question, SectionMeta } from '@/types';
import { section1Questions } from './section-1-dados';
import { section2Questions } from './section-2-neuro';
import { section3Questions } from './section-3-lipp';
import { section4Questions } from './section-4-bruxismo';
import { section5Questions } from './section-5-epworth';

// Section metadata
export const SECTIONS: SectionMeta[] = [
  {
    section: 1,
    title: 'Dados Pessoais e Saúde',
    description: 'Informações pessoais, saúde oral e histórico médico',
    icon: 'User',
    scorable: false,
  },
  {
    section: 2,
    title: 'Neuroplasticidade',
    description: 'Queixa principal, hábitos, mapa de dor e avaliação clínica',
    icon: 'Brain',
    scorable: false,
  },
  {
    section: 3,
    title: 'Estresse Lipp',
    description: 'Avaliação do nível de estresse',
    icon: 'Heart',
    scorable: true,
    scoreType: 'lipp',
  },
  {
    section: 4,
    title: 'Grau de Bruxismo',
    description: 'Avaliação simplificada do bruxismo',
    icon: 'Activity',
    scorable: true,
    scoreType: 'bruxismo',
  },
  {
    section: 5,
    title: 'Teste Epworth',
    description: 'Avaliação da sonolência diurna',
    icon: 'Moon',
    scorable: true,
    scoreType: 'epworth',
  },
];

// All questions organized by section
export const QUESTIONS_BY_SECTION: Record<number, Question[]> = {
  1: section1Questions,
  2: section2Questions,
  3: section3Questions,
  4: section4Questions,
  5: section5Questions,
};

// Flat array of all questions (for total count / progress)
export const ALL_QUESTIONS: Question[] = [
  ...section1Questions,
  ...section2Questions,
  ...section3Questions,
  ...section4Questions,
  ...section5Questions,
];

// Total question count (excluding conditionals and follow-ups)
export const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

// Re-export section arrays for direct access
export { section1Questions, section2Questions, section3Questions, section4Questions, section5Questions };
