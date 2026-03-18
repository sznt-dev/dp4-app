import type { Question, SectionMeta } from '@/types';
import { kidsSection0Questions } from './section-0-dados';
import { kidsSection1Questions } from './section-1-sono';
import { kidsSection2Questions } from './section-2-scared';
import { kidsSection3Questions } from './section-3-ritmo';
import { kidsSection4Questions } from './section-4-diario';

export const KIDS_SECTIONS: SectionMeta[] = [
  {
    section: 1,
    title: 'Dados da Criança',
    description: 'Informações do responsável e da criança',
    icon: 'Baby',
    scorable: false,
  },
  {
    section: 2,
    title: 'Questionário do Sono',
    description: 'Avaliação do risco de apneia obstrutiva do sono',
    icon: 'Moon',
    scorable: true,
    scoreType: 'lipp', // reusing type, will use custom scorer
  },
  {
    section: 3,
    title: 'SCARED — Ansiedade',
    description: 'Avaliação de transtornos de ansiedade infantil',
    icon: 'Heart',
    scorable: true,
    scoreType: 'bruxismo', // reusing type, will use custom scorer
  },
  {
    section: 4,
    title: 'Ritmo Sono-Vigília',
    description: 'Avaliação do padrão de sono pediátrico',
    icon: 'Activity',
    scorable: true,
    scoreType: 'epworth', // reusing type, will use custom scorer
  },
  {
    section: 5,
    title: 'Diário de Sono',
    description: 'Registro de uma noite de sono da criança',
    icon: 'BookOpen',
    scorable: false,
  },
];

export const KIDS_QUESTIONS_BY_SECTION: Record<number, Question[]> = {
  1: kidsSection0Questions,
  2: kidsSection1Questions,
  3: kidsSection2Questions,
  4: kidsSection3Questions,
  5: kidsSection4Questions,
};

export const ALL_KIDS_QUESTIONS: Question[] = [
  ...kidsSection0Questions,
  ...kidsSection1Questions,
  ...kidsSection2Questions,
  ...kidsSection3Questions,
  ...kidsSection4Questions,
];

export const TOTAL_KIDS_QUESTIONS = ALL_KIDS_QUESTIONS.length;

export {
  kidsSection0Questions,
  kidsSection1Questions,
  kidsSection2Questions,
  kidsSection3Questions,
  kidsSection4Questions,
};
