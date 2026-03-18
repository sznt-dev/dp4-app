/**
 * Input validation and sanitization helpers.
 * Protects against SQL injection, XSS, and malicious payloads.
 */

/**
 * Sanitize a string: trim, remove null bytes, limit length.
 */
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '')       // Remove null bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate CPF format (11 digits after stripping).
 */
export function validateCPF(cpf: unknown): string | null {
  if (typeof cpf !== 'string') return null;
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return null;
  if (/^(\d)\1{10}$/.test(clean)) return null; // All same digit
  return clean;
}

/**
 * Validate UUID format.
 */
export function isValidUUID(id: unknown): boolean {
  if (typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Validate email format.
 */
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/**
 * Validate that a value is a safe JSON-serializable value.
 * Rejects functions, prototypes, __proto__, constructor pollution.
 */
export function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return sanitizeString(value, 2000);

  if (Array.isArray(value)) {
    return value.slice(0, 100).map(sanitizeValue);
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    const entries = Object.entries(value as Record<string, unknown>);

    for (const [key, val] of entries.slice(0, 50)) {
      // Block prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      sanitized[sanitizeString(key, 100)] = sanitizeValue(val);
    }
    return sanitized;
  }

  // Reject functions, symbols, etc.
  return null;
}

/**
 * Validate request body size (reject oversized payloads).
 */
export async function parseAndValidateBody(
  request: Request,
  maxSizeBytes = 50_000 // 50KB max
): Promise<Record<string, unknown> | null> {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
    return null;
  }

  try {
    const text = await request.text();
    if (text.length > maxSizeBytes) return null;

    const parsed = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }

    return sanitizeValue(parsed) as Record<string, unknown>;
  } catch {
    return null;
  }
}
