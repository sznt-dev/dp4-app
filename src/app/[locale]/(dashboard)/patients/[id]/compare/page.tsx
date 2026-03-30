'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, TrendingDown, TrendingUp, Minus, Download } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';

interface Submission {
  id: string;
  submission_type: string;
  status: string;
  completed_at: string | null;
  created_at: string;
  lipp_score: number | null;
  lipp_classification: string | null;
  bruxism_score: number | null;
  bruxism_classification: string | null;
  epworth_score: number | null;
  epworth_classification: string | null;
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
}

interface ScoreComparison {
  label: string;
  first: number | null;
  control: number | null;
  max: number;
  firstClassification: string | null;
  controlClassification: string | null;
}

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

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(', ');
  return JSON.stringify(value);
}

function getScoreColor(score: number | null, max: number): string {
  if (score === null) return '#6B7280';
  const ratio = score / max;
  if (ratio < 0.25) return '#10B981';
  if (ratio < 0.5) return '#F59E0B';
  if (ratio < 0.75) return '#F97316';
  return '#EF4444';
}

export default function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [patientName, setPatientName] = useState('');
  const [firstSub, setFirstSub] = useState<Submission | null>(null);
  const [controlSub, setControlSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const supabase = createClient();

    const { data: patient } = await supabase
      .from('dp4_patients')
      .select('name')
      .eq('id', id)
      .single();

    if (patient) setPatientName(patient.name);

    // Get all completed submissions for this patient
    const { data: submissions } = await supabase
      .from('dp4_submissions')
      .select('*')
      .eq('patient_id', id)
      .eq('status', 'completed')
      .order('created_at', { ascending: true });

    if (submissions && submissions.length >= 2) {
      setFirstSub(submissions[0]);
      setControlSub(submissions[submissions.length - 1]);
    } else if (submissions && submissions.length === 1) {
      setFirstSub(submissions[0]);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!firstSub) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-foreground/60">Nenhum formulário completo encontrado.</p>
        <button onClick={() => router.push(`/patients/${id}`)} className="text-amber-400 text-sm">
          Voltar
        </button>
      </div>
    );
  }

  if (!controlSub) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-foreground/60">Apenas 1 formulário completo. O comparativo requer o formulário de controle.</p>
        <button onClick={() => router.push(`/patients/${id}`)} className="text-amber-400 text-sm">
          Voltar
        </button>
      </div>
    );
  }

  const scores: ScoreComparison[] = [
    {
      label: 'Estresse Lipp',
      first: firstSub.lipp_score,
      control: controlSub.lipp_score,
      max: 12,
      firstClassification: firstSub.lipp_classification,
      controlClassification: controlSub.lipp_classification,
    },
    {
      label: 'Bruxismo',
      first: firstSub.bruxism_score,
      control: controlSub.bruxism_score,
      max: 20,
      firstClassification: firstSub.bruxism_classification,
      controlClassification: controlSub.bruxism_classification,
    },
    {
      label: 'Epworth',
      first: firstSub.epworth_score,
      control: controlSub.epworth_score,
      max: 24,
      firstClassification: firstSub.epworth_classification,
      controlClassification: controlSub.epworth_classification,
    },
  ];

  // Build comparison sections
  const JSONB_COLS = [
    'saude_oral', 'saude_medica', 'neuroplasticidade', 'pain_map',
    'orofacial', 'sleep_disorders', 'chronic_disorders', 'physical_measurements',
  ] as const;

  const comparisonSections = JSONB_COLS
    .map((col) => {
      const firstData = (firstSub[col] || {}) as Record<string, unknown>;
      const controlData = (controlSub[col] || {}) as Record<string, unknown>;
      const allKeys = [...new Set([...Object.keys(firstData), ...Object.keys(controlData)])];

      if (allKeys.length === 0) return null;

      const fields = allKeys.map((key) => ({
        key,
        first: formatValue(firstData[key]),
        control: formatValue(controlData[key]),
        changed: formatValue(firstData[key]) !== formatValue(controlData[key]),
      }));

      return {
        title: SECTION_LABELS[col] || col,
        fields,
        hasChanges: fields.some((f) => f.changed),
      };
    })
    .filter(Boolean) as { title: string; fields: { key: string; first: string; control: string; changed: boolean }[]; hasChanges: boolean }[];

  const firstDate = firstSub.completed_at
    ? new Date(firstSub.completed_at).toLocaleDateString('pt-BR')
    : new Date(firstSub.created_at).toLocaleDateString('pt-BR');

  const controlDate = controlSub.completed_at
    ? new Date(controlSub.completed_at).toLocaleDateString('pt-BR')
    : new Date(controlSub.created_at).toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/patients/${id}`)}
          className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground/50" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Comparativo</h1>
          <p className="text-base text-foreground/60 mt-0.5">{patientName}</p>
        </div>
      </div>

      {/* Date labels */}
      <div className="grid grid-cols-2 gap-4">
        <div className="px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center">
          <p className="text-xs text-blue-400 font-medium">1o Preenchimento</p>
          <p className="text-sm text-foreground/60">{firstDate}</p>
        </div>
        <div className="px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
          <p className="text-xs text-emerald-400 font-medium">Controle</p>
          <p className="text-sm text-foreground/60">{controlDate}</p>
        </div>
      </div>

      {/* Score comparison */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Scores</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scores.map((score) => {
            const delta = score.first !== null && score.control !== null
              ? score.control - score.first
              : null;

            return (
              <div key={score.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
                <p className="text-sm text-foreground/60 text-center">{score.label}</p>

                <div className="flex items-center justify-center gap-4">
                  {/* First */}
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: getScoreColor(score.first, score.max) }}>
                      {score.first ?? '—'}
                    </p>
                    <p className="text-xs text-foreground/40">{score.firstClassification || ''}</p>
                  </div>

                  {/* Arrow / Delta */}
                  <div className="flex flex-col items-center">
                    {delta !== null && (
                      <>
                        {delta < 0 ? (
                          <TrendingDown className="w-5 h-5 text-emerald-400" />
                        ) : delta > 0 ? (
                          <TrendingUp className="w-5 h-5 text-red-400" />
                        ) : (
                          <Minus className="w-5 h-5 text-foreground/30" />
                        )}
                        <span
                          className={`text-xs font-bold ${
                            delta < 0 ? 'text-emerald-400' : delta > 0 ? 'text-red-400' : 'text-foreground/30'
                          }`}
                        >
                          {delta > 0 ? '+' : ''}{delta}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Control */}
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: getScoreColor(score.control, score.max) }}>
                      {score.control ?? '—'}
                    </p>
                    <p className="text-xs text-foreground/40">{score.controlClassification || ''}</p>
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-foreground/30">
                  <span>1o</span>
                  <span>/{score.max}</span>
                  <span>Controle</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data comparison — only show sections with changes */}
      {comparisonSections.filter((s) => s.hasChanges).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Mudanças nas respostas</h2>

          {comparisonSections
            .filter((s) => s.hasChanges)
            .map((section) => (
              <div key={section.title} className="rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="px-4 py-3 bg-white/[0.02]">
                  <span className="text-sm font-medium text-foreground/90">{section.title}</span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {/* Header row */}
                  <div className="grid grid-cols-3 px-4 py-2 bg-white/[0.01]">
                    <span className="text-xs text-foreground/40">Campo</span>
                    <span className="text-xs text-blue-400/70 text-center">1o</span>
                    <span className="text-xs text-emerald-400/70 text-center">Controle</span>
                  </div>

                  {section.fields
                    .filter((f) => f.changed)
                    .map((field) => (
                      <div key={field.key} className="grid grid-cols-3 px-4 py-2.5 bg-amber-500/[0.02]">
                        <span className="text-xs text-foreground/60">{field.key.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-foreground/50 text-center">{field.first}</span>
                        <span className="text-xs text-foreground/90 text-center font-medium">{field.control}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {comparisonSections.filter((s) => s.hasChanges).length === 0 && (
        <div className="text-center py-8">
          <p className="text-foreground/50">Nenhuma diferença encontrada nas respostas entre o 1o preenchimento e o controle.</p>
        </div>
      )}
    </div>
  );
}
