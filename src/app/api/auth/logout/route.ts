// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseSessionCookie, deleteSession, makeLogoutCookie } from '@/server/security/auth';

export async function POST(req: NextRequest) {
  const token = parseSessionCookie(req.headers.get('cookie'));
  if (token) {
    await deleteSession(token);
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  response.headers.set('Set-Cookie', makeLogoutCookie());
  return response;
}
