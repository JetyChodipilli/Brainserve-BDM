// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/server/db/pool';
import bcrypt from 'bcryptjs';

/**
 * POST /api/auth/reset-password
 * Body: { token: string, newPassword: string }
 *
 * Verifies the reset token, checks expiry, updates the user's password, and
 * marks the token as used. Returns a generic success response.
 */
export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required.' }, { status: 400 });
    }

    // Find the reset record by token hash (compare using bcrypt).
    const resetRes = await query<{ id: string; user_id: string; token_hash: string; expires_at: Date; used: boolean }>(
      `SELECT * FROM password_resets WHERE used = FALSE AND expires_at > NOW()`
    );

    // Find matching record.
    let match = null;
    for (const row of resetRes.rows) {
      const matchResult = await bcrypt.compare(token, row.token_hash);
      if (matchResult) {
        match = row;
        break;
      }
    }
    if (!match) {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 400 });
    }

    // Hash the new password.
    const newHash = await bcrypt.hash(newPassword, 10);

    // Update user's password.
    await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [newHash, match.user_id]);

    // Mark token as used.
    await query(`UPDATE password_resets SET used = TRUE WHERE id = $1`, [match.id]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Reset‑password error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
