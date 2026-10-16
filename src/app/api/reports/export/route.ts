// src/app/api/reports/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/security/rbac';
import { exportDealsToCsv } from '@/server/services/exportService';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;
    const collegeId = url.searchParams.get('collegeId') || undefined;
    const bdmId = url.searchParams.get('bdmId') || undefined;
    const category = url.searchParams.get('category') || undefined;

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    const { csvContent, filename } = await exportDealsToCsv(
      auth.user,
      { status, collegeId, bdmId, category },
      ip
    );

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Failed to generate export file.' }, { status: 500 });
  }
}
