'use client';

import { useEffect, useState, use } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useCurrentDentist } from '@/lib/hooks/use-current-dentist';
import { ArrowLeft, Copy, Check, Link2, Download, GitCompareArrows, Trash2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';

interface PatientData {
  id: string;
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  dob?: string;
}

interface SubmissionData {
  id: string;
  status: string;
  submission_type: string;
  dados_pessoais: Record<string, unknown>;
  saude_oral: Record<string, unknown>;
  saude_medica: Record<string, unknown>;
  prontuario: Record<string, unknown>;
  neuroplasticidade: Record<string, unknown>;
  pain_map: Record<string, unknown>;
  orofacial: Record<string, unknown>;
  sleep_disorders: Record<string, unknown>;
  chronic_disorders: Record<string, unknown>;
  physical_measurements: Record<string, unknown>;
  estresse_lipp: Record<string, unknown>;
  grau_bruxismo: Record<string, unknown>;
  teste_epworth: Record<string, unknown>;
  lipp_score: number | null;
  lipp_classification: string | null;
  bruxism_score: number | null;
  bruxism_classification: string | null;
  epworth_score: number | null;
  epworth_classification: string | null;
  completed_at: string | null;
  created_at: string;
}

const SECTION_LABEL_KEYS: Record<string, string> = {
  dados_pessoais: 'dados_pessoais',
  saude_oral: 'saude_oral',
  saude_medica: 'saude_medica',
  prontuario: 'prontuario',
  neuroplasticidade: 'neuroplasticidade',
  pain_map: 'pain_map',
  orofacial: 'orofacial',
  sleep_disorders: 'sleep_disorders',
  chronic_disorders: 'chronic_disorders',
  physical_measurements: 'physical_measurements',
  estresse_lipp: 'estresse_lipp',
  grau_bruxismo: 'grau_bruxismo',
  teste_epworth: 'teste_epworth',
};

const FIELD_LABEL_KEYS: Record<string, string> = {
  nome: 'nome', cpf: 'cpf', data_nascimento: 'data_nascimento',
  endereco: 'endereco', celular: 'celular', email: 'email',
  contato_emergencia: 'contato_emergencia', como_chegou: 'como_chegou',
  tempo_escovacao: 'tempo_escovacao', tipo_escova: 'tipo_escova',
  usa_fio_dental: 'usa_fio_dental', frequencia_fio: 'frequencia_fio',
  sangramento_gengival: 'sangramento_gengival', sensibilidade: 'sensibilidade',
  dor_dente: 'dor_dente', bruxismo_diurno: 'bruxismo_diurno',
  bruxismo_noturno: 'bruxismo_noturno', aperta_dentes: 'aperta_dentes',
  range_dentes: 'range_dentes', usa_placa: 'usa_placa',
  tratamento_anterior: 'tratamento_anterior', dor_atm: 'dor_atm',
  estalidos: 'estalidos', zumbido: 'zumbido',
  diabetes: 'diabetes', hipertensao: 'hipertensao',
  historico_medico: 'historico_medico', medicamentos: 'medicamentos',
  alergia: 'alergia', alergia_qual: 'alergia_qual',
  anticoncepcional: 'anticoncepcional', anticoncepcional_qual: 'anticoncepcional_qual',
  gravidez: 'gravidez', gravidez_meses: 'gravidez_meses',
  fumante: 'fumante', fumante_frequencia: 'fumante_frequencia',
  queixa_principal: 'queixa_principal', queixa_detalhes: 'queixa_detalhes',
  queixa_inicio: 'queixa_inicio', queixa_evolucao: 'queixa_evolucao',
  peso: 'peso', altura: 'altura', imc: 'imc', classificacao: 'classificacao',
};

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('patientDetail');
  const tCommon = useTranslations('common');
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['dados_pessoais']));
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const router = useRouter();

  function formatValue(value: unknown): string {
    if (value === null || value === undefined) return tCommon('noValue');
    if (typeof value === 'boolean') return value ? tCommon('yes') : tCommon('no');
    if (typeof value === 'object') {
      if (Array.isArray(value)) return value.join(', ');
      return JSON.stringify(value);
    }
    return String(value);
  }

  const { dentist: currentDentist, loading: dentistLoading } = useCurrentDentist();

  useEffect(() => {
    if (!dentistLoading) {
      if (!currentDentist) {
        router.push('/login');
        return;
      }
      loadPatient(currentDentist);
    }
  }, [id, dentistLoading, currentDentist]);

  async function loadPatient(myDentist: NonNullable<typeof currentDentist>) {
    const supabase = createClient();

    // SECURITY: verify this patient belongs to the logged-in dentist
    let q = supabase.from('dp4_patients').select('*').eq('id', id);
    if (!myDentist.isAdmin) {
      q = q.eq('dentist_id', myDentist.id);
    }
    const { data: patientData } = await q.single();

    if (!patientData) {
      // Patient not found or doesn't belong to this dentist
      router.push('/patients');
      setLoading(false);
      return;
    }

    setPatient(patientData);

    // Get latest completed submission
    const { data: sub } = await supabase
      .from('dp4_submissions')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sub) setSubmission(sub);
    setLoading(false);
  }

  function toggleSection(section: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  async function generateControlLink() {
    if (!patient || !submission) return;

    const token = `ctrl-${crypto.randomUUID().slice(0, 8)}`;

    // Create a control link in the database tied to this patient
    const supabase = createClient();
    await supabase.from('dp4_links').insert({
      token,
      patient_id: patient.id,
      link_type: 'control',
      parent_submission_id: submission.id,
    });

    const link = `${window.location.origin}/d/${token}`;
    await navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function deleteSubmission() {
    if (!submission) return;

    const confirmed = window.confirm(
      t('deleteConfirm', { name: patient?.name || '' })
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      t('deleteDoubleConfirm')
    );
    if (!doubleConfirm) return;

    const supabase = createClient();

    // Delete in order: progress → submissions → links → patient
    await supabase.from('dp4_submission_progress').delete().eq('submission_id', submission.id);
    await supabase.from('dp4_logs').delete().eq('submission_id', submission.id);
    await supabase.from('dp4_links').delete().eq('patient_id', patient!.id);
    await supabase.from('dp4_submissions').delete().eq('patient_id', patient!.id);
    await supabase.from('dp4_patients').delete().eq('id', patient!.id);

    router.push('/patients');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/90">{t('notFound')}</p>
      </div>
    );
  }

  const scoreCards = submission
    ? [
        {
          label: t('scores.lipp'),
          score: submission.lipp_score,
          max: 12,
          classification: submission.lipp_classification,
          color: getScoreColor(submission.lipp_score, 12),
        },
        {
          label: t('scores.bruxism'),
          score: submission.bruxism_score,
          max: 20,
          classification: submission.bruxism_classification,
          color: getScoreColor(submission.bruxism_score, 20),
        },
        {
          label: t('scores.epworth'),
          score: submission.epworth_score,
          max: 24,
          classification: submission.epworth_classification,
          color: getScoreColor(submission.epworth_score, 24),
        },
      ]
    : [];

  const jsonbSections = submission
    ? ([
        'dados_pessoais', 'saude_oral', 'saude_medica', 'prontuario',
        'neuroplasticidade', 'pain_map', 'orofacial', 'sleep_disorders',
        'chronic_disorders', 'physical_measurements', 'estresse_lipp',
        'grau_bruxismo', 'teste_epworth',
      ] as const).filter((key) => {
        const data = submission[key as keyof SubmissionData];
        return data && typeof data === 'object' && Object.keys(data as object).length > 0;
      })
    : [];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/patients')}
          className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground/90" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{patient.name}</h1>
          <p className="text-sm text-muted-foreground/80 font-mono mt-0.5">
            {t('cpfLabel')}: {formatCPF(patient.cpf)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {submission && (
            <a
              href={`/api/submissions/pdf?id=${submission.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] text-foreground/90 border border-white/[0.08] text-sm font-medium hover:bg-white/[0.08] transition-colors"
            >
              <Download className="w-4 h-4" />
              {tCommon('pdf')}
            </a>
          )}
          <button
            onClick={() => router.push(`/patients/${id}/compare`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] text-foreground/70 border border-white/[0.08] text-sm font-medium hover:bg-white/[0.08] transition-colors"
          >
            <GitCompareArrows className="w-4 h-4" />
            {tCommon('compare')}
          </button>
          <button
            onClick={generateControlLink}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 text-sm font-medium hover:bg-amber-500/25 transition-colors"
          >
            {linkCopied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            {linkCopied ? t('controlLinkCopied') : t('controlLink')}
          </button>
        </div>
      </div>

      {/* Scores */}
      {scoreCards.length > 0 && scoreCards.some((s) => s.score !== null) && (
        <div className="grid grid-cols-3 gap-4">
          {scoreCards.map((card) => (
            <div
              key={card.label}
              className="px-4 py-5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center space-y-1"
            >
              <p className="text-xs text-muted-foreground/90">{card.label}</p>
              <p className="text-3xl font-bold" style={{ color: card.color }}>
                {card.score ?? '—'}
                <span className="text-sm font-normal text-muted-foreground/80">/{card.max}</span>
              </p>
              <p className="text-xs font-medium" style={{ color: card.color }}>
                {card.classification || '—'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Status info */}
      {submission && (
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
              submission.status === 'completed'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {submission.status === 'completed' ? t('statusComplete') : t('statusInProgress')}
          </span>
          <span className="text-xs text-muted-foreground/80">
            {submission.completed_at
              ? `${t('finishedAt')} ${new Date(submission.completed_at).toLocaleDateString('pt-BR')}`
              : `${t('startedAt')} ${new Date(submission.created_at).toLocaleDateString('pt-BR')}`}
          </span>
        </div>
      )}

      {/* Data sections (accordions) */}
      {jsonbSections.length > 0 ? (
        <div className="space-y-2">
          {jsonbSections.map((sectionKey) => {
            const data = submission![sectionKey as keyof SubmissionData] as Record<string, unknown>;
            const isOpen = openSections.has(sectionKey);
            return (
              <div key={sectionKey} className="rounded-xl border border-white/[0.06] overflow-hidden">
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
                >
                  <span className="text-sm font-medium text-foreground/95">
                    {SECTION_LABEL_KEYS[sectionKey] ? t(`sectionLabels.${SECTION_LABEL_KEYS[sectionKey]}`) : sectionKey}
                  </span>
                  <span className="text-xs text-muted-foreground/80">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 py-3 space-y-2 bg-white/[0.01]">
                    {Object.entries(data).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-baseline gap-4">
                        <span className="text-xs text-muted-foreground/90 shrink-0">
                          {FIELD_LABEL_KEYS[key] ? t(`fieldLabels.${FIELD_LABEL_KEYS[key]}`) : key}
                        </span>
                        <span className="text-sm text-foreground/90 text-right truncate">
                          {formatValue(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/80 py-8 text-center">
          {t('noForm')}
        </p>
      )}

      {/* Danger zone — delete */}
      {submission && (
        <div className="mt-8 pt-6 border-t border-red-500/10">
          <button
            onClick={deleteSubmission}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/5 border border-red-500/10 hover:border-red-500/20 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            {t('deleteButton')}
          </button>
        </div>
      )}
    </div>
  );
}

function formatCPF(cpf: string): string {
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

function getScoreColor(score: number | null, max: number): string {
  if (score === null) return '#666';
  const ratio = score / max;
  if (ratio < 0.25) return '#10B981'; // emerald
  if (ratio < 0.5) return '#F59E0B';  // amber
  if (ratio < 0.75) return '#F97316'; // orange
  return '#EF4444'; // red
}
