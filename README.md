# College Business Deal Management & Executive Dashboard Platform (EduDeal Enterprise)

[![CI Pipeline](https://github.com/organization/bdm-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/organization/bdm-platform/actions)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-blue.svg)](LICENSE)
[![Node: 24](https://img.shields.io/badge/Node.js-24.x-brightgreen.svg)](https://nodejs.org)
[![PostgreSQL: 18](https://img.shields.io/badge/PostgreSQL-18.x-blue.svg)](https://www.postgresql.org)

An enterprise-grade, secure, multi-role platform for higher-education institutional business deal governance, executive intelligence, and campus onboarding operations.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC):** Server-enforced authorization across three core roles: **BDM** (Business Development & Management), **HR** (Human Resources), and **CEO** (Chief Executive Officer).
2. **Server-Side Timestamping Invariant:** Guaranteed UTC server timestamp generation (`submitted_at = NOW()`) on commit; client-supplied timestamps are strictly ignored.
3. **Type-Safe Commercial Ratios:** Rigorous validation for revenue sharing (`Company % + College % = 100.00%`), college commission, fixed student fees, and contractual ratios.
4. **Governed State Machine:** Strict transitions (`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` / `REJECTED` / `NEEDS_CORRECTION` → `ACTIVE` → `COMPLETED`).
5. **Immediate Operational Handoff:** Submitted and approved deals appear instantly in the HR Operations Dashboard with automated onboarding task dispatch.
6. **Executive Intelligence & Verified KPIs:** Organization-wide dashboards featuring clean approval rate calculations, BDM productivity comparisons, and geographic penetration maps.
7. **Tamper-Evident Audit Ledger:** Cryptographic session tracking, state diff recording, and client IP logging for all commercial and security operations.
8. **OWASP ASVS Defense:** Sanitized CSV exports with formula injection defense, rate limiting against brute-force attacks, and record-level IDOR protection.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js:** v20+ (v24 recommended)
- **PostgreSQL:** v14+ (v18 recommended)

### 1. Setup Environment
```bash
cp .env.example .env.local
# Edit .env.local with your PostgreSQL credentials
```

### 2. Run Database Migrations & Seed
```bash
# Run idempotent SQL migrations
node scripts/migrate.js

# Seed database with realistic colleges, deals, tasks, and users
node scripts/seed.js
```

### 3. Run Automated Test Suite
```bash
npm test
```

### 4. Start Development Server
```bash
npm run dev
# Visit http://localhost:3000
```

---

## 🔑 Demonstration Accounts

The portal (`/login`) includes one-click demo login buttons for all roles:

| Role | Name | Email | Password |
|---|---|---|---|
| **CEO Executive** | Dr. Rajesh Nair | `ceo@enterprise.edu` | `CeoPassword123!` |
| **HR Operations** | Ananya Iyer | `hr@enterprise.edu` | `HrPassword123!` |
| **BDM Lead 1** | Vikram Sharma | `bdm.vikram@enterprise.edu` | `BdmPassword123!` |
| **BDM Lead 2** | Priya Patel | `bdm.priya@enterprise.edu` | `BdmPassword123!` |

---

## 🐳 Docker Deployment

```bash
docker-compose up --build -d
```
Access the application at `http://localhost:3000`.

---

## 🚀 Production Start

### Required Environment Variables
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string, e.g., `postgres://user:pass@host:5432/db` |
| `SESSION_SECRET` | Secret used for signing session cookies (high‑entropy value) |
| `RATE_LIMIT_MAX_REQUESTS` *(optional)* | Maximum requests per window (default **10**) |
| `RATE_LIMIT_WINDOW_MS` *(optional)* | Time window in milliseconds (default **60000**) |

### Start the Server in Production
```bash
# Install production dependencies (if not already installed)
npm ci --production

# Run the bootstrap entry point that validates env vars and starts Next.js
npm run start:prod
```
The script will abort immediately if any required variable is missing.

### NGINX Reverse‑Proxy (recommended for production)
The project includes an `nginx.conf` that proxies traffic from port **80** to the app container.
```yaml
services:
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    depends_on:
      - app
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
```
You can place the above service definition in `docker-compose.yml` (already added).

#### Optional TLS Setup (placeholder)
To enable HTTPS, replace the `listen 80;` line in `nginx.conf` with:
```nginx
listen 443 ssl;
# ssl_certificate /etc/nginx/certs/fullchain.pem;
# ssl_certificate_key /etc/nginx/certs/privkey.pem;
```
Mount your TLS certificates into the container at `/etc/nginx/certs`.


Run the complete application and PostgreSQL database with Docker Compose:

```bash
docker-compose up --build -d
```
Access the application at `http://localhost:3000`.

---

## 📚 Documentation Index

- [Product Requirements Document (PRD)](./docs/PRD.md)
- [System Architecture & Threat Model (STRIDE)](./docs/ARCHITECTURE.md)
- [Operations & Disaster Recovery Runbook](./docs/OPERATIONS_RUNBOOK.md)
- [Role-Based User Operating Manual](./docs/USER_GUIDE.md)

---

## 🧪 Testing Coverage

The automated test suite (`npm test`) verifies:
- `tests/unit/ratioRules.test.ts`: Ratio mathematical invariants, two-party percentage split validation.
- `tests/unit/dealStateMachine.test.ts`: Role-based transition enforcement, mandatory rejection reasons.
- `tests/unit/csvSanitization.test.ts`: OWASP formula injection protection (`=`, `+`, `-`, `@`, `\t`, `\r`).
- `tests/integration/dealLifecycle.test.ts`: End-to-end deal submission, server timestamping, HR task creation, CEO review, and IDOR isolation.
