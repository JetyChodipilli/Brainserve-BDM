# College Business Deal Management & Executive Dashboard Platform
## Architecture & Technical Design Document

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Architecture Style:** Layered Modular Monolith (Clean Architecture)  

---

## 1. System Architecture Overview

```
                                      +---------------------------------------------+
                                      |                CLIENT LAYER                 |
                                      |  Next.js 15+ App Router, React 19, Tailwind |
                                      |  Lucide Icons, Recharts, Responsive UI      |
                                      +----------------------+----------------------+
                                                             |
                                                       HTTPS / JSON
                                                             |
                                      +----------------------v----------------------+
                                      |               SECURITY LAYER                |
                                      |  - HTTP-only Signed Session Cookies         |
                                      |  - Server-side RBAC Guard Middleware        |
                                      |  - Rate Limiter (Token Bucket / Memory)     |
                                      |  - Input Validation via Zod Schemas         |
                                      |  - CSRF Header Protection                   |
                                      +----------------------+----------------------+
                                                             |
                                      +----------------------v----------------------+
                                      |              APPLICATION LAYER              |
                                      |  - AuthService         - DealService        |
                                      |  - CollegeService      - HRTaskService      |
                                      |  - KPIService          - ExportService      |
                                      |  - AuditService        - NotificationService|
                                      +----------------------+----------------------+
                                                             |
                                      +----------------------v----------------------+
                                      |                DOMAIN LAYER                 |
                                      |  - Deal State Machine (Pure Transition Fns) |
                                      |  - Commercial Ratio Normalizer & Invariants |
                                      |  - Entity Models & Value Objects            |
                                      +----------------------+----------------------+
                                                             |
                                      +----------------------v----------------------+
                                      |             PERSISTENCE LAYER               |
                                      |  - PostgreSQL 18 Relational Database        |
                                      |  - Connection Pool (pg.Pool)                |
                                      |  - ACID Transaction Execution Engine        |
                                      |  - Version-Controlled SQL Migrations        |
                                      +---------------------------------------------+
```

---

## 2. Relational Schema & Entity-Relationship (ER) Design

### 2.1 Database Tables & Constraints

```mermaid
erDiagram
    USERS ||--o{ USER_SESSIONS : maintains
    USERS ||--o{ DEALS : creates
    USERS ||--o{ HR_TASKS : assigned_to
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ AUDIT_LOGS : performs

    COLLEGES ||--|{ COLLEGE_CONTACTS : has
    COLLEGES ||--o{ DEALS : associates

    DEALS ||--|{ DEAL_VERSIONS : tracks
    DEALS ||--|{ DEAL_STATUS_HISTORY : records
    DEALS ||--o{ HR_TASKS : generates
    DEALS ||--o{ ATTACHMENTS : includes

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        string role "BDM | HR | CEO"
        string phone
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    COLLEGES {
        uuid id PK
        string legal_name
        string normalized_name
        string college_code UK
        string institution_type
        string affiliated_university
        string state
        string district
        string city
        string pin_code
        text address
        string website
        timestamp created_at
        timestamp updated_at
    }

    COLLEGE_CONTACTS {
        uuid id PK
        uuid college_id FK
        string full_name
        string designation
        string phone
        string email
        boolean is_primary
        timestamp created_at
    }

    DEALS {
        uuid id PK
        string deal_code UK
        uuid college_id FK
        uuid primary_contact_id FK
        uuid bdm_id FK
        string title
        text description
        string business_category
        string status "DRAFT | SUBMITTED | UNDER_REVIEW | APPROVED | ACTIVE | REJECTED | NEEDS_CORRECTION | COMPLETED | CANCELLED"
        string ratio_type
        numeric company_percentage
        numeric college_percentage
        numeric agreement_value
        string currency
        text ratio_terms_description
        date contract_start_date
        date contract_end_date
        text terms_and_conditions
        text additional_remarks
        timestamp submitted_at "TRUSTED SERVER TIMESTAMP (UTC)"
        uuid reviewed_by FK
        timestamp reviewed_at
        text review_remarks
        integer version_number
        timestamp created_at
        timestamp updated_at
    }

    DEAL_STATUS_HISTORY {
        uuid id PK
        uuid deal_id FK
        string from_status
        string to_status
        uuid actor_id FK
        text reason
        timestamp changed_at
    }

    HR_TASKS {
        uuid id PK
        uuid deal_id FK
        uuid college_id FK
        string title
        text description
        uuid assigned_to FK
        string status "PENDING | IN_PROGRESS | COMPLETED | BLOCKED | OVERDUE"
        date due_date
        timestamp completed_at
        text internal_notes
        timestamp created_at
        timestamp updated_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid actor_id FK
        string actor_email
        string actor_role
        string action
        string entity_name
        string entity_id
        jsonb previous_state
        jsonb new_state
        string ip_address
        string user_agent
        timestamp created_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string title
        text message
        string category "DEAL_SUBMITTED | DEAL_REVIEWED | TASK_ASSIGNED | TASK_OVERDUE | SYSTEM"
        uuid reference_id
        string reference_type
        boolean is_read
        timestamp created_at
    }
```

---

## 3. Server-Enforced RBAC & Record-Level Authorization

| Operation | Resource | BDM | HR | CEO | Enforcement Layer |
|---|---|:---:|:---:|:---:|---|
| `POST /api/auth/login` | Session | Allow | Allow | Allow | Public Rate-limited |
| `GET /api/colleges` | College Directory | Allow | Allow | Allow | Authenticated Session |
| `POST /api/colleges` | College Creation | Allow | Allow | Allow | Authenticated Session |
| `GET /api/deals` | Deal List | **Own Deals Only** | **All Deals** | **All Deals** | Filtered by SQL `WHERE bdm_id = $auth_id` |
| `GET /api/deals/:id` | Deal Details | **Own Deals Only** | Allow | Allow | Record-level Ownership Check |
| `POST /api/deals` | Create Draft Deal | **Allow** | Deny | Deny | BDM Role Check |
| `PUT /api/deals/:id` | Update Draft / Correction | **Own Drafts / Needs Correction** | Deny | Deny | State & Ownership Check |
| `POST /api/deals/:id/submit` | Submit Deal | **Own Deals in DRAFT/CORRECTION** | Deny | Deny | State & Server Timestamp |
| `POST /api/deals/:id/review` | Mark Under Review | Deny | Deny | **Allow** | CEO Role Check |
| `POST /api/deals/:id/approve` | Approve Deal | Deny | Deny | **Allow** | CEO Role Check |
| `POST /api/deals/:id/reject` | Reject Deal | Deny | Deny | **Allow** | CEO Role Check (Reason required) |
| `POST /api/deals/:id/request-correction` | Return for Correction | Deny | Deny | **Allow** | CEO Role Check (Remarks required) |
| `GET /api/hr-tasks` | HR Task List | Deny | **Allow** | **Allow** | Role Check |
| `POST /api/hr-tasks` | Create HR Task | Deny | **Allow** | **Allow** | Role Check |
| `PATCH /api/hr-tasks/:id` | Update Operational Task | Deny | **Allow** | **Allow** | Role Check |
| `GET /api/dashboard/kpis` | KPI Aggregates | **BDM Scoped** | **HR Scoped** | **Organization Scoped** | Filtered query per Role |
| `GET /api/reports/export` | CSV / Excel Export | **Own Deals** | **Operational Data** | **Full Audit & Deals** | Export Sanitization & Audit Log |
| `GET /api/audit-logs` | Security & Deal Audit | Deny | Deny | **Allow** | CEO Only |
| `GET /api/users` | User Directory | Deny | Deny | **Allow** | CEO Only |

---

## 4. Deal State Machine Specifications

```
                     +-----------------------------+
                     |            DRAFT            |
                     +--------------+--------------+
                                    |
                            submit() (BDM only)
                            [Server timestamp attached]
                                    |
                                    v
                     +-----------------------------+
      +------------->|          SUBMITTED          |<------------+
      |              +--------------+--------------+             |
      |                             |                            |
      |               review() (CEO)|                            |
      |                             v                            |
      |              +-----------------------------+             |
      |              |        UNDER_REVIEW         |             |
      |              +----+---------+---------+----+             |
      |                   |         |         |                  |
      |  request_correction()       |         | reject() (CEO)   |
      |                   |         |         |                  |
      |                   v         |         v                  |
+-----+--------------+  +-----------|----+  +--------------------+
|  NEEDS_CORRECTION  |  |           |    |  |      REJECTED      |
+--------------------+  |           |    |  +--------------------+
                        |           |
                        | approve() (CEO)
                        |           |
                        v           v
                     +-----------------------------+
                     |          APPROVED           |
                     +--------------+--------------+
                                    |
                           onboard() / start_date
                                    |
                                    v
                     +-----------------------------+
                     |           ACTIVE            |
                     +--------------+--------------+
                                    |
                           term_end() / complete()
                                    |
                                    v
                     +-----------------------------+
                     |          COMPLETED          |
                     +-----------------------------+
```

---

## 5. Security & Threat Modeling (STRIDE)

| Threat Category | Potential Attack Vector | Platform Mitigation Architecture |
|---|---|---|
| **Spoofing** | Session token hijacking, fabricated user identity | Cryptographically random UUID v4 sessions stored in DB, HTTP-only Secure SameSite cookies, session invalidation on logout. |
| **Tampering** | Modifying client-side deal submission timestamps or owner ID | Backend ignores all client timestamps, generating UTC `submitted_at` during PostgreSQL commit transaction; `bdm_id` is assigned directly from validated server session. |
| **Repudiation** | Denying approval, rejection, or commercial term amendments | Immutable `deal_status_history` and `audit_logs` capturing actor ID, previous/new state diffs, IP address, user-agent, and reason. |
| **Information Disclosure** | IDOR on deals; Horizontal privilege escalation between BDMs | SQL queries strictly enforce tenancy predicates: `WHERE bdm_id = $session.userId` for BDM roles; direct record queries verify ownership before returning entity. |
| **Denial of Service** | Exhaustion of DB pool via unthrottled exports or login spam | Rate limiting on auth endpoints (5 req/15min) and export endpoints; DB connection pooling with explicit timeouts. |
| **Elevation of Privilege** | BDM attempting to approve deal or elevate role | Backend enforces role checks in middleware and individual service handlers; role enum cannot be modified through user update endpoints. |
| **CSV / Formula Injection** | Malicious formula payloads (`=cmd|' /C ...'`) in college names or descriptions | Export service sanitizes all string output cells by escaping leading formula trigger characters (`=`, `+`, `-`, `@`, `\t`, `\r`). |
