/**
 * DEYA Webhook Sender
 * Sends completed DP4 form submissions to the DEYA AI platform.
 * Called after form completion in /api/submissions/complete.
 */

const DEYA_WEBHOOK_URL = process.env.DEYA_WEBHOOK_URL || '';
const DEYA_WEBHOOK_TOKEN = process.env.DEYA_WEBHOOK_TOKEN || '';

interface SubmissionData {
  id: string;
  patient_id: string;
  dentist_id: string;
  submission_type: string;
  dados_pessoais: Record<string, any>;
  saude_oral: Record<string, any>;
  saude_medica: Record<string, any>;
  prontuario: Record<string, any>;
  neuroplasticidade: Record<string, any>;
  pain_map: Record<string, any>;
  orofacial: Record<string, any>;
  sleep_disorders: Record<string, any>;
  chronic_disorders: Record<string, any>;
  physical_measurements: Record<string, any>;
  estresse_lipp: Record<string, any>;
  grau_bruxismo: Record<string, any>;
  teste_epworth: Record<string, any>;
  lipp_score: number | null;
  lipp_classification: string | null;
  bruxism_score: number | null;
  bruxism_classification: string | null;
  epworth_score: number | null;
  epworth_classification: string | null;
  dp4_patients?: { name: string; cpf: string; email: string | null; phone: string | null; dob: string | null };
  dp4_dentists?: { email: string; name: string };
}

// ─── Lipp fields ───
const LIPP_FIELDS = [
  'tensao_muscular', 'repetir_assunto', 'esquecer_coisas', 'ansiedade',
  'hiperacidez_estomacal', 'disturbio_sono', 'irritabilidade_excessiva',
  'cansaco_acordar', 'vontade_sumir', 'trabalhar_competencia',
  'sensacao_incompetencia', 'sensacao_nadavale',
];

// ─── Bruxismo fields ───
const BRUX_FIELDS = [
  'dor_cabeca_face_pescoco_ombros', 'cansado_desconforto_ao_acordar',
  'dificuldade_dormir', 'usa_medicamento_dormir', 'apertar_ranger_dentes',
  'consumo_estimulantes', 'consumo_gluten_lactose', 'exposicao_telas',
  'condicoes_medicas', 'pessoa_tensa_ansiosa',
];

// ─── Epworth fields ───
const EPWORTH_FIELDS = [
  'sentado_lendo', 'inativo_lugar_publico', 'deitado_tarde',
  'pos_almoco_sem_alcool', 'assistindo_tv', 'passageiro_transporte',
  'conversando_sentado', 'transito_parado',
];

export async function sendWebhookToDeya(submission: SubmissionData): Promise<void> {
  if (!DEYA_WEBHOOK_URL || !DEYA_WEBHOOK_TOKEN) {
    console.warn('DEYA webhook not configured (missing DEYA_WEBHOOK_URL or DEYA_WEBHOOK_TOKEN)');
    return;
  }

  const patient = submission.dp4_patients;
  const dentist = submission.dp4_dentists;
  const sm = submission.saude_medica || {};
  const pm = submission.pain_map || {};
  const lipp = submission.estresse_lipp || {};
  const brux = submission.grau_bruxismo || {};
  const epw = submission.teste_epworth || {};
  const neuro = submission.neuroplasticidade || {};
  const sd = submission.sleep_disorders || {};

  const payload = {
    dp4_token: DEYA_WEBHOOK_TOKEN,
    dentist_email: dentist?.email || '',
    submission_id: submission.id,
    patient: {
      name: patient?.name || '',
      cpf: patient?.cpf || undefined,
      date_of_birth: patient?.dob || undefined,
      email: patient?.email || undefined,
      phone: patient?.phone || undefined,
    },
    health: {
      dental_sensitivity: !!submission.saude_oral?.dentes_sensiveis,
      bruxism_habits: buildBruxismHabits(submission.saude_oral || {}),
      medications: sm.medicamento_diario_qual ? [sm.medicamento_diario_qual] : [],
      sleep_issues: buildSleepIssues(sm, sd),
      medical_history: buildMedicalHistory(sm),
    },
    pain_map: {
      trapezio: { left: pm.trapezio_esquerdo || 0, right: pm.trapezio_direito || 0 },
      masseter: { left: pm.masseter_esquerdo || 0, right: pm.masseter_direito || 0 },
      temporal: { left: pm.temporal_esquerdo || 0, right: pm.temporal_direito || 0 },
      frontal: pm.frontal || 0,
      cervical: pm.cervical || 0,
    },
    pain_frequency: pm.frequencia_dor || undefined,
    pain_type: pm.tipo_dor || undefined,
    tmj_symptoms: {
      clicking: !!submission.orofacial?.ruido_articulacao,
      locking: false,
      pain: !!submission.orofacial?.dificuldade_mastigar,
      crepitus: false,
    },
    lipp: LIPP_FIELDS.map((f) => !!lipp[f]),
    bruxism_scale: BRUX_FIELDS.map((f) => Number(brux[f]) || 0),
    epworth: EPWORTH_FIELDS.map((f) => Number(epw[f]) || 0),
  };

  // Retry with exponential backoff (max 3 attempts)
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(DEYA_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DP4-App-Webhook',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`DEYA webhook sent successfully (attempt ${attempt}):`, result);
        return;
      }

      const errorBody = await response.text();
      lastError = new Error(`DEYA webhook returned ${response.status}: ${errorBody}`);
      console.error(`DEYA webhook attempt ${attempt} failed:`, lastError.message);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`DEYA webhook attempt ${attempt} error:`, lastError.message);
    }

    // Wait before retry (exponential backoff)
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError || new Error('DEYA webhook failed after 3 attempts');
}

function buildBruxismHabits(saudeOral: Record<string, any>): string[] {
  const habits: string[] = [];
  if (saudeOral.aperta_dentes) habits.push('Aperta os dentes sob estresse');
  if (saudeOral.range_dentes) habits.push('Range os dentes durante a noite');
  if (saudeOral.dor_cabeca) habits.push('Dor de cabeca apos refeicoes');
  return habits;
}

function buildSleepIssues(sm: Record<string, any>, sd: Record<string, any>): string[] {
  const issues: string[] = [];
  if (sm.acorda_durante_noite) issues.push('Acorda durante a noite');
  if (sm.banheiro_durante_noite) issues.push('Banheiro durante a noite');
  if (sd.ronca && sd.ronca !== 'nunca') issues.push('Ronca');
  if (sd.problemas_sono && sd.problemas_sono !== 'nunca') issues.push('Problemas de sono');
  return issues;
}

function buildMedicalHistory(sm: Record<string, any>): Record<string, boolean> {
  const fields = [
    'febre_reumatica', 'doencas_articulares', 'problemas_coracao', 'hipertensao',
    'diabetes', 'endocardite', 'problemas_digestivo', 'dores_cabeca', 'bronquite',
    'tornozelos_inchados', 'hepatite', 'dst', 'hospitalizado', 'submetido_cirurgia',
  ];
  return Object.fromEntries(fields.map((f) => [f, !!sm[f]]));
}
