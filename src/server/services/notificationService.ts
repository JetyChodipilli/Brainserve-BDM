// src/server/services/notificationService.ts
import { query } from '../db/pool';
import { Notification, UserRole } from '../domain/types';

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  category: string;
  referenceId?: string | null;
  referenceType?: string | null;
}): Promise<void> {
  await query(
    `INSERT INTO notifications (user_id, title, message, category, reference_id, reference_type, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [
      params.userId,
      params.title,
      params.message,
      params.category,
      params.referenceId || null,
      params.referenceType || null,
    ]
  );
}

export async function notifyUsersByRole(
  role: UserRole,
  params: {
    title: string;
    message: string;
    category: string;
    referenceId?: string | null;
    referenceType?: string | null;
  }
): Promise<void> {
  const usersRes = await query<{ id: string }>(`SELECT id FROM users WHERE role = $1 AND is_active = TRUE`, [role]);
  for (const user of usersRes.rows) {
    await createNotification({
      userId: user.id,
      title: params.title,
      message: params.message,
      category: params.category,
      referenceId: params.referenceId,
      referenceType: params.referenceType,
    });
  }
}

export async function getUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const res = await query<Notification>(
    `SELECT * FROM notifications 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [userId, limit]
  );
  return res.rows;
}

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
  const res = await query(
    `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const res = await query(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return parseInt(res.rows[0].count, 10);
}
