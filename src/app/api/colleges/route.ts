// src/app/api/colleges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/security/rbac';
import { listColleges, createCollege, checkDuplicateCollege } from '@/server/services/collegeService';
import { recordAuditLog } from '@/server/services/auditService';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const search = url.searchParams.get('search') || undefined;
  const state = url.searchParams.get('state') || undefined;
  const city = url.searchParams.get('city') || undefined;
  const institution_type = url.searchParams.get('type') || undefined;
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const data = await listColleges({
    search,
    state,
    city,
    institution_type,
    limit,
    offset,
  });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      legal_name,
      college_code,
      institution_type,
      affiliated_university,
      state,
      district,
      city,
      pin_code,
      address,
      website,
      contact,
      ignore_duplicate_warning,
    } = body;

    if (!legal_name || !state || !district || !city || !address) {
      return NextResponse.json(
        { error: 'Mandatory fields missing: legal_name, state, district, city, address are required.' },
        { status: 400 }
      );
    }

    // Duplicate detection check
    const duplicateCheck = await checkDuplicateCollege(legal_name, city);
    if (duplicateCheck.isDuplicate && !ignore_duplicate_warning) {
      return NextResponse.json(
        {
          warning: 'POSSIBLE_DUPLICATE_COLLEGE',
          message: `A college with similar name "${duplicateCheck.match?.legal_name}" already exists in ${duplicateCheck.match?.city}, ${duplicateCheck.match?.state}.`,
          existingCollege: duplicateCheck.match,
        },
        { status: 409 }
      );
    }

    const result = await createCollege({
      legal_name,
      college_code,
      institution_type: institution_type || 'Engineering',
      affiliated_university,
      state,
      district,
      city,
      pin_code,
      address,
      website,
      contact,
    });

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'COLLEGE_CREATED',
      entityName: 'college',
      entityId: result.college.id,
      newState: result.college,
      ipAddress: ip,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error('Create college error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create college.' }, { status: 500 });
  }
}
