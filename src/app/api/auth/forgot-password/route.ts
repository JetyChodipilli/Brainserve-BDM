// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/server/db/pool';
import { randomBytes } from 'crypto';
import { checkRateLimit } from '@/server/security/rateLimiter';

/**
 * POST /api/auth/forgot-password
 * Body: { email: string }
 *
 * Generates a one-time reset token, stores it in `password_resets`
 * with a 15-minute expiry, and returns a generic success response.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`forgot_pw_${ip}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many password reset requests. Please try again in ${rateCheck.resetInSeconds} seconds.` },
        { status: 429 }
      );
    }
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Look up the user – if not found return success to prevent email enumeration
    const userRes = await query<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(email) = $1 AND is_active = TRUE`,
      [normalizedEmail]
    );

    if (userRes.rowCount === 0) {
      console.info('Forgot-password request for non-existent email:', normalizedEmail);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const userId = userRes.rows[0].id;
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalidate existing unused tokens for this user
    await query(`UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND used = FALSE`, [userId]);

    // Insert new reset token
    await query(
      `INSERT INTO password_resets (user_id, email, token, expires_at, used)
       VALUES ($1, $2, $3, $4, FALSE)`,
      [userId, normalizedEmail, token, expiresAt]
    );

    console.info(`Password reset token generated for ${normalizedEmail}: ${token}`);

    return NextResponse.json({
      success: true,
      message: 'If the email exists, a reset link has been dispatched.',
      resetToken: token,
      resetUrl: `/reset-password?token=${token}`,
    }, { status: 200 });
  } catch (err) {
    console.error('Forgot-password error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
