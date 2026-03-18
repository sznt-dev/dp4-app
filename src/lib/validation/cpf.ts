/**
 * Validate a CPF using the official algorithm (mod 11 check digits).
 * Also rejects known invalid patterns (all same digit, sequential).
 */
export function isValidCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;

  // Reject all same digit (111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Reject sequential patterns
  if (clean === '01234567890' || clean === '12345678909') return false;

  // Validate check digits (mod 11)
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(clean.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(clean.charAt(10))) return false;

  return true;
}

/**
 * Validate a phone number.
 * Must have 10-11 digits (with DDD).
 * Rejects all same digit and sequential.
 */
export function isValidPhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 10 || clean.length > 11) return false;

  // Reject all same digit
  if (/^(\d)\1+$/.test(clean)) return false;

  // Reject sequential
  if (clean === '12345678901' || clean === '1234567890') return false;

  // DDD must be 11-99
  const ddd = parseInt(clean.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;

  // If 11 digits, must start with 9 after DDD (mobile)
  if (clean.length === 11 && clean.charAt(2) !== '9') return false;

  return true;
}
