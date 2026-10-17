// src/app/api/setup/bootstrap/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { bootstrapCeo } from '@/server/services/userService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, full_name, phone } = body;
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    const ceo = await bootstrapCeo({
      email,
      password,
      full_name,
      phone,
      clientIp: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Chief Executive Officer account successfully initialized.',
      user: ceo,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Bootstrap error:', err);
    return NextResponse.json({ error: err.message || 'Failed to initialize CEO account.' }, { status: 400 });
  }
}
