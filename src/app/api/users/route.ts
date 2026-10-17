// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRoles } from '@/server/security/rbac';
import { listAllUsers, createUser } from '@/server/services/userService';

export async function GET(req: NextRequest) {
  const auth = await requireRoles(req, ['CEO', 'HR']);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const role = url.searchParams.get('role') || undefined;

  const users = await listAllUsers({ role });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = await requireRoles(req, ['CEO']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const email = body.email;
    const password = body.password;
    const full_name = body.full_name || body.fullName;
    const role = body.role;
    const phone = body.phone;
    const target_deals = body.target_deals ?? body.targetDeals;

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'email, password, full_name, and role are required.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    const newUser = await createUser(
      {
        email,
        password,
        full_name,
        role,
        phone,
        target_deals,
      },
      auth.user,
      ip
    );

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (err: any) {
    console.error('Create user error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create user.' }, { status: 400 });
  }
}
