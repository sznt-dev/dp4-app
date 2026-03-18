/**
 * In-memory rate limiter for API routes.
 * Protects against brute-force attacks, bots, and request flooding.
 *
 * In production with multiple instances, replace with Redis-based solution.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

const PRESETS = {
  /** Login: 5 attempts per minute */
  auth: { limit: 5, windowSeconds: 60 },
  /** Form auto-save: 60 per minute (one per second avg) */
  save: { limit: 60, windowSeconds: 60 },
  /** CPF lookup: 10 per minute */
  lookup: { limit: 10, windowSeconds: 60 },
  /** General API: 30 per minute */
  api: { limit: 30, windowSeconds: 60 },
  /** Admin APIs: 20 per minute */
  admin: { limit: 20, windowSeconds: 60 },
} as const;

export type RateLimitPreset = keyof typeof PRESETS;

/**
 * Check rate limit for a given identifier.
 * Returns { allowed: true } or { allowed: false, retryAfterSeconds }.
 */
export function checkRateLimit(
  identifier: string,
  preset: RateLimitPreset
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const config: RateLimitConfig = PRESETS[preset];
  const key = `${preset}:${identifier}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { allowed: true };
  }

  if (entry.count >= config.limit) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * Extract client identifier from request.
 * Uses X-Forwarded-For (behind proxy/Traefik) or falls back.
 */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Fallback for local development
  return 'localhost';
}

/**
 * Rate limit response helper.
 */
export function rateLimitResponse(retryAfterSeconds: number) {
  return new Response(
    JSON.stringify({ error: 'Muitas requisições. Tente novamente em breve.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
      },
    }
  );
}
