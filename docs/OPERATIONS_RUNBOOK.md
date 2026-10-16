# EduDeal Enterprise Platform
## Operations, Disaster Recovery & Maintenance Runbook

**Document Version:** 1.0.0  
**Classification:** Confidential — System Operations  
**Target Audience:** SREs, DevOps Engineers, Database Administrators  

---

## 1. System Overview

EduDeal Enterprise is deployed as a containerized Next.js 15+ Node.js web tier connected to a high-availability PostgreSQL 18 database with persistent volumes.

- **Application Port:** 3000
- **Database Port:** 5432
- **Default Timezone:** Asia/Kolkata (IST)
- **Primary Data Store:** PostgreSQL with ACID compliance (`SERIALIZABLE` / `READ COMMITTED` transactions)

---

## 2. Environment Variables & Secret Configuration

| Variable | Description | Production Requirement | Example Value |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Managed credentials, TLS enabled | `postgresql://user:pass@host:5432/bdm_platform?sslmode=require` |
| `SESSION_SECRET` | 256-bit secret key for signing cookies | Minimum 32 characters, generated via CSPRNG | `openssl rand -hex 32` |
| `NODE_ENV` | Environment mode | Must be set to `production` | `production` |
| `PORT` | Listening port | Default `3000` | `3000` |
| `DEFAULT_TIMEZONE` | Internal system timezone | Default `Asia/Kolkata` | `Asia/Kolkata` |

---

## 3. Database Migration Procedures

Database migrations are version-controlled SQL files located in `src/server/db/migrations/` and managed through `scripts/migrate.js`.

### 3.1 Applying Migrations
```bash
# Production migration execution (zero downtime for backward-compatible migrations)
node scripts/migrate.js
```
The migration script ensures:
- Transactional execution (`BEGIN` ... `COMMIT` per file).
- Idempotent recording in `schema_migrations`.
- Automatic rollback upon any syntax or constraint violation.

### 3.2 Rollback Strategy
If a migration fails:
1. Identify the offending migration file from `schema_migrations`.
2. Prepare a corresponding forward-fix SQL patch (e.g. `002_revert_field_x.sql`).
3. Never edit previously committed and executed migration files.

---

## 4. Backup & Disaster Recovery Procedures

### 4.1 Automated Daily Backups
The database must be backed up daily using `pg_dump` with custom compressed archive format (`-Fc`):
```bash
# Automated backup execution script
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="/backups/bdm_platform_${TIMESTAMP}.dump"

pg_dump -h $PGHOST -U $PGUSER -p $PGPORT -F c -b -v -f $BACKUP_FILE bdm_platform
```

### 4.2 Database Restoration
To restore to a new database instance or recover from data corruption:
```bash
# 1. Terminate active application connections
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'bdm_platform' AND pid <> pg_backend_pid();"

# 2. Drop and recreate target database
dropdb -U postgres bdm_platform
createdb -U postgres -O postgres bdm_platform

# 3. Restore from verified compressed backup archive
pg_restore -h $PGHOST -U $PGUSER -p $PGPORT -d bdm_platform -v /backups/bdm_platform_latest.dump
```

---

## 5. Security Incident Response

### 5.1 Compromised User Credential / Session Hijacking
1. Revoke all active sessions for the user:
   ```sql
   DELETE FROM user_sessions WHERE user_id = '<COMPROMISED_USER_UUID>';
   ```
2. Disable the account temporarily:
   ```sql
   UPDATE users SET is_active = FALSE WHERE id = '<COMPROMISED_USER_UUID>';
   ```
3. Inspect `audit_logs` for any unauthorized deal modifications or data exports:
   ```sql
   SELECT * FROM audit_logs WHERE actor_id = '<COMPROMISED_USER_UUID>' ORDER BY created_at DESC;
   ```

### 5.2 Rate Limiting & Denial-of-Service Defense
Authentication endpoints (`/api/auth/login`) enforce a sliding window rate limiter (max 5 attempts per 15 minutes per IP). When exceeded, HTTP 429 is returned with the remaining cooldown seconds.

---

## 6. Service Health Monitoring & Diagnostics

- **Health Endpoint:** `GET /api/auth/me`
- **Database Liveness Check:** `pg_isready -U postgres -d bdm_platform`
- **Application Logs:** Docker logs streamed via `docker-compose logs -f app`
