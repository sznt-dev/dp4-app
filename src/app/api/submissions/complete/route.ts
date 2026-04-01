import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkRateLimit, getClientId, rateLimitResponse } from '@/lib/security/rate-limit';
import { isValidUUID, sanitizeString } from '@/lib/security/validate';
import { sendWebhookToDeya } from '@/lib/webhook-deya';

export async function POST(request: Request) {
  // Rate limit
  const clientId = getClientId(request);
  const rateCheck = checkRateLimit(clientId, 'api');
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);

  try {
    const body = await request.json();
    const submissionId = sanitizeString(body.submissionId, 100);

    // Validate and sanitize scores
    const rawScores = body.scores || {};
    const scores = {
      lipp_score: typeof rawScores.lipp_score === 'number' ? Math.min(Math.max(rawScores.lipp_score, 0), 12) : undefined,
      lipp_classification: typeof rawScores.lipp_classification === 'string' ? sanitizeString(rawScores.lipp_classification, 50) : undefined,
      bruxism_score: typeof rawScores.bruxism_score === 'number' ? Math.min(Math.max(rawScores.bruxism_score, 0), 20) : undefined,
      bruxism_classification: typeof rawScores.bruxism_classification === 'string' ? sanitizeString(rawScores.bruxism_classification, 50) : undefined,
      epworth_score: typeof rawScores.epworth_score === 'number' ? Math.min(Math.max(rawScores.epworth_score, 0), 24) : undefined,
      epworth_classification: typeof rawScores.epworth_classification === 'string' ? sanitizeString(rawScores.epworth_classification, 50) : undefined,
    };

    if (!submissionId || !isValidUUID(submissionId)) {
      return NextResponse.json(
        { error: 'submissionId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update submission to completed
    const { error: updateError } = await supabase
      .from('dp4_submissions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        ...scores,
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Failed to complete submission:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete' },
        { status: 500 }
      );
    }

    // Delete progress record (no longer needed)
    await supabase
      .from('dp4_submission_progress')
      .delete()
      .eq('submission_id', submissionId);

    // Get submission for logging
    const { data: submission } = await supabase
      .from('dp4_submissions')
      .select('patient_id, dentist_id')
      .eq('id', submissionId)
      .single();

    // Log completion
    await supabase.from('dp4_logs').insert({
      patient_id: submission?.patient_id,
      submission_id: submissionId,
      dentist_id: submission?.dentist_id,
      action: 'form_completed',
      details: scores,
    });

    // Send webhook to DEYA (async, doesn't block response)
    if (submission?.patient_id && submission?.dentist_id) {
      const { data: fullSubmission } = await supabase
        .from('dp4_submissions')
        .select('*, dp4_patients!patient_id(*), dp4_dentists!dentist_id(*)')
        .eq('id', submissionId)
        .single();

      if (fullSubmission) {
        sendWebhookToDeya(fullSubmission as any).catch((err) => {
          console.error('DEYA webhook failed (non-blocking):', err);
          // Log the failure
          supabase.from('dp4_logs').insert({
            patient_id: submission.patient_id,
            submission_id: submissionId,
            dentist_id: submission.dentist_id,
            action: 'webhook_sent',
            details: { error: err.message, target: 'deya' },
          });
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Complete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
