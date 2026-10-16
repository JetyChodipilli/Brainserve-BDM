// src/server/security/rbac.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, parseSessionCookie } from './auth';
import { User, UserRole } from '../domain/types';

export interface AuthenticatedContext {
  user: User;
  token: string;
}

export async function authenticateRequest(
  req: NextRequest
): Promise<{ user: User; token: string } | null> {
  const cookieHeader = req.headers.get('cookie');
  const token = parseSessionCookie(cookieHeader);

  if (!token) {
    return null;
  }

  const user = await getSessionUser(token);
  if (!user) {
    return null;
  }

  return { user, token };
}

export async function requireAuth(
  req: NextRequest
): Promise<{ user: User; token: string } | NextResponse> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in to access this resource.' },
      { status: 401 }
    );
  }
  return auth;
}

export async function requireRoles(
  req: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ user: User; token: string } | NextResponse> {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!allowedRoles.includes(authResult.user.role)) {
    return NextResponse.json(
      {
        error: `Forbidden. Role '${authResult.user.role}' is not authorized to perform this operation. Allowed: ${allowedRoles.join(', ')}`,
      },
      { status: 403 }
    );
  }

  return authResult;
}

export function isDealAccessibleToUser(dealBdmId: string, user: User): boolean {
  if (user.role === 'CEO' || user.role === 'HR') {
    return true;
  }
  return dealBdmId === user.id;
}
