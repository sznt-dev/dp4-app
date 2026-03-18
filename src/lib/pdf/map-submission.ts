import type { PDFSection } from './generate-pdf';

const SECTION_LABELS: Record<string, string> = {
  dados_pessoais: 'Dados Pessoais',
  saude_oral: 'Saúde Oral',
  saude_medica: 'Saúde Médica',
  prontuario: 'Prontuário',
  neuroplasticidade: 'Neuroplasticidade',
  pain_map: 'Mapa de Dor',
  orofacial: 'Dores Orofaciais',
  sleep_disorders: 'Distúrbios do Sono',
  chronic_disorders: 'Transtornos Crônicos',
  physical_measurements: 'Medidas Físicas',
  estresse_lipp: 'Estresse Lipp',
  grau_bruxismo: 'Grau de Bruxismo',
  teste_epworth: 'Teste Epworth',
};

const FIELD_LABELS: Record<string, string> = {
  nome: 'Nome', cpf: 'CPF', data_nascimento: 'Data de nascimento',
  endereco: 'Endereço', celular: 'Celular', email: 'E-mail',
  contato_emergencia: 'Contato de emergência', como_chegou: 'Como chegou',
  tempo_escovacao: 'Tempo de escovação', tipo_escova: 'Tipo de escova',
  usa_fio_dental: 'Usa fio dental', frequencia_fio: 'Frequência fio dental',
  sangramento_gengival: 'Sangramento gengival', sensibilidade: 'Sensibilidade',
  dor_dente: 'Dor de dente', bruxismo_diurno: 'Bruxismo diurno',
  bruxismo_noturno: 'Bruxismo noturno', aperta_dentes: 'Aperta os dentes',
  range_dentes: 'Range os dentes', usa_placa: 'Usa placa',
  tratamento_anterior: 'Tratamento anterior', dor_atm: 'Dor ATM',
  estalidos: 'Estalidos', zumbido: 'Zumbido',
  diabetes: 'Diabetes', hipertensao: 'Hipertensão',
  historico_medico: 'Histórico médico', medicamentos: 'Medicamentos',
  alergia: 'Alergia', alergia_qual: 'Qual alergia',
  anticoncepcional: 'Anticoncepcional', anticoncepcional_qual: 'Qual',
  gravidez: 'Gravidez', gravidez_meses: 'Meses',
  fumante: 'Fumante', fumante_frequencia: 'Frequência',
  queixa_principal: 'Queixa principal', queixa_detalhes: 'Detalhes',
  queixa_inicio: 'Início da queixa', queixa_evolucao: 'Evolução',
  peso: 'Peso', altura: 'Altura', imc: 'IMC', classificacao: 'Classificação IMC',
  ansiedade: 'Ansiedade', dor_cabeca: 'Dor de cabeça',
  dor_pescoco: 'Dor no pescoço', dor_ombro: 'Dor no ombro',
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') {
    // Handle nested objects like pain_map, bmi_calculator
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${FIELD_LABELS[k] || k}: ${formatValue(v)}`)
      .join(' | ');
  }
  return String(value);
}

const JSONB_COLUMNS = [
  'dados_pessoais', 'saude_oral', 'saude_medica', 'prontuario',
  'neuroplasticidade', 'pain_map', 'orofacial', 'sleep_disorders',
  'chronic_disorders', 'physical_measurements', 'estresse_lipp',
  'grau_bruxismo', 'teste_epworth',
] as const;

export function mapSubmissionToSections(
  submission: Record<string, unknown>
): PDFSection[] {
  const sections: PDFSection[] = [];

  for (const col of JSONB_COLUMNS) {
    const data = submission[col] as Record<string, unknown> | undefined;
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) continue;

    const fields = Object.entries(data).map(([key, value]) => ({
      label: FIELD_LABELS[key] || key.replace(/_/g, ' '),
      value: formatValue(value),
    }));

    sections.push({
      title: SECTION_LABELS[col] || col,
      fields,
    });
  }

  return sections;
}
