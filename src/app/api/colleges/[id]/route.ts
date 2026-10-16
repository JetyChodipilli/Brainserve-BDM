// src/app/api/colleges/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/security/rbac';
import { getCollegeById, addCollegeContact } from '@/server/services/collegeService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const college = await getCollegeById(id);

  if (!college) {
    return NextResponse.json({ error: 'College not found.' }, { status: 404 });
  }

  return NextResponse.json(college);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const { full_name, designation, phone, email, is_primary } = body;

  if (!full_name || !designation || !phone || !email) {
    return NextResponse.json(
      { error: 'Contact full_name, designation, phone, and email are required.' },
      { status: 400 }
    );
  }

  const contact = await addCollegeContact(id, {
    full_name,
    designation,
    phone,
    email,
    is_primary,
  });

  return NextResponse.json(contact, { status: 201 });
}
