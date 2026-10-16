// src/app/api/deals/[id]/request-correction/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRoles } from '@/server/security/rbac';
import { requestDealCorrection } from '@/server/services/dealService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(req, ['CEO']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const remarks = body.remarks;

    if (!remarks || remarks.trim().length < 5) {
      return NextResponse.json(
        { error: 'Documented correction instructions (minimum 5 characters) are required.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const deal = await requestDealCorrection(id, auth.user, remarks, ip);

    return NextResponse.json({
      success: true,
      message: 'Deal returned to BDM for correction.',
      deal,
    });
  } catch (err: any) {
    console.error('Request correction error:', err);
    return NextResponse.json({ error: err.message || 'Failed to request deal correction.' }, { status: 400 });
  }
}
