// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Global security headers middleware applied to all routes.
 * Adds common security headers to mitigate XSS, clickjacking, etc.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  // Content Security Policy – adjust as needed for your app assets.
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' ws: wss:; font-src 'self' data:;",
  );
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  return response;
}

import { validateEnv } from './server/startup/validateEnv';
validateEnv();

