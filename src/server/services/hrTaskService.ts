// src/server/services/hrTaskService.ts
import { query, withTransaction } from '../db/pool';
import { HRTask, HRTaskStatus, User } from '../domain/types';
import { recordAuditLog } from './auditService';
import { createNotification } from './notificationService';

export interface CreateHRTaskInput {
  deal_id: string;
  college_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  internal_notes?: string;
}

export interface UpdateHRTaskInput {
  status?: HRTaskStatus;
  assigned_to?: string;
  due_date?: string;
  internal_notes?: string;
}

export async function createHRTask(input: CreateHRTaskInput, actor: User, clientIp?: string): Promise<HRTask> {
  const res = await query<HRTask>(
    `INSERT INTO hr_tasks (
      deal_id, college_id, title, description, assigned_to, status, due_date,
      internal_notes, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $7, NOW(), NOW())
    RETURNING *`,
    [
      input.deal_id,
      input.college_id,
      input.title.trim(),
      input.description?.trim() || null,
      input.assigned_to || null,
      input.due_date || null,
      input.internal_notes?.trim() || null,
    ]
  );

  const task = res.rows[0];

  await recordAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'HR_TASK_CREATED',
    entityName: 'hr_task',
    entityId: task.id,
    newState: task,
    ipAddress: clientIp,
  });

  if (task.assigned_to) {
    await createNotification({
      userId: task.assigned_to,
      title: 'New Operational Task Assigned',
      message: `You were assigned: "${task.title}".`,
      category: 'TASK_ASSIGNED',
      referenceId: task.id,
      referenceType: 'HR_TASK',
    });
  }

  return task;
}

export async function updateHRTask(
  taskId: string,
  input: UpdateHRTaskInput,
  actor: User,
  clientIp?: string
): Promise<HRTask> {
  const existingRes = await query<HRTask>(`SELECT * FROM hr_tasks WHERE id = $1`, [taskId]);
  if (existingRes.rowCount === 0) {
    throw new Error('Task not found.');
  }
  const current = existingRes.rows[0];

  const newStatus = input.status || current.status;
  const isCompleting = newStatus === 'COMPLETED' && current.status !== 'COMPLETED';

  const res = await query<HRTask>(
    `UPDATE hr_tasks 
     SET status = $2,
         assigned_to = COALESCE($3, assigned_to),
         due_date = COALESCE($4, due_date),
         internal_notes = COALESCE($5, internal_notes),
         completed_at = CASE WHEN $6 = true THEN NOW() ELSE completed_at END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      taskId,
      newStatus,
      input.assigned_to !== undefined ? input.assigned_to : current.assigned_to,
      input.due_date !== undefined ? input.due_date : current.due_date,
      input.internal_notes !== undefined ? input.internal_notes : current.internal_notes,
      isCompleting,
    ]
  );

  const updated = res.rows[0];

  await recordAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: isCompleting ? 'HR_TASK_COMPLETED' : 'HR_TASK_UPDATED',
    entityName: 'hr_task',
    entityId: taskId,
    previousState: current,
    newState: updated,
    ipAddress: clientIp,
  });

  return updated;
}

export async function listHRTasks(options?: {
  status?: string;
  assignedTo?: string;
  dealId?: string;
  collegeId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ tasks: HRTask[]; total: number }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (options?.status) {
    conditions.push(`t.status = $${paramIdx++}`);
    params.push(options.status);
  }
  if (options?.assignedTo) {
    conditions.push(`t.assigned_to = $${paramIdx++}`);
    params.push(options.assignedTo);
  }
  if (options?.dealId) {
    conditions.push(`t.deal_id = $${paramIdx++}`);
    params.push(options.dealId);
  }
  if (options?.collegeId) {
    conditions.push(`t.college_id = $${paramIdx++}`);
    params.push(options.collegeId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const countRes = await query(`SELECT COUNT(*) as count FROM hr_tasks t ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const dataRes = await query<HRTask>(
    `SELECT t.*,
            d.deal_code,
            d.title as deal_title,
            c.legal_name as college_name,
            u.full_name as assigned_name,
            u.email as assigned_email,
            CASE 
              WHEN t.status != 'COMPLETED' AND t.due_date < CURRENT_DATE THEN true 
              ELSE false 
            END as is_overdue
     FROM hr_tasks t
     JOIN deals d ON t.deal_id = d.id
     JOIN colleges c ON t.college_id = c.id
     LEFT JOIN users u ON t.assigned_to = u.id
     ${whereClause}
     ORDER BY 
       CASE WHEN t.status = 'COMPLETED' THEN 2 ELSE 1 END,
       t.due_date ASC NULLS LAST,
       t.created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  return { tasks: dataRes.rows, total };
}
