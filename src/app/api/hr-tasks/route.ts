// src/app/api/hr-tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRoles } from '@/server/security/rbac';
import { listHRTasks, createHRTask } from '@/server/services/hrTaskService';

export async function GET(req: NextRequest) {
  const auth = await requireRoles(req, ['HR', 'CEO']);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || undefined;
  const assignedTo = url.searchParams.get('assignedTo') || undefined;
  const dealId = url.searchParams.get('dealId') || undefined;
  const collegeId = url.searchParams.get('collegeId') || undefined;
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const data = await listHRTasks({
    status,
    assignedTo,
    dealId,
    collegeId,
    limit,
    offset,
  });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireRoles(req, ['HR', 'CEO']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { deal_id, college_id, title, description, assigned_to, due_date, internal_notes } = body;

    if (!deal_id || !college_id || !title) {
      return NextResponse.json(
        { error: 'deal_id, college_id, and title are required.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const task = await createHRTask(
      {
        deal_id,
        college_id,
        title,
        description,
        assigned_to,
        due_date,
        internal_notes,
      },
      auth.user,
      ip
    );

    return NextResponse.json(task, { status: 201 });
  } catch (err: any) {
    console.error('Create task error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create HR task.' }, { status: 400 });
  }
}
