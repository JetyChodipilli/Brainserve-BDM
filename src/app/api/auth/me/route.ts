// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/security/rbac';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: auth.user.id,
      email: auth.user.email,
      full_name: auth.user.full_name,
      role: auth.user.role,
      phone: auth.user.phone,
    },
  });
}
