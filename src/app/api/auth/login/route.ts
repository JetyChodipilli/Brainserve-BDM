// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/server/db/pool';
import { verifyPassword, createSession, makeSessionCookie } from '@/server/security/auth';
import { checkRateLimit, resetRateLimit } from '@/server/security/rateLimiter';
import { recordAuditLog } from '@/server/services/auditService';
import speakeasy from 'speakeasy';
import { User } from '@/server/domain/types';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `login_${ip}`;
    const rateCheck = checkRateLimit(rateLimitKey, 20, 15 * 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Please try again in ${rateCheck.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password, mfaToken } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const userRes = await query<User & { password_hash: string }>(
      `SELECT * FROM users WHERE LOWER(email) = $1 AND is_active = TRUE`,
      [normalizedEmail]
    );

    if (userRes.rowCount === 0) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const user = userRes.rows[0];
    const passwordMatch = await verifyPassword(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // CEO MFA verification (enforced when MFA secret is provisioned)
    if (user.role === 'CEO' && user.mfa_secret) {
      if (!mfaToken) {
        return NextResponse.json({ error: 'MFA token required for CEO login.', mfaRequired: true }, { status: 401 });
      }
      const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token: String(mfaToken),
        window: 1,
      });
      if (!verified) {
        return NextResponse.json({ error: 'Invalid MFA token.' }, { status: 401 });
      }
    }
    // Reset rate limiter on successful authentication
    resetRateLimit(rateLimitKey);

    // Create session
    const userAgent = req.headers.get('user-agent') || undefined;
    const { token, expiresAt } = await createSession(user.id, ip, userAgent);

    // Audit log
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN_SUCCESS',
      entityName: 'user_session',
      entityId: token,
      ipAddress: ip,
      userAgent,
    });

    const cookieValue = makeSessionCookie(token, expiresAt);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });

    response.headers.set('Set-Cookie', cookieValue);
    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error during authentication.' }, { status: 500 });
  }
}
