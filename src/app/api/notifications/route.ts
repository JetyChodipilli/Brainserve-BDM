// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/security/rbac';
import { getUserNotifications, getUnreadCount } from '@/server/services/notificationService';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  const notifications = await getUserNotifications(auth.user.id, limit);
  const unreadCount = await getUnreadCount(auth.user.id);

  return NextResponse.json({ notifications, unreadCount });
}
