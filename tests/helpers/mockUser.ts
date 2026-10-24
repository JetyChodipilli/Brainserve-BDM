// tests/helpers/mockUser.ts
import { User, UserRole } from '../../src/server/domain/types';
import { query } from '../../src/server/db/pool';

/**
 * Generates an in-memory mock User object for pure unit tests.
 */
export function mockUser(email: string, role?: UserRole): User {
  let userRole: UserRole = role || 'BDM';
  if (!role) {
    if (email.includes('bdm')) userRole = 'BDM';
    else if (email.includes('hr')) userRole = 'HR';
    else if (email.includes('ceo')) userRole = 'CEO';
  }

  return {
    id: '00000000-0000-0000-0000-000000000001',
    email,
    full_name: email.split('@')[0].replace('.', ' '),
    role: userRole,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Ensures a test user exists in the database and returns the populated User entity.
 * Required for integration tests that enforce foreign key constraints.
 */
export async function getOrCreateTestUser(
  email: string,
  role: UserRole,
  fullName: string
): Promise<User> {
  const existing = await query<User>(`SELECT * FROM users WHERE email = $1`, [email]);
  if (existing.rowCount && existing.rowCount > 0) {
    return existing.rows[0];
  }

  const inserted = await query<User>(
    `INSERT INTO users (email, password_hash, full_name, role, is_active)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING *`,
    [
      email,
      '$2a$10$wT8hL2V7.j1bO/B8uBvJee5c/Rz6oD3tH4fXJ6bF1C8V9b0N.test',
      fullName,
      role,
    ]
  );
  return inserted.rows[0];
}
