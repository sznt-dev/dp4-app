import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkRateLimit, getClientId, rateLimitResponse } from '@/lib/security/rate-limit';
import { sanitizeString, isValidEmail, isValidUUID } from '@/lib/security/validate';
import { requireAuth, authErrorResponse } from '@/lib/auth';

export async function GET(request: Request) {
  // Rate limit
  const clientId = getClientId(request);
  const rateCheck = checkRateLimit(clientId, 'admin');
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);

  // Require authentication
  try { await requireAuth(); } catch (e) { return authErrorResponse(e); }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('dp4_dentists')
      .select(`
        id, name, email, phone, clinic_name, unique_slug, is_active, created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get patient counts per dentist
    const dentistIds = (data || []).map((d) => d.id);
    const { data: patientCounts } = await supabase
      .from('dp4_patients')
      .select('dentist_id')
      .in('dentist_id', dentistIds);

    const countMap = new Map<string, number>();
    for (const p of patientCounts || []) {
      countMap.set(p.dentist_id, (countMap.get(p.dentist_id) || 0) + 1);
    }

    const enriched = (data || []).map((d) => ({
      ...d,
      patient_count: countMap.get(d.id) || 0,
    }));

    return NextResponse.json(enriched);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Rate limit + auth
  const clientId = getClientId(request);
  const rateCheck = checkRateLimit(clientId, 'admin');
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);
  try { await requireAuth(); } catch (e) { return authErrorResponse(e); }

  try {
    const body = await request.json();
    const name = sanitizeString(body.name, 200);
    const email = sanitizeString(body.email, 254);
    const phone = body.phone ? sanitizeString(body.phone, 20) : null;
    const clinic_name = body.clinic_name ? sanitizeString(body.clinic_name, 200) : null;

    if (!name || !email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Auto-generate slug from name: "Dr. João Silva" → "dr-joao-silva"
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    // Check for slug conflicts and add suffix if needed
    let slug = baseSlug;
    let suffix = 0;
    while (true) {
      const { data: existing } = await supabase
        .from('dp4_dentists')
        .select('id')
        .eq('unique_slug', slug)
        .single();
      if (!existing) break;
      suffix++;
      slug = `${baseSlug}-${suffix}`;
    }

    const { data, error } = await supabase
      .from('dp4_dentists')
      .insert({ name, email, phone, clinic_name, unique_slug: slug })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  // Rate limit + auth
  const clientId2 = getClientId(request);
  const rateCheck2 = checkRateLimit(clientId2, 'admin');
  if (!rateCheck2.allowed) return rateLimitResponse(rateCheck2.retryAfterSeconds);
  try { await requireAuth(); } catch (e) { return authErrorResponse(e); }

  try {
    const body = await request.json();
    const id = sanitizeString(body.id, 100);

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Only allow specific safe fields to be updated
    const safeUpdates: Record<string, unknown> = {};
    if (typeof body.is_active === 'boolean') safeUpdates.is_active = body.is_active;
    if (body.name) safeUpdates.name = sanitizeString(body.name, 200);
    if (body.phone) safeUpdates.phone = sanitizeString(body.phone, 20);
    if (body.clinic_name) safeUpdates.clinic_name = sanitizeString(body.clinic_name, 200);

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('dp4_dentists')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
