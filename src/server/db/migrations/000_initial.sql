-- 000_initial.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('CEO','HR','BDM')),
  mfa_secret VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Colleges table
CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  type VARCHAR(100),
  affiliated_university VARCHAR(255),
  state VARCHAR(100),
  district VARCHAR(100),
  city VARCHAR(100),
  address TEXT,
  website VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- College contacts (representatives)
CREATE TABLE IF NOT EXISTS college_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  bdm_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  hr_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','ACTIVE','COMPLETED','REJECTED','NEEDS_CORRECTION','CANCELLED')),
  business_ratio VARCHAR(50), -- free‑form entry from offline negotiation
  description TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deal status history
CREATE TABLE IF NOT EXISTS deal_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HR tasks
CREATE TABLE IF NOT EXISTS hr_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  assignee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(15) NOT NULL CHECK (status IN ('PENDING','IN_PROGRESS','DONE')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email VARCHAR(255),
  actor_role VARCHAR(10),
  action VARCHAR(100) NOT NULL,
  entity_name VARCHAR(100),
  entity_id UUID,
  ip_address INET,
  user_agent TEXT,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schema migrations ledger (already created by migrate.js if not exists)
-- No further rows needed here.
