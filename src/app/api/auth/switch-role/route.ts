// src/app/api/auth/switch-role/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/server/db/pool';
import { createSession, makeSessionCookie } from '@/server/security/auth';
import { recordAuditLog } from '@/server/services/auditService';
import { User } from '@/server/domain/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetEmail } = body;

    const allowedDemoEmails = [
      'ceo@enterprise.edu',
      'hr@enterprise.edu',
      'bdm.vikram@enterprise.edu',
      'bdm.priya@enterprise.edu',
    ];

    if (!targetEmail || !allowedDemoEmails.includes(targetEmail)) {
      return NextResponse.json(
        { error: 'Invalid or unauthorized demo role email.' },
        { status: 400 }
      );
    }

    const userRes = await query<User>(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND is_active = TRUE`,
      [targetEmail]
    );

    if (userRes.rowCount === 0) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    const user = userRes.rows[0];
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || undefined;

    const { token, expiresAt } = await createSession(user.id, ip, userAgent);

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DEMO_ROLE_SWITCH',
      entityName: 'user_session',
      entityId: token,
      ipAddress: ip,
      userAgent,
    });

    const cookieValue = makeSessionCookie(token, expiresAt);

    const redirectPath =
      user.role === 'CEO'
        ? '/ceo/dashboard'
        : user.role === 'HR'
        ? '/hr/dashboard'
        : '/bdm/dashboard';

    const response = NextResponse.json({
      success: true,
      redirectPath,
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
    console.error('Role switch error:', err);
    return NextResponse.json({ error: 'Failed to switch demo role.' }, { status: 500 });
  }
}
