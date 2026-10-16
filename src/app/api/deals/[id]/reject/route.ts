// src/app/api/deals/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRoles } from '@/server/security/rbac';
import { rejectDeal } from '@/server/services/dealService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(req, ['CEO']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const reason = body.reason;

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: 'Documented rejection reason (minimum 5 characters) is required.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const deal = await rejectDeal(id, auth.user, reason, ip);

    return NextResponse.json({
      success: true,
      message: 'Deal rejected. BDM notified with rejection reason.',
      deal,
    });
  } catch (err: any) {
    console.error('Reject deal error:', err);
    return NextResponse.json({ error: err.message || 'Failed to reject deal.' }, { status: 400 });
  }
}
