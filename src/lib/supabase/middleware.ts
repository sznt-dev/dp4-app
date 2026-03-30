import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { locales } from '@/i18n/config';

// Routes that don't require authentication (without locale prefix)
// API routes handle their own auth via requireAuth() -- middleware just manages browser redirects
const PUBLIC_ROUTES = ['/login', '/d/', '/api/'];

/**
 * Strip locale prefix from pathname for route matching.
 * e.g. /en/dashboard -> /dashboard, /pt-br/login -> /login
 */
function stripLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.slice(`/${locale}`.length) || '/';
    }
  }
  return pathname;
}

function isPublicRoute(pathname: string): boolean {
  const stripped = stripLocale(pathname);
  return PUBLIC_ROUTES.some((route) => stripped.startsWith(route)) || stripped === '/';
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const strippedPath = stripLocale(pathname);

  // Public routes -- no auth needed
  if (isPublicRoute(pathname)) {
    // If authenticated and trying to access login, redirect to dashboard
    if (user && strippedPath === '/login') {
      const url = request.nextUrl.clone();
      // Preserve locale prefix if present
      const localePrefix = pathname !== strippedPath ? pathname.split('/')[1] : '';
      url.pathname = localePrefix ? `/${localePrefix}/dashboard` : '/dashboard';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Protected routes -- require auth
  if (!user) {
    const url = request.nextUrl.clone();
    // Preserve locale prefix if present
    const localePrefix = pathname !== strippedPath ? pathname.split('/')[1] : '';
    url.pathname = localePrefix ? `/${localePrefix}/login` : '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
