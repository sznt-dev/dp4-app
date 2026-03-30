import type { Question } from '@/types';

export function translateQuestion(q: Question, t: (key: string) => string): Question {
  const translated = { ...q };

  // Label
  const labelKey = `questions.${q.id}.label`;
  const tLabel = t(labelKey);
  if (tLabel !== labelKey) translated.label = tLabel;

  // Description
  if (q.description) {
    const descKey = `questions.${q.id}.description`;
    const tDesc = t(descKey);
    if (tDesc !== descKey) translated.description = tDesc;
  }

  // Placeholder
  if (q.placeholder) {
    const phKey = `questions.${q.id}.placeholder`;
    const tPh = t(phKey);
    if (tPh !== phKey) translated.placeholder = tPh;
  }

  // Subsection
  if (q.subsection) {
    const subKey = `subsections.${q.subsection.replace(/\s+/g, '')}`;
    const tSub = t(subKey);
    if (tSub !== subKey) translated.subsection = tSub;
  }

  // Options
  if (q.options) {
    translated.options = q.options.map(opt => {
      // Try question-specific option first
      const optKey = `questions.${q.id}.options.${opt.value}`;
      const tOpt = t(optKey);
      if (tOpt !== optKey) return { ...opt, label: tOpt };
      return opt;
    });
  }

  // FollowUp
  if (q.followUp) {
    translated.followUp = translateQuestion(q.followUp, t);
  }

  return translated;
}

export function translateQuestions(questions: Question[], t: (key: string) => string): Question[] {
  return questions.map(q => translateQuestion(q, t));
}
