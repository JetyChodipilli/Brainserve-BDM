// src/app/api/audit-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRoles } from '@/server/security/rbac';
import { listAuditLogs } from '@/server/services/auditService';

export async function GET(req: NextRequest) {
  const auth = await requireRoles(req, ['CEO']);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const entityName = url.searchParams.get('entity') || undefined;
  const entityId = url.searchParams.get('entityId') || undefined;
  const actorId = url.searchParams.get('actorId') || undefined;
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const result = await listAuditLogs({
    entityName,
    entityId,
    actorId,
    limit,
    offset,
  });

  return NextResponse.json(result);
}
