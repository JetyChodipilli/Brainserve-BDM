// src/app/api/hr-tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRoles } from '@/server/security/rbac';
import { updateHRTask } from '@/server/services/hrTaskService';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(req, ['HR', 'CEO']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, assigned_to, due_date, internal_notes } = body;

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const updated = await updateHRTask(
      id,
      {
        status,
        assigned_to,
        due_date,
        internal_notes,
      },
      auth.user,
      ip
    );

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Update task error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update task.' }, { status: 400 });
  }
}
