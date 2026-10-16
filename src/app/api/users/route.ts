// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRoles } from '@/server/security/rbac';
import { query } from '@/server/db/pool';

export async function GET(req: NextRequest) {
  const auth = await requireRoles(req, ['CEO', 'HR']);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const role = url.searchParams.get('role');

  const conditions = ['is_active = TRUE'];
  const params: any[] = [];
  if (role) {
    conditions.push('role = $1');
    params.push(role);
  }

  const res = await query(
    `SELECT id, email, full_name, role, phone, created_at 
     FROM users 
     WHERE ${conditions.join(' AND ')}
     ORDER BY role ASC, full_name ASC`,
    params
  );

  return NextResponse.json({ users: res.rows });
}
