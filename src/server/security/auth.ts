// src/server/security/auth.ts
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool';
import { User, UserRole, SessionData } from '../domain/types';

const SESSION_COOKIE_NAME = 'bdm_session_token';
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await query(
    `INSERT INTO user_sessions (id, user_id, expires_at, ip_address, user_agent, created_at, last_active_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [token, userId, expiresAt, ipAddress || null, userAgent || null]
  );

  return { token, expiresAt };
}

export async function deleteSession(token: string): Promise<void> {
  await query(`DELETE FROM user_sessions WHERE id = $1`, [token]);
}

export async function getSessionUser(token: string): Promise<User | null> {
  if (!token) return null;

  const res = await query<User & { session_expires_at: Date }>(
    `SELECT u.id, u.email, u.full_name, u.role, u.phone, u.is_active, u.created_at, u.updated_at,
            s.expires_at as session_expires_at
     FROM user_sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = $1 AND u.is_active = TRUE`,
    [token]
  );

  if (res.rowCount === 0) {
    return null;
  }

  const row = res.rows[0];
  const now = new Date();
  if (new Date(row.session_expires_at) < now) {
    await deleteSession(token);
    return null;
  }

  // Sliding session activity update (asynchronously update last_active_at)
  query(`UPDATE user_sessions SET last_active_at = NOW() WHERE id = $1`, [token]).catch(() => {});

  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role as UserRole,
    phone: row.phone,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export function makeSessionCookie(token: string, expiresAt: Date): string {
  const isProd = process.env.NODE_ENV === 'production';
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${
    isProd ? '; Secure' : ''
  }`;
}

export function makeLogoutCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
