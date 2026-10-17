// src/app/api/setup/status/route.ts
import { NextResponse } from 'next/server';
import { hasCeoAccount } from '@/server/services/userService';

export async function GET() {
  const hasCeo = await hasCeoAccount();
  return NextResponse.json({ hasCeo });
}
