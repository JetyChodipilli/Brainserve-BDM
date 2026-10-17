// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/server/db/pool';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

/**
 * POST /api/auth/forgot-password
 * Body: { email: string }
 *
 * Generates a one‑time reset token, stores a hash of it in `password_resets`
 * with a 15‑minute expiry, and returns a generic success response. In a real
 * implementation the token would be emailed to the user – here we just log it
 * for development purposes.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // Look up the user – if not found we still return success to avoid enumeration.
    const userRes = await query<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(email) = $1 AND is_active = TRUE`,
      [String(email).trim().toLowerCase()]
    );
    if (userRes.rowCount === 0) {
      // Pretend we sent an email.
      console.info('Forgot‑password request for non‑existent email:', email);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const userId = userRes.rows[0].id;
    const token = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Insert (or upsert) the password reset record.
    await query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at, used)
       VALUES ($1, $2, $3, FALSE)
       ON CONFLICT (user_id) DO UPDATE SET token_hash = $2, expires_at = $3, used = FALSE`,
      [userId, tokenHash, expiresAt]
    );

    // Stub: log the token – replace with real email delivery.
    console.info(`Password reset token for ${email}: ${token}`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Forgot‑password error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
