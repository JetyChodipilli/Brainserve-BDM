// src/app/api/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/security/rbac';
import { markNotificationAsRead } from '@/server/services/notificationService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const success = await markNotificationAsRead(id, auth.user.id);

  return NextResponse.json({ success });
}
