import type { Question } from '@/types';

/**
 * Seção 0: Dados da Criança
 * Preenchido pelos pais/responsáveis
 */
export const kidsSection0Questions: Question[] = [
  {
    id: 'kids_nome_responsavel',
    section: 1,
    subsection: 'Dados do Responsável',
    type: 'text',
    label: 'Qual o seu nome? (pai, mãe ou responsável)',
    required: true,
    placeholder: 'Nome completo do responsável',
    dbField: 'dados_crianca.nome_responsavel',
  },
  {
    id: 'kids_cpf_responsavel',
    section: 1,
    subsection: 'Dados do Responsável',
    type: 'cpf',
    label: 'Qual o seu CPF?',
    description: 'Usamos seu CPF para salvar o progresso. Se precisar parar, pode continuar de onde parou.',
    required: true,
    placeholder: '000.000.000-00',
    dbField: 'dados_crianca.cpf_responsavel',
  },
  {
    id: 'kids_nome_crianca',
    section: 1,
    subsection: 'Dados da Criança',
    type: 'text',
    label: 'Qual o nome da criança?',
    required: true,
    placeholder: 'Nome completo da criança',
    dbField: 'dados_crianca.nome_crianca',
  },
  {
    id: 'kids_data_nascimento',
    section: 1,
    subsection: 'Dados da Criança',
    type: 'date',
    label: 'Qual a data de nascimento da criança?',
    required: true,
    dbField: 'dados_crianca.data_nascimento',
  },
  {
    id: 'kids_parentesco',
    section: 1,
    subsection: 'Dados do Responsável',
    type: 'select',
    label: 'Qual seu parentesco com a criança?',
    required: true,
    options: [
      { value: 'mae', label: 'Mãe' },
      { value: 'pai', label: 'Pai' },
      { value: 'avo', label: 'Avô/Avó' },
      { value: 'outro', label: 'Outro responsável' },
    ],
    dbField: 'dados_crianca.parentesco',
  },
];
