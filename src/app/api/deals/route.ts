// src/app/api/deals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRoles } from '@/server/security/rbac';
import { listDeals, createDeal } from '@/server/services/dealService';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const status = (url.searchParams.get('status') as any) || undefined;
  const collegeId = url.searchParams.get('collegeId') || undefined;
  const bdmId = url.searchParams.get('bdmId') || undefined;
  const category = url.searchParams.get('category') || undefined;
  const search = url.searchParams.get('search') || undefined;
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const data = await listDeals(auth.user, {
    status,
    collegeId,
    bdmId,
    category,
    search,
    limit,
    offset,
  });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireRoles(req, ['BDM']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      college_id,
      primary_contact_id,
      title,
      description,
      business_category,
      business_ratio,
      ratio_type,
      company_percentage,
      college_percentage,
      agreement_value,
      currency,
      ratio_terms_description,
      contract_start_date,
      contract_end_date,
      terms_and_conditions,
      additional_remarks,
      is_draft,
    } = body;

    if (!college_id || !title || !description || !business_category || !ratio_type) {
      return NextResponse.json(
        {
          error:
            'Mandatory fields missing: college_id, title, description, business_category, and ratio_type are required.',
        },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    const deal = await createDeal(
      {
        college_id,
        primary_contact_id,
        title,
        description,
        business_category,
        business_ratio: business_ratio?.trim() || null,
        ratio_type,
        company_percentage,
        college_percentage,
        agreement_value,
        currency,
        ratio_terms_description,
        contract_start_date,
        contract_end_date,
        terms_and_conditions,
        additional_remarks,
        is_draft: Boolean(is_draft),
      },
      auth.user,
      ip
    );

    return NextResponse.json(deal, { status: 201 });
  } catch (err: any) {
    console.error('Create deal error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create deal.' }, { status: 400 });
  }
}
