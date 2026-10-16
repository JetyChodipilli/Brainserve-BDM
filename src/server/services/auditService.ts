// src/server/services/auditService.ts
import { query } from '../db/pool';
import { AuditLog, UserRole } from '../domain/types';

export interface CreateAuditLogParams {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: UserRole | string | null;
  action: string;
  entityName: string;
  entityId?: string | null;
  previousState?: any;
  newState?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function recordAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (
        actor_id, actor_email, actor_role, action, entity_name, entity_id,
        previous_state, new_state, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        params.actorId || null,
        params.actorEmail || null,
        params.actorRole || null,
        params.action,
        params.entityName,
        params.entityId || null,
        params.previousState ? JSON.stringify(params.previousState) : null,
        params.newState ? JSON.stringify(params.newState) : null,
        params.ipAddress || null,
        params.userAgent || null,
      ]
    );
  } catch (err) {
    // Non-blocking catch to ensure core transactions don't fail, but log to stderr
    console.error('Failed to write audit log:', err);
  }
}

export async function listAuditLogs(options?: {
  entityName?: string;
  entityId?: string;
  actorId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLog[]; total: number }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (options?.entityName) {
    conditions.push(`entity_name = $${paramIdx++}`);
    params.push(options.entityName);
  }
  if (options?.entityId) {
    conditions.push(`entity_id = $${paramIdx++}`);
    params.push(options.entityId);
  }
  if (options?.actorId) {
    conditions.push(`actor_id = $${paramIdx++}`);
    params.push(options.actorId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const countRes = await query(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const dataRes = await query<AuditLog>(
    `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  return { logs: dataRes.rows, total };
}
