// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRoles } from '@/server/security/rbac';
import { updateUser } from '@/server/services/userService';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(req, ['CEO']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const { full_name, phone, is_active, password } = body;

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    const updated = await updateUser(
      id,
      {
        full_name,
        phone,
        is_active,
        password,
      },
      auth.user,
      ip
    );

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error('Update user error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update user.' }, { status: 400 });
  }
}
