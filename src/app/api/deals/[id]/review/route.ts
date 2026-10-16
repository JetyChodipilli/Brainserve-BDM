// src/app/api/deals/[id]/review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRoles } from '@/server/security/rbac';
import { reviewDeal } from '@/server/services/dealService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(req, ['CEO']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const deal = await reviewDeal(id, auth.user, ip);

    return NextResponse.json({
      success: true,
      message: 'Deal is now under executive review.',
      deal,
    });
  } catch (err: any) {
    console.error('Review deal error:', err);
    return NextResponse.json({ error: err.message || 'Failed to initiate deal review.' }, { status: 400 });
  }
}
