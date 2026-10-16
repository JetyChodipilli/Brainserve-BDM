// src/app/api/dashboard/kpis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/security/rbac';
import { getCeoKpis, getBdmKpis, getHrKpis } from '@/server/services/kpiService';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const role = auth.user.role;

    if (role === 'CEO') {
      const kpis = await getCeoKpis();
      return NextResponse.json({ role, kpis });
    }

    if (role === 'BDM') {
      const kpis = await getBdmKpis(auth.user.id);
      return NextResponse.json({ role, kpis });
    }

    if (role === 'HR') {
      const kpis = await getHrKpis();
      return NextResponse.json({ role, kpis });
    }

    return NextResponse.json({ error: 'Unknown role' }, { status: 400 });
  } catch (err: any) {
    console.error('KPIs fetch error:', err);
    return NextResponse.json({ error: 'Failed to compute dashboard KPIs.' }, { status: 500 });
  }
}
