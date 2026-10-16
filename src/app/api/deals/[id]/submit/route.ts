// src/app/api/deals/[id]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRoles } from '@/server/security/rbac';
import { submitDeal } from '@/server/services/dealService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(req, ['BDM']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const deal = await submitDeal(id, auth.user, ip);

    return NextResponse.json({
      success: true,
      message: 'Deal submitted successfully for executive review.',
      deal,
    });
  } catch (err: any) {
    console.error('Submit deal error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit deal.' }, { status: 400 });
  }
}
