// src/utils/recaptcha.ts
/**
 * Verifies a Google reCAPTCHA token server‑side.
 * Returns true if the verification succeeds, otherwise throws.
 */
export async function verifyRecaptcha(token: string, clientIp?: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) {
    // In non‑production environments we may skip verification
    console.warn('RECAPTCHA_SECRET not set – skipping verification');
    return true;
  }
  const params = new URLSearchParams({
    secret,
    response: token,
  });
  if (clientIp) {
    params.append('remoteip', clientIp);
  }
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!response.ok) {
    throw new Error('Failed to verify reCAPTCHA');
  }
  const data = await response.json();
  if (!data.success) {
    const errorCodes = data['error-codes']?.join(', ') ?? 'unknown';
    throw new Error(`reCAPTCHA verification failed: ${errorCodes}`);
  }
  return true;
}
