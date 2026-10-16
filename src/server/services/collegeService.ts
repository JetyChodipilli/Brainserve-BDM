// src/server/services/collegeService.ts
import { query, withTransaction } from '../db/pool';
import { College, CollegeContact } from '../domain/types';

export function normalizeCollegeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface CreateCollegeInput {
  legal_name: string;
  college_code?: string;
  institution_type: string;
  affiliated_university?: string;
  state: string;
  district: string;
  city: string;
  pin_code?: string;
  address: string;
  website?: string;
  contact?: {
    full_name: string;
    designation: string;
    phone: string;
    email: string;
  };
}

export async function checkDuplicateCollege(legalName: string, city: string): Promise<{
  isDuplicate: boolean;
  match?: College;
}> {
  const normalized = normalizeCollegeName(legalName);
  const res = await query<College>(
    `SELECT * FROM colleges 
     WHERE normalized_name = $1 OR (LOWER(city) = LOWER($2) AND normalized_name ILIKE $3)
     LIMIT 1`,
    [normalized, city.trim(), `%${normalized}%`]
  );

  if (res.rowCount && res.rowCount > 0) {
    return { isDuplicate: true, match: res.rows[0] };
  }
  return { isDuplicate: false };
}

export async function createCollege(input: CreateCollegeInput): Promise<{ college: College; contact?: CollegeContact }> {
  const normalizedName = normalizeCollegeName(input.legal_name);

  return withTransaction(async (client) => {
    // Generate code if not provided
    const collegeCode =
      input.college_code?.trim() ||
      `COL-${normalizedName.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const colRes = await client.query<College>(
      `INSERT INTO colleges (
        legal_name, normalized_name, college_code, institution_type, affiliated_university,
        state, district, city, pin_code, address, website, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *`,
      [
        input.legal_name.trim(),
        normalizedName,
        collegeCode,
        input.institution_type.trim(),
        input.affiliated_university?.trim() || null,
        input.state.trim(),
        input.district.trim(),
        input.city.trim(),
        input.pin_code?.trim() || null,
        input.address.trim(),
        input.website?.trim() || null,
      ]
    );

    const college = colRes.rows[0];
    let contact: CollegeContact | undefined;

    if (input.contact && input.contact.full_name) {
      const contactRes = await client.query<CollegeContact>(
        `INSERT INTO college_contacts (
          college_id, full_name, designation, phone, email, is_primary, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
        RETURNING *`,
        [
          college.id,
          input.contact.full_name.trim(),
          input.contact.designation.trim(),
          input.contact.phone.trim(),
          input.contact.email.trim(),
        ]
      );
      contact = contactRes.rows[0];
    }

    return { college, contact };
  });
}

export async function listColleges(options?: {
  state?: string;
  city?: string;
  institution_type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ colleges: (College & { deals_count: number; contacts_count: number })[]; total: number }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (options?.state) {
    conditions.push(`c.state = $${paramIdx++}`);
    params.push(options.state);
  }
  if (options?.city) {
    conditions.push(`c.city ILIKE $${paramIdx++}`);
    params.push(`%${options.city}%`);
  }
  if (options?.institution_type) {
    conditions.push(`c.institution_type = $${paramIdx++}`);
    params.push(options.institution_type);
  }
  if (options?.search) {
    conditions.push(`(c.legal_name ILIKE $${paramIdx} OR c.city ILIKE $${paramIdx} OR c.college_code ILIKE $${paramIdx})`);
    params.push(`%${options.search}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const countRes = await query(`SELECT COUNT(*) as count FROM colleges c ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const dataRes = await query<College & { deals_count: number; contacts_count: number }>(
    `SELECT c.*, 
            COALESCE(COUNT(DISTINCT d.id), 0)::int as deals_count,
            COALESCE(COUNT(DISTINCT cc.id), 0)::int as contacts_count
     FROM colleges c
     LEFT JOIN deals d ON d.college_id = c.id
     LEFT JOIN college_contacts cc ON cc.college_id = c.id
     ${whereClause}
     GROUP BY c.id
     ORDER BY c.legal_name ASC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  return { colleges: dataRes.rows, total };
}

export async function getCollegeById(id: string): Promise<{
  college: College;
  contacts: CollegeContact[];
  deals: any[];
} | null> {
  const colRes = await query<College>(`SELECT * FROM colleges WHERE id = $1`, [id]);
  if (colRes.rowCount === 0) return null;

  const contactsRes = await query<CollegeContact>(
    `SELECT * FROM college_contacts WHERE college_id = $1 ORDER BY is_primary DESC, full_name ASC`,
    [id]
  );

  const dealsRes = await query(
    `SELECT d.*, u.full_name as bdm_name 
     FROM deals d 
     JOIN users u ON d.bdm_id = u.id 
     WHERE d.college_id = $1 
     ORDER BY d.created_at DESC`,
    [id]
  );

  return {
    college: colRes.rows[0],
    contacts: contactsRes.rows,
    deals: dealsRes.rows,
  };
}

export async function addCollegeContact(collegeId: string, contact: {
  full_name: string;
  designation: string;
  phone: string;
  email: string;
  is_primary?: boolean;
}): Promise<CollegeContact> {
  const res = await query<CollegeContact>(
    `INSERT INTO college_contacts (
      college_id, full_name, designation, phone, email, is_primary, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    RETURNING *`,
    [
      collegeId,
      contact.full_name.trim(),
      contact.designation.trim(),
      contact.phone.trim(),
      contact.email.trim(),
      contact.is_primary || false,
    ]
  );
  return res.rows[0];
}
