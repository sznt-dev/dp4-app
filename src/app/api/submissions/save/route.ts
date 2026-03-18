import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { TOTAL_QUESTIONS } from '@/lib/questions';
import { checkRateLimit, getClientId, rateLimitResponse } from '@/lib/security/rate-limit';
import { sanitizeString, sanitizeValue, isValidUUID } from '@/lib/security/validate';

// Fallback dentist ID when none provided
const DEV_DENTIST_ID = '00000000-0000-0000-0000-000000000001';

// Valid JSONB column names (whitelist)
const VALID_COLUMNS = new Set([
  'dados_pessoais', 'saude_oral', 'saude_medica', 'prontuario',
  'neuroplasticidade', 'pain_map', 'orofacial', 'sleep_disorders',
  'chronic_disorders', 'physical_measurements', 'estresse_lipp',
  'grau_bruxismo', 'teste_epworth',
  // Kids columns
  'dados_crianca', 'sono_pediatrico', 'scared', 'ritmo_sono', 'diario_sono',
]);

export async function POST(request: Request) {
  // Rate limit
  const clientId = getClientId(request);
  const rateCheck = checkRateLimit(clientId, 'save');
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);

  try {
    const body = await request.json();

    // Validate and sanitize inputs
    const submissionId = sanitizeString(body.submissionId, 100);
    const questionId = sanitizeString(body.questionId, 100);
    const field = sanitizeString(body.field, 200);
    const value = sanitizeValue(body.value);
    const currentSection = typeof body.currentSection === 'number' ? Math.min(Math.max(body.currentSection, 1), 5) : 1;
    const currentQuestionIndex = typeof body.currentQuestionIndex === 'number' ? Math.max(body.currentQuestionIndex, 0) : 0;
    const answeredQuestions = typeof body.answeredQuestions === 'number' ? Math.max(body.answeredQuestions, 0) : 0;
    const patientName = body.patientName ? sanitizeString(body.patientName, 200) : undefined;
    const patientCpf = body.patientCpf ? sanitizeString(body.patientCpf, 20) : undefined;
    const dentistId = body.dentistId && isValidUUID(body.dentistId) ? body.dentistId : undefined;
    const submissionType = body.submissionType === 'control' ? 'control' : 'first';
    const formType = body.formType === 'kids' ? 'kids' : 'adult';
    const patientIdFromLink = body.patientId && isValidUUID(body.patientId) ? body.patientId : undefined;

    // Validate field format and column whitelist
    const dotIndex = field.indexOf('.');
    const columnName = dotIndex > -1 ? field.substring(0, dotIndex) : field;
    if (columnName !== '_flush' && !VALID_COLUMNS.has(columnName)) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    }

    // Skip flush requests (beforeunload beacon)
    if (questionId === '_flush') {
      return NextResponse.json({ ok: true });
    }

    const activeDentistId = dentistId || DEV_DENTIST_ID;
    const supabase = await createClient();

    const fieldKey = dotIndex > -1 ? field.substring(dotIndex + 1) : null;

    // Check if this is a new submission that needs to be created
    if (submissionId.startsWith('dev-') || submissionId === '') {
      // Create patient if we have CPF
      let patientId: string | null = null;

      if (patientCpf) {
        // Check if patient exists
        const { data: existingPatient } = await supabase
          .from('dp4_patients')
          .select('id')
          .eq('cpf', patientCpf.replace(/\D/g, ''))
          .single();

        if (existingPatient) {
          patientId = existingPatient.id;
        } else if (patientName) {
          const { data: newPatient } = await supabase
            .from('dp4_patients')
            .insert({
              name: patientName,
              cpf: patientCpf.replace(/\D/g, ''),
              dentist_id: activeDentistId,
            })
            .select('id')
            .single();
          patientId = newPatient?.id ?? null;
        }
      }

      // Build initial section data
      const sectionData: Record<string, unknown> = {};
      if (fieldKey) {
        sectionData[fieldKey] = value;
      }

      // For control forms with locked patient, use the provided patient ID
      if (patientIdFromLink && !patientId) {
        patientId = patientIdFromLink;
      }

      const insertData: Record<string, unknown> = {
        dentist_id: activeDentistId,
        patient_id: patientId,
        submission_type: submissionType,
        form_type: formType,
        status: 'in_progress',
        answers_flat: { [questionId]: value },
      };

      // Set the appropriate JSONB column
      if (fieldKey) {
        insertData[columnName] = sectionData;
      } else {
        insertData[columnName] = value;
      }

      const { data: newSubmission, error: createError } = await supabase
        .from('dp4_submissions')
        .insert(insertData)
        .select('id')
        .single();

      if (createError || !newSubmission) {
        console.error('Failed to create submission:', createError);
        return NextResponse.json(
          { error: 'Failed to create submission' },
          { status: 500 }
        );
      }

      // Create progress record
      await supabase.from('dp4_submission_progress').insert({
        submission_id: newSubmission.id,
        current_section: currentSection,
        current_question_index: currentQuestionIndex,
        answered_questions: answeredQuestions,
        total_questions: TOTAL_QUESTIONS,
      });

      // Log form start
      await supabase.from('dp4_logs').insert({
        patient_id: patientId,
        submission_id: newSubmission.id,
        dentist_id: DEV_DENTIST_ID,
        action: 'form_started',
        details: { first_question: questionId },
      });

      return NextResponse.json({
        ok: true,
        submissionId: newSubmission.id,
        patientId,
        created: true,
      });
    }

    // Existing submission — update JSONB + answers_flat + progress
    // Build the JSONB update using Supabase's jsonb merge
    const updateData: Record<string, unknown> = {
      answers_flat: undefined, // will be set below
    };

    // First, get current answers_flat and section data to merge
    const { data: current } = await supabase
      .from('dp4_submissions')
      .select(`answers_flat, patient_id, ${columnName}`)
      .eq('id', submissionId)
      .single();

    if (!current) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentRow = current as any;

    // Merge answers_flat
    const updatedFlat = {
      ...(currentRow.answers_flat as Record<string, unknown> || {}),
      [questionId]: value,
    };
    updateData.answers_flat = updatedFlat;

    // Merge JSONB column
    if (fieldKey) {
      const currentSectionData = (currentRow[columnName] as Record<string, unknown>) || {};
      updateData[columnName] = { ...currentSectionData, [fieldKey]: value };
    } else {
      updateData[columnName] = value;
    }

    // Also link patient if CPF just arrived and submission has no patient yet
    const submissionHasPatient = currentRow.patient_id !== undefined && currentRow.patient_id !== null;
    if (patientCpf && !submissionHasPatient) {
      const cpfClean = patientCpf.replace(/\D/g, '');
      const { data: existingPatient } = await supabase
        .from('dp4_patients')
        .select('id')
        .eq('cpf', cpfClean)
        .single();

      if (existingPatient) {
        updateData.patient_id = existingPatient.id;
      } else {
        // Try to get patient name from answers_flat or patientName param
        const nameForPatient = patientName ||
          (updatedFlat.nome as string) ||
          (updatedFlat.kids_nome_crianca as string) ||
          'Sem nome';
        const { data: newPatient } = await supabase
          .from('dp4_patients')
          .insert({
            name: nameForPatient,
            cpf: cpfClean,
            dentist_id: activeDentistId,
          })
          .select('id')
          .single();
        if (newPatient) {
          updateData.patient_id = newPatient.id;
        }
      }
    }

    const { error: updateError } = await supabase
      .from('dp4_submissions')
      .update(updateData)
      .eq('id', submissionId);

    if (updateError) {
      console.error('Failed to update submission:', updateError);
      return NextResponse.json(
        { error: 'Failed to save' },
        { status: 500 }
      );
    }

    // Update progress
    await supabase
      .from('dp4_submission_progress')
      .update({
        current_section: body.currentSection,
        current_question_index: currentQuestionIndex,
        answered_questions: answeredQuestions,
        last_answer_at: new Date().toISOString(),
      })
      .eq('submission_id', submissionId);

    return NextResponse.json({ ok: true, submissionId });
  } catch (error) {
    console.error('Auto-save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
