// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/server/db/pool';
import { hashPassword } from '@/server/security/auth';

/**
 * POST /api/auth/reset-password
 * Body: { token: string, newPassword: string }
 *
 * Verifies the reset token, checks expiry, updates the user's password, and
 * marks the token as used.
 */
export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required.' }, { status: 400 });
    }

    if (String(newPassword).length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    // Find the valid reset record
    const resetRes = await query<{ id: string; user_id: string; expires_at: Date; used: boolean }>(
      `SELECT id, user_id FROM password_resets WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
      [token]
    );

    if (resetRes.rowCount === 0) {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 400 });
    }

    const resetRecord = resetRes.rows[0];
    const newHash = await hashPassword(newPassword);

    // Update user's password
    await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [
      newHash,
      resetRecord.user_id,
    ]);

    // Mark token as used
    await query(`UPDATE password_resets SET used = TRUE WHERE id = $1`, [resetRecord.id]);

    return NextResponse.json({ success: true, message: 'Password has been successfully reset.' }, { status: 200 });
  } catch (err) {
    console.error('Reset-password error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
