import { type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return await updateSession(request);
  }

  // Run Supabase session update first (handles auth cookies)
  const supabaseResponse = await updateSession(request);

  // Then run intl middleware (handles locale detection + rewrite)
  const intlResponse = intlMiddleware(request);

  // Copy Supabase auth cookies to intl response
  const supabaseCookies = supabaseResponse.headers.getSetCookie?.() || [];
  for (const cookie of supabaseCookies) {
    intlResponse.headers.append('set-cookie', cookie);
  }

  return intlResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
