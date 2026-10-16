// src/app/api/deals/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRoles } from '@/server/security/rbac';
import { approveDeal } from '@/server/services/dealService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(req, ['CEO']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const remarks = body.remarks;

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const deal = await approveDeal(id, auth.user, remarks, ip);

    return NextResponse.json({
      success: true,
      message: 'Deal approved successfully. Operational onboarding tasks dispatched.',
      deal,
    });
  } catch (err: any) {
    console.error('Approve deal error:', err);
    return NextResponse.json({ error: err.message || 'Failed to approve deal.' }, { status: 400 });
  }
}
