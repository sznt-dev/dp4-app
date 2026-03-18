import { createClient } from '@/lib/supabase/server';
import { generateSubmissionPDF } from '@/lib/pdf/generate-pdf';
import { mapSubmissionToSections } from '@/lib/pdf/map-submission';
import { checkRateLimit, getClientId, rateLimitResponse } from '@/lib/security/rate-limit';
import { isValidUUID } from '@/lib/security/validate';
import { requireAuth, authErrorResponse } from '@/lib/auth';

export async function GET(request: Request) {
  // Rate limit + auth
  const clientId = getClientId(request);
  const rateCheck = checkRateLimit(clientId, 'api');
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);
  try { await requireAuth(); } catch (e) { return authErrorResponse(e); }

  try {
    const url = new URL(request.url);
    const submissionId = url.searchParams.get('id');

    if (!submissionId || !isValidUUID(submissionId)) {
      return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });
    }

    const supabase = await createClient();

    // Get submission
    const { data: submission } = await supabase
      .from('dp4_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (!submission) {
      return new Response(JSON.stringify({ error: 'Submission não encontrada' }), { status: 404 });
    }

    // Get patient
    const { data: patient } = await supabase
      .from('dp4_patients')
      .select('name, cpf')
      .eq('id', submission.patient_id)
      .single();

    // Get dentist
    const { data: dentist } = await supabase
      .from('dp4_dentists')
      .select('name, clinic_name')
      .eq('id', submission.dentist_id)
      .single();

    // Map sections
    const sections = mapSubmissionToSections(submission);

    // Build scores
    const scores: Record<string, { score: number; maxScore: number; classification: string }> = {};
    if (submission.lipp_score !== null) {
      scores.lipp = { score: submission.lipp_score, maxScore: 12, classification: submission.lipp_classification || '' };
    }
    if (submission.bruxism_score !== null) {
      scores.bruxismo = { score: submission.bruxism_score, maxScore: 20, classification: submission.bruxism_classification || '' };
    }
    if (submission.epworth_score !== null) {
      scores.epworth = { score: submission.epworth_score, maxScore: 24, classification: submission.epworth_classification || '' };
    }

    const pdfBuffer = await generateSubmissionPDF({
      patientName: patient?.name || 'Sem nome',
      patientCpf: patient?.cpf || '',
      dentistName: dentist?.name || 'Sem dentista',
      clinicName: dentist?.clinic_name || undefined,
      submissionType: submission.submission_type || 'first',
      completedAt: submission.completed_at || submission.created_at,
      sections,
      scores,
    });

    const fileName = `DP4_${(patient?.name || 'paciente').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(JSON.stringify({ error: 'Erro ao gerar PDF' }), { status: 500 });
  }
}
