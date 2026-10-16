-- 001_initial_schema.sql
-- Database Schema for College Business Deal Management & Executive Dashboard Platform

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types or check constraints for high data integrity
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('BDM', 'HR', 'CEO')),
    phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    college_code VARCHAR(50) UNIQUE,
    institution_type VARCHAR(100) NOT NULL DEFAULT 'Engineering',
    affiliated_university VARCHAR(255),
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    pin_code VARCHAR(20),
    address TEXT NOT NULL,
    website VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_colleges_normalized_name ON colleges(normalized_name);
CREATE INDEX IF NOT EXISTS idx_colleges_state_district ON colleges(state, district);

CREATE TABLE IF NOT EXISTS college_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    designation VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_college ON college_contacts(college_id);

CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_code VARCHAR(50) NOT NULL UNIQUE,
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
    primary_contact_id UUID REFERENCES college_contacts(id) ON DELETE SET NULL,
    bdm_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_hr_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    business_category VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 
        'ACTIVE', 'REJECTED', 'NEEDS_CORRECTION', 'COMPLETED', 'CANCELLED'
    )),
    ratio_type VARCHAR(50) NOT NULL CHECK (ratio_type IN (
        'REVENUE_SHARE_PERCENTAGE', 
        'COLLEGE_COMMISSION_PERCENTAGE', 
        'COMPANY_SHARE_PERCENTAGE', 
        'FIXED_FEE_PER_STUDENT', 
        'CUSTOM_CONTRACTUAL_RATIO'
    )),
    company_percentage NUMERIC(5,2),
    college_percentage NUMERIC(5,2),
    agreement_value NUMERIC(14,2),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    ratio_terms_description TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    terms_and_conditions TEXT,
    additional_remarks TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_remarks TEXT,
    version_number INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_bdm_status ON deals(bdm_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_college ON deals(college_id);
CREATE INDEX IF NOT EXISTS idx_deals_status_submitted ON deals(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_created ON deals(created_at DESC);

CREATE TABLE IF NOT EXISTS deal_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    actor_id UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_status_history_deal ON deal_status_history(deal_id, created_at DESC);

CREATE TABLE IF NOT EXISTS deal_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    snapshot JSONB NOT NULL,
    modified_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'OVERDUE'
    )),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    internal_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_tasks_assigned_status ON hr_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_hr_tasks_deal ON hr_tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_hr_tasks_due_date ON hr_tasks(due_date);

CREATE TABLE IF NOT EXISTS business_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period VARCHAR(50) NOT NULL,
    target_deals_count INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, period)
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    reference_id UUID,
    reference_type VARCHAR(50),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255),
    actor_role VARCHAR(20),
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    previous_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_name, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
