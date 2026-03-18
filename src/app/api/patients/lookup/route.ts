import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { CPFLookupResponse } from '@/types';
import { checkRateLimit, getClientId, rateLimitResponse } from '@/lib/security/rate-limit';
import { validateCPF } from '@/lib/security/validate';

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

function isValidCpf(cpf: string): boolean {
  const clean = normalizeCpf(cpf);
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;
  return true;
}

export async function POST(request: Request) {
  // Rate limit — 10 lookups per minute per IP
  const clientId = getClientId(request);
  const rateCheck = checkRateLimit(clientId, 'lookup');
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);

  try {
    const body = await request.json();
    const cpf = typeof body.cpf === 'string' ? body.cpf.slice(0, 20) : '';

    if (!cpf || !isValidCpf(cpf)) {
      return NextResponse.json(
        { status: 'new' } satisfies CPFLookupResponse,
        { status: 200 }
      );
    }

    const cleanCpf = normalizeCpf(cpf);
    const supabase = await createClient();

    // Find patient by CPF
    const { data: patient } = await supabase
      .from('dp4_patients')
      .select('id, name')
      .eq('cpf', cleanCpf)
      .single();

    if (!patient) {
      return NextResponse.json(
        { status: 'new' } satisfies CPFLookupResponse
      );
    }

    // Find latest submission for this patient
    const { data: submission } = await supabase
      .from('dp4_submissions')
      .select('id, status, completed_at, answers_flat, created_at')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!submission) {
      return NextResponse.json({
        status: 'new',
        patientId: patient.id,
      } satisfies CPFLookupResponse);
    }

    // Case: in_progress → offer resume
    if (submission.status === 'in_progress') {
      const { data: progress } = await supabase
        .from('dp4_submission_progress')
        .select('*')
        .eq('submission_id', submission.id)
        .single();

      return NextResponse.json({
        status: 'incomplete',
        patientId: patient.id,
        submissionId: submission.id,
        progress: progress ?? undefined,
        savedAnswers: (submission.answers_flat as Record<string, unknown>) ?? {},
      } satisfies CPFLookupResponse);
    }

    // Case: completed → always block (patient must talk to dentist for control/redo)
    if (submission.status === 'completed' && submission.completed_at) {
      return NextResponse.json({
        status: 'blocked',
        patientId: patient.id,
        completedAt: submission.completed_at,
      } satisfies CPFLookupResponse);
    }

    // Fallback: treat as new
    return NextResponse.json({
      status: 'new',
      patientId: patient.id,
    } satisfies CPFLookupResponse);
  } catch (error) {
    console.error('CPF lookup error:', error);
    return NextResponse.json(
      { status: 'new' } satisfies CPFLookupResponse
    );
  }
}
