import { createClient } from '@/lib/supabase/server';

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError('Não autorizado', 401);
  }

  return { user, supabase };
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }
  return Response.json(
    { error: 'Erro interno' },
    { status: 500 }
  );
}
