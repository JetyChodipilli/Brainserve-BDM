// src/server/services/userService.ts
import { query, withTransaction } from '../db/pool';
import { User, UserRole } from '../domain/types';
import { hashPassword } from '../security/auth';
import { recordAuditLog } from './auditService';

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role: 'HR' | 'BDM';
  phone?: string;
  target_deals?: number;
}

export interface UpdateUserInput {
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  password?: string;
}

export interface UserWithStats extends User {
  deals_count: number;
  tasks_count: number;
}

/**
 * Checks whether an executive CEO account already exists in the system.
 */
export async function hasCeoAccount(): Promise<boolean> {
  const res = await query(`SELECT COUNT(*) as count FROM users WHERE role = 'CEO'`);
  return parseInt(res.rows[0].count, 10) > 0;
}

/**
 * Initializes the one and only CEO executive account for the organization.
 * Once created, this endpoint is permanently locked.
 */
export async function bootstrapCeo(input: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  clientIp?: string;
}): Promise<User> {
  const ceoExists = await hasCeoAccount();
  if (ceoExists) {
    throw new Error(
      'A Chief Executive Officer account has already been initialized. Please log in as CEO to create HR and BDM accounts.'
    );
  }

  if (!input.email || !input.password || !input.full_name) {
    throw new Error('Email, password, and full name are required for executive setup.');
  }

  if (input.password.length < 8) {
    throw new Error('Executive password must be at least 8 characters long.');
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const hashedPassword = await hashPassword(input.password);

  const res = await query<User>(
    `INSERT INTO users (email, password_hash, full_name, role, phone, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, 'CEO', $4, TRUE, NOW(), NOW())
     RETURNING id, email, full_name, role, phone, is_active, created_at, updated_at`,
    [normalizedEmail, hashedPassword, input.full_name.trim(), input.phone?.trim() || null]
  );

  const ceo = res.rows[0];

  await recordAuditLog({
    actorId: ceo.id,
    actorEmail: ceo.email,
    actorRole: 'CEO',
    action: 'CEO_BOOTSTRAP_INITIALIZED',
    entityName: 'user',
    entityId: ceo.id,
    newState: ceo,
    ipAddress: input.clientIp,
  });

  return ceo;
}

/**
 * Creates a real HR or BDM employee account.
 * Only authenticated CEO can invoke this.
 * Prevents creation of multiple CEO accounts.
 */
export async function createUser(
  input: CreateUserInput,
  actor: User,
  clientIp?: string
): Promise<User> {
  if (actor.role !== 'CEO') {
    throw new Error('Forbidden. Only the Chief Executive Officer can provision new employee accounts.');
  }

  if (input.role !== 'HR' && input.role !== 'BDM') {
    throw new Error(
      'Only HR Operations and BDM employee roles can be created. The organization permits exactly one CEO account.'
    );
  }

  if (!input.email || !input.password || !input.full_name) {
    throw new Error('Email, password, and full name are required.');
  }

  if (input.password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  // Check unique email
  const existingRes = await query(`SELECT id FROM users WHERE LOWER(email) = $1`, [normalizedEmail]);
  if (existingRes.rowCount && existingRes.rowCount > 0) {
    throw new Error(`An account with email "${normalizedEmail}" already exists in the system.`);
  }

  const hashedPassword = await hashPassword(input.password);

  return withTransaction(async (client) => {
    const insertRes = await client.query<User>(
      `INSERT INTO users (email, password_hash, full_name, role, phone, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), NOW())
       RETURNING id, email, full_name, role, phone, is_active, created_at, updated_at`,
      [
        normalizedEmail,
        hashedPassword,
        input.full_name.trim(),
        input.role,
        input.phone?.trim() || null,
      ]
    );

    const newUser = insertRes.rows[0];

    // If BDM, initialize business target
    if (newUser.role === 'BDM') {
      const targetCount = input.target_deals ? Number(input.target_deals) : 10;
      await client.query(
        `INSERT INTO business_targets (user_id, period, target_deals_count, created_at, updated_at)
         VALUES ($1, '2026-Q4', $2, NOW(), NOW())
         ON CONFLICT (user_id, period) DO UPDATE SET target_deals_count = EXCLUDED.target_deals_count`,
        [newUser.id, targetCount]
      );
    }

    await recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'USER_CREATED',
      entityName: 'user',
      entityId: newUser.id,
      newState: { id: newUser.id, email: newUser.email, role: newUser.role },
      ipAddress: clientIp,
    });

    return newUser;
  });
}

/**
 * Updates an employee account (activate/deactivate or password reset).
 */
export async function updateUser(
  targetUserId: string,
  input: UpdateUserInput,
  actor: User,
  clientIp?: string
): Promise<User> {
  if (actor.role !== 'CEO') {
    throw new Error('Forbidden. Only the Chief Executive Officer can modify user accounts.');
  }

  const userRes = await query<User>(`SELECT * FROM users WHERE id = $1`, [targetUserId]);
  if (userRes.rowCount === 0) {
    throw new Error('User not found.');
  }
  const current = userRes.rows[0];

  // Prevent CEO deactivating self
  if (current.role === 'CEO' && input.is_active === false) {
    throw new Error('Cannot deactivate the Chief Executive Officer executive account.');
  }

  let newPasswordHash: string | null = null;
  if (input.password && input.password.trim()) {
    if (input.password.trim().length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }
    newPasswordHash = await hashPassword(input.password.trim());
  }

  const updateRes = await query<User>(
    `UPDATE users 
     SET full_name = COALESCE($2, full_name),
         phone = COALESCE($3, phone),
         is_active = COALESCE($4, is_active),
         password_hash = COALESCE($5, password_hash),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, full_name, role, phone, is_active, created_at, updated_at`,
    [
      targetUserId,
      input.full_name?.trim() || null,
      input.phone !== undefined ? input.phone.trim() : null,
      input.is_active !== undefined ? input.is_active : null,
      newPasswordHash,
    ]
  );

  const updated = updateRes.rows[0];

  await recordAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'USER_UPDATED',
    entityName: 'user',
    entityId: targetUserId,
    previousState: { is_active: current.is_active, phone: current.phone },
    newState: { is_active: updated.is_active, phone: updated.phone },
    ipAddress: clientIp,
  });

  return updated;
}

/**
 * Lists all registered users with real operational statistics (deals count, tasks count).
 */
export async function listAllUsers(options?: { role?: string }): Promise<UserWithStats[]> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (options?.role) {
    conditions.push(`u.role = $${paramIdx++}`);
    params.push(options.role);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const res = await query<UserWithStats>(
    `SELECT u.id, u.email, u.full_name, u.role, u.phone, u.is_active, u.created_at, u.updated_at,
            COALESCE(COUNT(DISTINCT d.id), 0)::int as deals_count,
            COALESCE(COUNT(DISTINCT t.id), 0)::int as tasks_count
     FROM users u
     LEFT JOIN deals d ON d.bdm_id = u.id
     LEFT JOIN hr_tasks t ON t.assigned_to = u.id
     ${whereClause}
     GROUP BY u.id
     ORDER BY 
       CASE WHEN u.role = 'CEO' THEN 1 WHEN u.role = 'HR' THEN 2 ELSE 3 END,
       u.created_at DESC`,
    params
  );

  return res.rows;
}

/**
 * Public registration endpoint used by self‑service sign‑up.
 * It internally uses a system pseudo‑user with CEO privileges, but enforces that the role
 * can only be HR or BDM. This function is deliberately thin – all validation lives in
 * `createUser`.
 */
export async function registerUser(input: CreateUserInput, clientIp?: string): Promise<User> {
  // Import SYSTEM_USER dynamically to avoid circular dependencies
  const { SYSTEM_USER } = await import('../security/auth');
  // Force role to be HR or BDM; any attempt to pass CEO will be rejected
  if (input.role !== 'HR' && input.role !== 'BDM') {
    throw new Error('Registration limited to HR or BDM roles.');
  }
  return createUser(input, SYSTEM_USER as unknown as User, clientIp);
}
