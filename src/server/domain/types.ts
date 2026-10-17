// src/server/domain/types.ts

export type UserRole = 'BDM' | 'HR' | 'CEO';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export type DealStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'REJECTED'
  | 'NEEDS_CORRECTION'
  | 'COMPLETED'
  | 'CANCELLED';

export type RatioType =
  | 'REVENUE_SHARE_PERCENTAGE'
  | 'COLLEGE_COMMISSION_PERCENTAGE'
  | 'COMPANY_SHARE_PERCENTAGE'
  | 'FIXED_FEE_PER_STUDENT'
  | 'CUSTOM_CONTRACTUAL_RATIO';

export type BusinessCategory =
  | 'Campus Recruitment Training'
  | 'Center of Excellence'
  | 'Faculty Development'
  | 'Joint Certification'
  | 'Lab Infrastructure'
  | 'Student Internship Program'
  | 'Other';

export interface RatioDetails {
  ratio_type: RatioType;
  company_percentage?: number | null;
  college_percentage?: number | null;
  agreement_value?: number | null;
  currency: string;
  ratio_terms_description?: string | null;
}

export interface College {
  id: string;
  legal_name: string;
  normalized_name: string;
  college_code?: string | null;
  institution_type: string;
  affiliated_university?: string | null;
  state: string;
  district: string;
  city: string;
  pin_code?: string | null;
  address: string;
  website?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CollegeContact {
  id: string;
  college_id: string;
  full_name: string;
  designation: string;
  phone: string;
  email: string;
  is_primary: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Deal {
  id: string;
  deal_code: string;
  college_id: string;
  primary_contact_id?: string | null;
  bdm_id: string;
  assigned_hr_id?: string | null;
  title: string;
  description: string;
  business_category: string;
  status: DealStatus;
  ratio_type: RatioType;
  company_percentage?: number | null;
  college_percentage?: number | null;
  agreement_value?: number | null;
  currency: string;
  ratio_terms_description?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  terms_and_conditions?: string | null;
  additional_remarks?: string | null;
  submitted_at?: Date | string | null;
  reviewed_by?: string | null;
  reviewed_at?: Date | string | null;
  review_remarks?: string | null;
  version_number: number;
  created_at: Date | string;
  updated_at: Date | string;

  // Joined fields for display
  college_name?: string;
  college_city?: string;
  college_state?: string;
  college_website?: string;
  contact_name?: string;
  contact_designation?: string;
  contact_email?: string;
  contact_phone?: string;
  bdm_name?: string;
  bdm_email?: string;
  reviewer_name?: string;
}

export type HRTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'OVERDUE';

export interface HRTask {
  id: string;
  deal_id: string;
  college_id: string;
  title: string;
  description?: string | null;
  assigned_to?: string | null;
  status: HRTaskStatus;
  due_date?: string | null;
  completed_at?: Date | string | null;
  internal_notes?: string | null;
  created_at: Date | string;
  updated_at: Date | string;

  deal_code?: string;
  deal_title?: string;
  college_name?: string;
  assigned_name?: string;
  assigned_email?: string;
}

export interface DealStatusHistory {
  id: string;
  deal_id: string;
  from_status?: DealStatus | null;
  to_status: DealStatus;
  actor_id: string;
  reason?: string | null;
  created_at: Date | string;
  actor_name?: string;
  actor_email?: string;
  actor_role?: UserRole;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor_email?: string | null;
  actor_role?: string | null;
  action: string;
  entity_name: string;
  entity_id?: string | null;
  previous_state?: any;
  new_state?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: Date | string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  category: string;
  reference_id?: string | null;
  reference_type?: string | null;
  is_read: boolean;
  created_at: Date | string;
}

export interface SessionData {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
  };
  sessionId: string;
}
