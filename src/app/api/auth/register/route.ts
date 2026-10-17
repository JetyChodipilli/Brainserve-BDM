// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/server/db/pool';
import { hashPassword } from '@/server/security/auth';
import { recordAuditLog } from '@/server/services/auditService';
import { checkRateLimit } from '@/server/security/rateLimiter';

export async function GET() {
  try {
    const ceoCountRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM users WHERE role = 'CEO' AND is_active = TRUE`
    );
    const hasCeo = parseInt(ceoCountRes.rows[0]?.count || '0', 10) > 0;
    return NextResponse.json({ hasCeo });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to check registration status.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `register_${ip}`;
    const rateCheck = checkRateLimit(rateLimitKey, 15, 15 * 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { full_name, fullName, email, password, role, phone } = body;
    const name = (full_name || fullName || '').trim();
    const mail = (email || '').trim().toLowerCase();
    const userRole = (role || '').trim().toUpperCase();

    if (!name || !mail || !password || !userRole) {
      return NextResponse.json(
        { error: 'Full name, email address, password, and role are required.' },
        { status: 400 }
      );
    }

    if (!['CEO', 'HR', 'BDM'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Invalid role selected. Allowed roles are CEO, HR, or BDM.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // Single CEO Constraint
    if (userRole === 'CEO') {
      const existingCeoRes = await query<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM users WHERE role = 'CEO' AND is_active = TRUE`
      );
      const ceoCount = parseInt(existingCeoRes.rows[0]?.count || '0', 10);
      if (ceoCount > 0) {
        return NextResponse.json(
          {
            error:
              'A Chief Executive Officer (CEO) account has already been registered for this organization. Only one CEO account is permitted. Please register as HR or BDM, or contact your administrator.',
          },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const existingEmailRes = await query<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(email) = $1`,
      [mail]
    );
    if (existingEmailRes.rowCount && existingEmailRes.rowCount > 0) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in or use Forgot Password.' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const passwordHash = await hashPassword(password);

    // Insert user
    const insertRes = await query<{
      id: string;
      email: string;
      full_name: string;
      role: string;
      phone: string | null;
      created_at: string;
    }>(
      `INSERT INTO users (email, password_hash, full_name, role, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, email, full_name, role, phone, created_at`,
      [mail, passwordHash, name, userRole, phone || null]
    );

    const newUser = insertRes.rows[0];

    // If BDM, initialize business target row
    if (userRole === 'BDM') {
      const currentYear = new Date().getFullYear().toString();
      await query(
        `INSERT INTO business_targets (user_id, period, target_deals_count)
         VALUES ($1, $2, 10)
         ON CONFLICT (user_id, period) DO NOTHING`,
        [newUser.id, currentYear]
      );
    }

    // Audit log
    await recordAuditLog({
      actorId: newUser.id,
      actorEmail: newUser.email,
      actorRole: newUser.role,
      action: 'USER_REGISTERED',
      entityName: 'users',
      entityId: newUser.id,
      newState: { email: newUser.email, role: newUser.role, full_name: newUser.full_name },
      ipAddress: ip,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account registered successfully. You can now sign in.',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during registration.' },
      { status: 500 }
    );
  }
}
