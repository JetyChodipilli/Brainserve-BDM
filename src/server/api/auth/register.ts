// src/server/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { registerUser } from '../../../services/userService';
import { getClientIp } from '../../../utils/ip';
import { verifyRecaptcha } from '../../../utils/recaptcha';
import { logger } from '../../logger';
import { checkRateLimit } from '../../security/rateLimiter';
import { z } from 'zod';

/**
 * Request payload validation schema.
 */
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  role: z.enum(['HR', 'BDM']),
  phone: z.string().optional(),
  recaptchaToken: z.string().optional(),
});

/**
 * Public sign‑up endpoint with server‑side validation, optional reCAPTCHA,
 * rate limiting and structured logging.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const clientIp = getClientIp(req);

  // Rate limiting: 10 requests per minute per IP.
  const rateKey = `${clientIp}:auth-register`;
  const { allowed, remaining, resetInSeconds } = checkRateLimit(rateKey, 10, 60 * 1000);
  if (!allowed) {
    logger.warn(`Rate limit exceeded for ${clientIp}`);
    res.setHeader('Retry-After', resetInSeconds.toString());
    return res.status(429).json({ error: 'Too Many Requests', remaining, retryAfter: resetInSeconds });
  }

  // Validate payload.
  const parseResult = RegisterSchema.safeParse(req.body);
  if (!parseResult.success) {
    logger.warn(`Invalid registration payload from ${clientIp}: ${parseResult.error.message}`);
    return res.status(400).json({ error: 'Invalid request data', details: parseResult.error.format() });
  }
  const { email, password, full_name, role, phone, recaptchaToken } = parseResult.data;

  // Optional reCAPTCHA verification if secret is configured.
  if (process.env.RECAPTCHA_SECRET) {
    if (!recaptchaToken) {
      return res.status(400).json({ error: 'reCAPTCHA token required' });
    }
    try {
      await verifyRecaptcha(recaptchaToken, clientIp);
    } catch (e: any) {
      logger.warn(`reCAPTCHA verification failed for ${clientIp}: ${e.message}`);
      return res.status(400).json({ error: 'reCAPTCHA verification failed' });
    }
  }

  try {
    const user = await registerUser({ email, password, full_name, role, phone }, clientIp);
    const { password_hash, ...safeUser } = user as any;
    logger.info(`User ${email} registered successfully from ${clientIp}`);
    return res.status(201).json({ user: safeUser });
  } catch (err: any) {
    logger.error(`Registration error for ${email}: ${err.message}`);
    const message = err.message || 'Registration failed';
    return res.status(400).json({ error: message });
  }
}
