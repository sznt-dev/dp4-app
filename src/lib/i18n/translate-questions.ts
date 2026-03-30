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
    // Convert subsection name to camelCase key matching JSON:
    // "Dados Pessoais" → "dadosPessoais"
    // "SCARED — Ansiedade" → "scaredAnsiedade"
    // "Comportamentos durante o sono" → "comportamentosDuranteOSono"
    const camelKey = q.subsection
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[^a-zA-Z0-9\s-]/g, '')                  // keep letters, digits, spaces, hyphens
      .trim()
      .split(/[\s-]+/)                                   // split by whitespace or hyphens
      .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
    const subKey = `subsections.${camelKey}`;
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
