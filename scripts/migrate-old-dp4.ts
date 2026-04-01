/**
 * Migration Script: Old DP4 (Django PostgreSQL) → New DP4 (Supabase)
 *
 * Usage:
 *   npx tsx scripts/migrate-old-dp4.ts --dry-run   # Validate without inserting
 *   npx tsx scripts/migrate-old-dp4.ts              # Execute migration
 *
 * Requires SSH tunnel to old DP4 database:
 *   ssh -L 5433:localhost:32771 root@187.77.56.22 -N &
 *
 * Environment variables (from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Old DP4 PostgreSQL connection (via SSH tunnel) ───
const oldDb = new pg.Pool({
  host: '127.0.0.1',
  port: 5433, // SSH tunnel: local 5433 → remote 32771
  database: 'form_db',
  user: 'form_user',
  password: 'form_password',
  max: 5,
});

// ─── New DP4 Supabase connection ───
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Scoring functions (same logic as src/lib/scoring/) ───
function classifyLipp(score: number): { classification: string; severity: string } {
  if (score === 0) return { classification: 'Sem estresse', severity: 'normal' };
  if (score <= 3) return { classification: 'Estresse baixo', severity: 'low' };
  if (score <= 7) return { classification: 'Estresse alto', severity: 'high' };
  return { classification: 'Estresse severo', severity: 'severe' };
}

function classifyBruxismo(score: number): { classification: string; severity: string } {
  if (score <= 5) return { classification: 'Ausencia de Bruxismo', severity: 'normal' };
  if (score <= 10) return { classification: 'Bruxismo Leve', severity: 'low' };
  if (score <= 15) return { classification: 'Bruxismo Moderado', severity: 'moderate' };
  return { classification: 'Bruxismo Avancado', severity: 'severe' };
}

function classifyEpworth(score: number): { classification: string; severity: string } {
  if (score <= 6) return { classification: 'Sono normal', severity: 'normal' };
  if (score <= 8) return { classification: 'Media sonolencia', severity: 'moderate' };
  return { classification: 'Sonolencia anormal', severity: 'severe' };
}

// ─── Slug generation (same logic as api/dentists/route.ts) ───
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ─── Normalize CPF to digits only ───
function normalizeCpf(cpf: string | null): string | null {
  if (!cpf) return null;
  const digits = cpf.replace(/\D/g, '');
  return digits.length === 11 ? digits : null;
}

// ─── Maps for ID resolution ───
const dentistMap = new Map<number, string>(); // old_id → new_uuid
const patientMap = new Map<number, string>(); // old_id → new_uuid
const slugSet = new Set<string>(); // Track used slugs

// ─── Step 1: Migrate Dentists ───
async function migrateDentists(): Promise<void> {
  console.log('\n=== STEP 1: Migrating Dentists ===');

  // Include ALL dentists (even inactive) to preserve patient relationships
  const { rows } = await oldDb.query(`
    SELECT id, username, email, nome_completo, is_active, date_joined
    FROM forms_app_customuser
    ORDER BY id
  `);

  console.log(`Found ${rows.length} active dentists in old DP4`);

  const dentists = rows.map((row: any) => {
    let slug = generateSlug(row.nome_completo || row.username);
    if (!slug || slug.length < 2) slug = generateSlug(row.username);
    // Ensure unique slug
    let finalSlug = slug;
    let suffix = 0;
    while (slugSet.has(finalSlug)) {
      suffix++;
      finalSlug = `${slug}-${suffix}`;
    }
    slugSet.add(finalSlug);

    return {
      name: row.nome_completo || row.username,
      email: row.email,
      phone: null,
      clinic_name: null,
      unique_slug: finalSlug,
      is_active: row.is_active,
      created_at: row.date_joined,
      _old_id: row.id,
    };
  });

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would insert ${dentists.length} dentists`);
    // Still need to build the map for subsequent steps
    let fakeIdx = 0;
    for (const d of dentists) {
      dentistMap.set(d._old_id, `fake-uuid-dentist-${fakeIdx++}`);
    }
    return;
  }

  // Insert one by one to handle duplicate emails gracefully
  let inserted = 0;
  let skipped = 0;
  const seenEmails = new Set<string>();
  for (const dentist of dentists) {
    const { _old_id, ...d } = dentist;
    // Skip duplicate emails within old data
    if (seenEmails.has(d.email)) {
      skipped++;
      continue;
    }
    seenEmails.add(d.email);

    const { error } = await supabase
      .from('dp4_dentists')
      .upsert(d, { onConflict: 'email' });

    if (error) {
      console.error(`Error inserting dentist ${d.email}:`, error.message);
    } else {
      inserted++;
    }
  }

  // Always rebuild the full map from Supabase to handle duplicates and existing records
  const { data: allDbDentists } = await supabase
    .from('dp4_dentists')
    .select('id, email')
    .limit(1000);

  const emailToUuid = new Map<string, string>();
  for (const d of allDbDentists || []) {
    emailToUuid.set(d.email, d.id);
  }

  for (const d of dentists) {
    const uuid = emailToUuid.get(d.email);
    if (uuid) {
      dentistMap.set(d._old_id, uuid);
    }
  }

  console.log(`Dentists: ${inserted} inserted. Map size: ${dentistMap.size} / ${dentists.length}`);
}

// ─── Step 2: Migrate Patients ───
async function migratePatients(): Promise<void> {
  console.log('\n=== STEP 2: Migrating Patients ===');

  const { rows } = await oldDb.query(`
    SELECT p.id, p.dentista_id, p.nome_completo, p.cpf, p.email, p.celular,
           p.data_nascimento, p.data_cadastro, p.atualizado_em
    FROM forms_app_paciente p
    ORDER BY p.id
  `);

  console.log(`Found ${rows.length} patients in old DP4`);

  // Some patients may not have CPF — we need CPF for unique constraint
  let noCpf = 0;
  let noDentist = 0;

  const patients: any[] = [];
  const seenCpfs = new Set<string>();

  for (const row of rows) {
    const newDentistId = dentistMap.get(row.dentista_id);
    if (!newDentistId) {
      noDentist++;
      continue;
    }

    let cpf = normalizeCpf(row.cpf);
    if (!cpf) {
      // Generate a placeholder CPF based on old_id to maintain uniqueness
      cpf = `LEGACY${String(row.id).padStart(8, '0')}`;
      noCpf++;
    }

    // Handle duplicate CPFs (keep first occurrence)
    if (seenCpfs.has(cpf)) {
      cpf = `${cpf}_${row.id}`;
    }
    seenCpfs.add(cpf);

    patients.push({
      dentist_id: newDentistId,
      name: row.nome_completo,
      cpf,
      email: row.email || null,
      phone: row.celular || null,
      dob: row.data_nascimento ? row.data_nascimento.toISOString().split('T')[0] : null,
      created_at: row.data_cadastro,
      updated_at: row.atualizado_em,
      _old_id: row.id,
    });
  }

  console.log(`Patients to migrate: ${patients.length} (${noCpf} without CPF, ${noDentist} without dentist match)`);

  if (DRY_RUN) {
    let fakeIdx = 0;
    for (const p of patients) {
      patientMap.set(p._old_id, `fake-uuid-patient-${fakeIdx++}`);
    }
    return;
  }

  // Insert in batches of 100
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < patients.length; i += 100) {
    const batch = patients.slice(i, i + 100).map(({ _old_id, ...p }) => p);

    const { data, error } = await supabase
      .from('dp4_patients')
      .upsert(batch, { onConflict: 'cpf' })
      .select('id, cpf');

    if (error) {
      console.error(`Error inserting patient batch ${i}:`, error.message);
      errors++;
      continue;
    }

    // Build map: old_id → new_uuid
    for (const newPatient of data || []) {
      const oldPatient = patients.find((p) => p.cpf === newPatient.cpf);
      if (oldPatient) {
        patientMap.set(oldPatient._old_id, newPatient.id);
        inserted++;
      }
    }

    if ((i / 100) % 10 === 0) {
      console.log(`  ... patients batch ${i}/${patients.length}`);
    }
  }

  console.log(`Patients: ${inserted} inserted/updated, ${errors} batch errors. Map size: ${patientMap.size}`);
}

// ─── Step 3: Migrate Submissions (FormResponses + questionnaires) ───
async function migrateSubmissions(): Promise<void> {
  console.log('\n=== STEP 3: Migrating Submissions ===');

  // Get all form responses with JOINed questionnaire data
  const { rows: formResponses } = await oldDb.query(`
    SELECT fr.id, fr.paciente_id, fr.dentista_id, fr.slot, fr.data_criacao
    FROM forms_app_formresponses fr
    ORDER BY fr.id
  `);

  console.log(`Found ${formResponses.length} form responses in old DP4`);

  // Pre-fetch all questionnaire data for batch lookup
  const { rows: allNeuro } = await oldDb.query(`SELECT * FROM forms_app_neuroplasticidade`);
  const { rows: allLipp } = await oldDb.query(`SELECT * FROM forms_app_estresselipp`);
  const { rows: allBrux } = await oldDb.query(`SELECT * FROM forms_app_bruxismozeal`);
  const { rows: allEpw } = await oldDb.query(`SELECT * FROM forms_app_testeepworth`);

  // Index by form_response_id for fast lookup
  const neuroByFr = new Map<number, any>();
  const lippByFr = new Map<number, any>();
  const bruxByFr = new Map<number, any>();
  const epwByFr = new Map<number, any>();

  // Also index by paciente_id as fallback (some may not have form_response_id)
  const neuroByPat = new Map<number, any>();
  const lippByPat = new Map<number, any>();
  const bruxByPat = new Map<number, any>();
  const epwByPat = new Map<number, any>();

  for (const n of allNeuro) {
    if (n.form_response_id) neuroByFr.set(n.form_response_id, n);
    neuroByPat.set(n.paciente_id, n); // last one wins (most recent)
  }
  for (const l of allLipp) {
    if (l.form_response_id) lippByFr.set(l.form_response_id, l);
    lippByPat.set(l.paciente_id, l);
  }
  for (const b of allBrux) {
    if (b.form_response_id) bruxByFr.set(b.form_response_id, b);
    bruxByPat.set(b.paciente_id, b);
  }
  for (const e of allEpw) {
    if (e.form_response_id) epwByFr.set(e.form_response_id, e);
    epwByPat.set(e.paciente_id, e);
  }

  console.log(`Pre-fetched: ${allNeuro.length} neuro, ${allLipp.length} lipp, ${allBrux.length} brux, ${allEpw.length} epworth`);

  // Also get patient data for dados_pessoais and saude_medica JSONB
  const { rows: allPatients } = await oldDb.query(`SELECT * FROM forms_app_paciente`);
  const patientById = new Map<number, any>();
  for (const p of allPatients) patientById.set(p.id, p);

  let noPatient = 0;
  let noDentist = 0;
  let migrated = 0;
  let batchErrors = 0;

  const submissions: any[] = [];

  for (const fr of formResponses) {
    const newPatientId = patientMap.get(fr.paciente_id);
    const newDentistId = dentistMap.get(fr.dentista_id);

    if (!newPatientId) { noDentist++; continue; }
    if (!newDentistId) { noPatient++; continue; }

    const patient = patientById.get(fr.paciente_id);
    const neuro = neuroByFr.get(fr.id) || neuroByPat.get(fr.paciente_id);
    const lipp = lippByFr.get(fr.id) || lippByPat.get(fr.paciente_id);
    const brux = bruxByFr.get(fr.id) || bruxByPat.get(fr.paciente_id);
    const epw = epwByFr.get(fr.id) || epwByPat.get(fr.paciente_id);

    // Build JSONB sections from patient and questionnaire data
    const dadosPessoais = patient ? {
      nome: patient.nome_completo,
      data_nascimento: patient.data_nascimento?.toISOString?.()?.split('T')[0] || null,
      endereco: patient.endereco,
      celular: patient.celular,
      email: patient.email,
      cpf: patient.cpf,
      contato_emergencia: patient.contato_emergencia,
      como_chegou: patient.como_chegou,
    } : {};

    const saudeOral = patient ? {
      tempo_escovando: patient.tempo_escovando,
      mudar_sorriso: patient.mudar_sorriso,
      expectativa_tratamento: patient.expectativa_tratamento,
      dentes_sensiveis: patient.dentes_sensiveis,
      fio_dental: patient.fio_dental,
      tipo_dor: patient.tipo_dor,
      aperta_dentes: patient.aperta_dentes,
      range_dentes: patient.range_dentes,
      dor_cabeca: patient.dor_cabeca,
      tratamento_extracao: patient.tratamento_extracao,
      gosto_ruim: patient.gosto_ruim,
      bochecho_diario: patient.bochecho_diario,
      tratamento_periodontal: patient.tratamento_periodontal,
      tratamento_ortodontico: patient.tratamento_ortodontico,
      estetica_bucal: patient.estetica_bucal,
      experiencia_ruim: patient.experiencia_ruim,
    } : {};

    const saudeMedica = patient ? {
      medicamento_diario: patient.medicamento_diario,
      medicamento_diario_qual: patient.medicamento_diario_qual,
      acorda_durante_noite: patient.acorda_durante_noite,
      acorda_durante_noite_quantas: patient.acorda_durante_noite_quantas,
      banheiro_durante_noite: patient.banheiro_durante_noite,
      banheiro_durante_noite_quantas: patient.banheiro_durante_noite_quantas,
      tratamento_medico: patient.tratamento_medico,
      febre_reumatica: patient.febre_reumatica,
      doencas_articulares: patient.doencas_articulares,
      problemas_coracao: patient.problemas_coracao,
      hipertensao: patient.hipertensao,
      diabetes: patient.diabetes,
      endocardite: patient.endocardite,
      problemas_digestivo: patient.problemas_digestivo,
      dores_cabeca: patient.dores_cabeca,
      bronquite: patient.bronquite,
      tornozelos_inchados: patient.tornozelos_inchados,
      hepatite: patient.hepatite,
      dst: patient.dst,
      catapora: patient.catapora,
      caxumba: patient.caxumba,
      hospitalizado: patient.hospitalizado,
      submetido_cirurgia: patient.submetido_cirurgia,
    } : {};

    const prontuario = patient ? {
      comentario_pessoal: patient.comentario_pessoal,
      alergia_medicamento: patient.alergia_medicamento,
      gravida_amamentando: patient.gravida_amamentando,
      reposicao_hormonal: patient.reposicao_hormonal,
      passou_menopausa: patient.passou_menopausa,
      anticoncepcional: patient.anticoncepcional,
    } : {};

    // Neuroplasticidade JSONB
    const neuroplasticidade = neuro ? {
      queixa_principal: neuro.queixa_principal,
      comentarios_pessoais: neuro.comentarios_pessoais,
      data_inicio: neuro.data_inicio,
      tratamentos_anteriores: neuro.tratamentos_anteriores,
      evacua_diariamente: neuro.evacua_diariamente,
      horario_dormir: neuro.horario_dormir,
      horario_acordar: neuro.horario_acordar,
      desconforto_abdominal: neuro.desconforto_abdominal,
      atividade_fisica: neuro.atividade_fisica,
      frequencia_semana: neuro.frequencia_semana,
      periodo_atividade: neuro.periodo_atividade,
      grau_tensao_ansiedade: neuro.grau_tensao_ansiedade,
    } : {};

    // Pain map JSONB
    const painMap = neuro ? {
      trapezio_direito: neuro.escala_trapezio,
      masseter_direito: neuro.escala_masseterdireito,
      temporal_direito: neuro.escala_temporal_direito,
      temporal_esquerdo: neuro.escala_temporal_esquerdo,
      masseter_esquerdo: neuro.escala_masseter_esquerdo,
      trapezio_esquerdo: neuro.trapezio_esquerdo,
      frontal: neuro.escala_frontal,
      cervical: neuro.escala_cervical,
      frequencia_dor: neuro.frequencia_dor,
      tipo_dor: neuro.tipo_dor,
      comentarios_escala: neuro.comentarios_escala,
    } : {};

    // Orofacial JSONB
    const orofacial = neuro ? {
      dificuldade_mastigar: neuro.dificuldade_mastigar,
      ruido_articulacao: neuro.ruido_articulacao,
      historico_dentes: neuro.historico_dentes,
      historico_sinusite: neuro.historico_sinusite,
      comentarios_secao1: neuro.comentarios_secao1,
    } : {};

    // Sleep disorders JSONB
    const sleepDisorders = neuro ? {
      acorda_cansado: neuro.acorda_cansado,
      problemas_sono: neuro.problemas_sono,
      medicamentos_dormir: neuro.medicamentos_dormir,
      ronca: neuro.ronca,
      deterioracao_diurna: neuro.deterioracao_diurna,
      bruxismo: neuro.bruxismo,
      comentarios_secao2: neuro.comentarios_secao2,
    } : {};

    // Chronic disorders JSONB
    const chronicDisorders = neuro ? {
      dor_cronica: neuro.dor_cronica,
      transtornos_neurais: neuro.transtornos_neurais,
      uso_cronico_meds: neuro.uso_cronico_meds,
      alteracoes_emocionais: neuro.alteracoes_emocionais,
      consumo_gluten_lactose: neuro.consumo_gluten_lactose,
      habitos_consumo: neuro.habitos_consumo,
      comentarios_secao3: neuro.comentarios_secao3,
    } : {};

    // Physical measurements JSONB
    const physicalMeasurements = neuro ? {
      peso: neuro.peso,
      altura: neuro.altura,
      imc: neuro.imc,
      pressao_arterial: neuro.pressao_arterial,
    } : {};

    // Estresse Lipp JSONB + score
    const lippFields = ['tensao_muscular', 'repetir_assunto', 'esquecer_coisas', 'ansiedade',
      'hiperacidez_estomacal', 'disturbio_sono', 'irritabilidade_excessiva', 'cansaco_acordar',
      'vontade_sumir', 'trabalhar_competencia', 'sensacao_incompetencia', 'sensacao_nadavale'];
    const estresseLipp = lipp ? Object.fromEntries(lippFields.map(f => [f, lipp[f]])) : {};
    const lippScore = lipp ? lippFields.reduce((s, f) => s + (lipp[f] || 0), 0) : null;
    const lippClass = lippScore !== null ? classifyLipp(lippScore) : null;

    // Bruxismo JSONB + score
    const bruxFields = ['dor_cabeca_face_pescoco_ombros', 'cansado_desconforto_ao_acordar',
      'dificuldade_dormir', 'usa_medicamento_dormir', 'apertar_ranger_dentes',
      'consumo_estimulantes', 'consumo_gluten_lactose', 'exposicao_telas',
      'condicoes_medicas', 'pessoa_tensa_ansiosa'];
    const grauBruxismo = brux ? Object.fromEntries(bruxFields.map(f => [f, brux[f]])) : {};
    const bruxScore = brux ? bruxFields.reduce((s, f) => s + (brux[f] || 0), 0) : null;
    const bruxClass = bruxScore !== null ? classifyBruxismo(bruxScore) : null;

    // Epworth JSONB + score
    const epwFields = ['sentado_lendo', 'inativo_lugar_publico', 'deitado_tarde',
      'pos_almoco_sem_alcool', 'assistindo_tv', 'passageiro_transporte',
      'conversando_sentado', 'transito_parado'];
    const testeEpworth = epw ? Object.fromEntries(epwFields.map(f => [f, epw[f]])) : {};
    const epwScore = epw ? epwFields.reduce((s, f) => s + (epw[f] || 0), 0) : null;
    const epwClass = epwScore !== null ? classifyEpworth(epwScore) : null;

    submissions.push({
      patient_id: newPatientId,
      dentist_id: newDentistId,
      submission_type: fr.slot === 2 ? 'control' : 'first',
      status: 'completed',
      dados_pessoais: dadosPessoais,
      saude_oral: saudeOral,
      saude_medica: saudeMedica,
      prontuario: prontuario,
      neuroplasticidade: neuroplasticidade,
      pain_map: painMap,
      orofacial: orofacial,
      sleep_disorders: sleepDisorders,
      chronic_disorders: chronicDisorders,
      physical_measurements: physicalMeasurements,
      estresse_lipp: estresseLipp,
      grau_bruxismo: grauBruxismo,
      teste_epworth: testeEpworth,
      lipp_score: lippScore,
      lipp_classification: lippClass?.classification || null,
      bruxism_score: bruxScore,
      bruxism_classification: bruxClass?.classification || null,
      epworth_score: epwScore,
      epworth_classification: epwClass?.classification || null,
      completed_at: fr.data_criacao,
      created_at: fr.data_criacao,
    });
  }

  console.log(`Submissions to migrate: ${submissions.length} (${noPatient} no patient match, ${noDentist} no dentist match)`);

  if (DRY_RUN) {
    // Sample validation: show 5 submissions with scores
    console.log('\n--- Sample submissions ---');
    for (const s of submissions.slice(0, 5)) {
      console.log(`  Type: ${s.submission_type} | Lipp: ${s.lipp_score} (${s.lipp_classification}) | Brux: ${s.bruxism_score} (${s.bruxism_classification}) | Epw: ${s.epworth_score} (${s.epworth_classification})`);
    }
    return;
  }

  // Insert in batches of 50
  for (let i = 0; i < submissions.length; i += 50) {
    const batch = submissions.slice(i, i + 50);
    const { error } = await supabase
      .from('dp4_submissions')
      .insert(batch);

    if (error) {
      console.error(`Error inserting submission batch ${i}:`, error.message);
      batchErrors++;
    } else {
      migrated += batch.length;
    }

    if ((i / 50) % 20 === 0) {
      console.log(`  ... submissions batch ${i}/${submissions.length}`);
    }
  }

  console.log(`Submissions: ${migrated} inserted, ${batchErrors} batch errors`);
}

// ─── Main ───
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`DP4 Migration: Old Django PostgreSQL → New Supabase`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no data will be inserted)' : 'LIVE MIGRATION'}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Test old DB connection
    const { rows: [{ now }] } = await oldDb.query('SELECT NOW() as now');
    console.log(`Old DP4 DB connected: ${now}`);

    // Test Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('dp4_dentists')
      .select('id')
      .limit(1);
    if (testError) throw new Error(`Supabase connection failed: ${testError.message}`);
    console.log(`Supabase connected OK`);

    await migrateDentists();
    await migratePatients();
    await migrateSubmissions();

    // Final counts
    if (!DRY_RUN) {
      console.log('\n=== VERIFICATION ===');
      const { count: dCount } = await supabase.from('dp4_dentists').select('*', { count: 'exact', head: true });
      const { count: pCount } = await supabase.from('dp4_patients').select('*', { count: 'exact', head: true });
      const { count: sCount } = await supabase.from('dp4_submissions').select('*', { count: 'exact', head: true });
      console.log(`dp4_dentists: ${dCount}`);
      console.log(`dp4_patients: ${pCount}`);
      console.log(`dp4_submissions: ${sCount}`);
    }

    console.log('\nMigration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await oldDb.end();
  }
}

main();
