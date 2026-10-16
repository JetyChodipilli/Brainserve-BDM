// src/server/services/exportService.ts
import { Deal, User } from '../domain/types';
import { listDeals } from './dealService';
import { recordAuditLog } from './auditService';

/**
 * Sanitizes cell values to prevent CSV / Spreadsheet formula injection (OWASP ASVS 5.3.3).
 * If a cell begins with '=', '+', '-', '@', '\t', or '\r', it prefixes it with a single apostrophe.
 */
export function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value).trim();

  // Check if string begins with formula triggers
  const formulaTriggers = ['=', '+', '-', '@', '\t', '\r'];
  if (formulaTriggers.some((char) => str.startsWith(char))) {
    str = `'${str}`;
  }

  // Escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export async function exportDealsToCsv(
  user: User,
  filters?: {
    status?: any;
    collegeId?: string;
    bdmId?: string;
    category?: string;
  },
  clientIp?: string
): Promise<{ csvContent: string; rowCount: number; filename: string }> {
  const { deals, total } = await listDeals(user, {
    ...filters,
    limit: 10000, // Export all matching
  });

  const headers = [
    'Deal Code',
    'College Name',
    'City',
    'State',
    'Title',
    'Business Category',
    'Status',
    'Ratio Type',
    'Company %',
    'College %',
    'Agreement Value (INR)',
    'Contract Start',
    'Contract End',
    'BDM Name',
    'BDM Email',
    'Submission Date (UTC)',
    'Reviewer',
    'Review Date (UTC)',
  ];

  const rows: string[] = [];
  rows.push(headers.join(','));

  for (const d of deals) {
    const row = [
      sanitizeCsvCell(d.deal_code),
      sanitizeCsvCell(d.college_name),
      sanitizeCsvCell(d.college_city),
      sanitizeCsvCell(d.college_state),
      sanitizeCsvCell(d.title),
      sanitizeCsvCell(d.business_category),
      sanitizeCsvCell(d.status),
      sanitizeCsvCell(d.ratio_type),
      sanitizeCsvCell(d.company_percentage ?? ''),
      sanitizeCsvCell(d.college_percentage ?? ''),
      sanitizeCsvCell(d.agreement_value ?? ''),
      sanitizeCsvCell(d.contract_start_date ?? ''),
      sanitizeCsvCell(d.contract_end_date ?? ''),
      sanitizeCsvCell(d.bdm_name ?? ''),
      sanitizeCsvCell(d.bdm_email ?? ''),
      sanitizeCsvCell(d.submitted_at ? new Date(d.submitted_at).toISOString() : ''),
      sanitizeCsvCell(d.reviewer_name ?? ''),
      sanitizeCsvCell(d.reviewed_at ? new Date(d.reviewed_at).toISOString() : ''),
    ];
    rows.push(row.join(','));
  }

  const csvContent = rows.join('\r\n');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `deals_export_${user.role.toLowerCase()}_${timestamp}.csv`;

  // Audit the export action
  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'DATA_EXPORT_CSV',
    entityName: 'deal_export',
    newState: {
      rowCount: deals.length,
      filename,
      filters: filters || {},
    },
    ipAddress: clientIp,
  });

  return { csvContent, rowCount: deals.length, filename };
}
