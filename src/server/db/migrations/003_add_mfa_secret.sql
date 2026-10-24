-- 003_add_mfa_secret.sql
-- Add mfa_secret column to users table if not exists

ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255);
