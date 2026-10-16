# College Business Deal Management & Executive Dashboard Platform
## Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Target Release:** MVP v1.0.0  
**Owner:** Product Management & Principal Systems Architecture Team  
**System Classification:** Enterprise Business Application  

---

## 1. Executive Summary & Product Vision

### 1.1 Executive Summary
Educational service organizations rely heavily on Business Development and Management (BDM) teams establishing partnerships with colleges and universities across states and districts. Currently, commercial agreements, institutional contacts, revenue-sharing ratios, and post-signing operational follow-ups are scattered across personal spreadsheets, email threads, and messaging apps. This introduces critical operational risks: untracked deals, lack of commercial transparency, delayed HR onboarding, inaccurate revenue forecasting, and zero verifiable audit trail.

The **College Business Deal Management & Executive Dashboard Platform** is an enterprise-grade, secure, multi-tenant-ready web platform that unifies the complete institutional deal lifecycle:
1. **BDM Field Submission:** Field BDMs capture verified college contacts, commercial ratios, and agreement terms with guaranteed server-side timestamping.
2. **Executive Governance:** The CEO and executive leadership obtain real-time visibility into organization-wide pipelines, state-wise institutional coverage, BDM productivity, and hold exclusive authority to approve, reject, or request corrections on commercial terms.
3. **Operational Handoff:** Authorized HR teams receive immediate handoff upon deal submission/approval to execute campus onboarding, institutional liaison, compliance verification, and operational task tracking.
4. **Auditability & Integrity:** Every commercial revision, transition, and export is recorded in an immutable audit ledger with cryptographic session traceability.

### 1.2 Product Vision
To be the definitive system of record for higher-education institutional partnerships, transforming field sales activities into structured, auditable, and operationally actionable business intelligence.

---

## 2. Problem Statement & Business Objectives

### 2.1 Problem Statement
- **Lack of Deal Provenance:** No verified timestamping of when deals are agreed upon versus when they are reported.
- **Commercial Discrepancy:** Ambiguity around "business ratio" terms (e.g., college commission vs. revenue sharing vs. per-student pricing), causing revenue leakage and reconciliation disputes.
- **Siloed Execution:** HR teams learn about signed college partnerships weeks late, causing missed academic calendar deadlines.
- **Reporting Inaccuracies:** Executives rely on self-reported, manually aggregated spreadsheets that cannot be independently audited.
- **Security & Data Exposure:** Lack of Role-Based Access Control (RBAC) allows horizontal access across regional BDM pipelines.

### 2.2 Measurable Success Criteria
| Metric ID | Objective | Baseline | Target (MVP) | Measurement Window |
|---|---|---|---|---|
| **MTR-001** | Deal submission to HR visibility lag | 5-14 days | < 5 seconds | Real-time upon submission |
| **MTR-002** | Unverified or missing agreement terms | 32% of deals | 0% (Schema enforced) | 100% of persisted deals |
| **MTR-003** | Executive KPI freshness | Weekly/Monthly manual pull | Instant (< 500ms query) | On dashboard load |
| **MTR-004** | Unauthorized record access attempts | Unknown | 0 granted (100% blocked & logged) | Continuous |
| **MTR-005** | Deal audit trail completeness | 0% | 100% transitions captured | End-to-end |

---

## 3. Personas and Role Definitions

The system defines exactly three primary business roles with strict separation of duties:

### 3.1 Role A: Business Development and Management (BDM)
- **Primary Persona:** Vikram Sharma, Senior BDM Executive (Field & Regional Partnerships).
- **Core Responsibilities:** Institutional outreach, meeting college principals and placement directors, commercial negotiation within company guidelines, deal submission, and draft maintenance.
- **Access Boundary:** Access strictly confined to own submitted and drafted deals. Cannot view other BDMs' pipelines, company-wide executive KPIs, or approve commercial terms.

### 3.2 Role B: Human Resources (HR)
- **Primary Persona:** Ananya Iyer, Head of Campus Operations & Institutional HR.
- **Core Responsibilities:** Campus onboarding execution, trainer allocation, MoU compliance verification, representative relationship management, operational task tracking, and milestone completion.
- **Access Boundary:** Access to all submitted, approved, and active deals across colleges for operational tracking. Cannot alter commercial revenue ratios or approve commercial terms.

### 3.3 Role C: Chief Executive Officer (CEO)
- **Primary Persona:** Dr. Rajesh Nair, Managing Director & CEO.
- **Core Responsibilities:** Commercial governance, deal approval/rejection, margin protection, target setting, BDM performance monitoring, strategic institutional coverage analysis.
- **Access Boundary:** Organization-wide read and executive action authority. Exclusive right to approve or reject commercial terms, request corrections, manage system users, and inspect immutable audit logs.

---

## 4. Stakeholder Analysis

| Stakeholder Group | Primary Interest | Key Concerns | Communication Cadence |
|---|---|---|---|
| **BDM Representatives** | Fast field entry, clear draft saving, tracking approval status | Transparent targets, no lost drafts | Daily |
| **HR Operations** | Immediate notification of closed deals, operational task assignment | Timelines, representative contact validity | Daily / Task-driven |
| **CEO & Executive Board** | Margin accuracy, BDM productivity, geographic expansion | Data integrity, unauthorized discount / ratio tampering | Real-time dashboards / Weekly reviews |
| **IT & Security** | RBAC enforcement, data encryption, auditability, zero data leakage | OWASP compliance, secure sessions, disaster recovery | Continuous monitoring |

---

## 5. Functional Requirements (FR)

### 5.1 Authentication & User Session Management
- **FR-AUTH-001:** System shall authenticate users via email and strong password with bcrypt/argon2 hashing (work factor >= 12).
- **FR-AUTH-002:** Privileged roles (CEO) and standard roles shall maintain cryptographically signed, HTTP-only, SameSite=Lax/Strict session tokens with 8-hour absolute expiration and sliding activity revocation.
- **FR-AUTH-003:** Authentication endpoints shall enforce rate-limiting (maximum 5 failed attempts per IP/user window of 15 minutes) and account enumeration protection.
- **FR-AUTH-004:** Passwords must adhere to NIST SP 800-63B standards (minimum 10 characters, requiring uppercase, lowercase, numeric, and special characters).

### 5.2 College Management Module
- **FR-COL-001:** System shall maintain institutional records including: unique UUID, legal college name, AISHE/institutional code (optional), institution type (Engineering, Management, Arts & Science, Medical, Polytechnic, Autonomous University), state, district, city, pin code, physical address, and official website.
- **FR-COL-002:** System shall support multiple institutional contacts/representatives per college (Name, Designation, Direct Phone, Official Email, Primary flag).
- **FR-COL-003:** System shall implement fuzzy and normalized duplicate college detection based on normalized college name and city before creating a new institution.
- **FR-COL-004:** Authorized users shall be able to search and filter colleges by state, district, institution type, and active deal status.

### 5.3 Business Deal Management Module
- **FR-DEAL-001:** BDM shall be able to create a deal in `DRAFT` status, saving partial information safely.
- **FR-DEAL-002:** A deal submission (`SUBMITTED`) must require mandatory fields:
  - Valid College Reference
  - Primary College Representative (Name, Designation, Phone, Email)
  - Deal Title & Comprehensive Description
  - Business Category (Campus Recruitment Training, Center of Excellence, Faculty Development, Lab Infrastructure, Joint Certification)
  - Explicit Commercial Ratio Model (Type, Values, Currency, Unit)
  - Agreement Validity Dates (Start Date, End Date)
  - Terms & Conditions
- **FR-DEAL-003 [CRITICAL TIMESTAMP RULE]:** The system must generate `submitted_at` exclusively on the backend server using trusted UTC timestamps at the instant of transaction commit. Client-supplied submission timestamps must be ignored.
- **FR-DEAL-004:** Each deal submission must link automatically to the authenticated BDM's user identifier. Client requests attempting to submit on behalf of another BDM must be rejected with 403 Forbidden.
- **FR-DEAL-005:** Once submitted, a deal becomes immediately immutable to the BDM unless explicitly transitioned by the CEO to `NEEDS_CORRECTION`.

### 5.4 Commercial Ratio Definition & Invariants
- **FR-RATIO-001:** The system shall strictly define commercial ratios using structured types:
  1. `REVENUE_SHARE_PERCENTAGE`: Requires `company_percentage` + `college_percentage` = 100.00% (decimal precision: 2 places).
  2. `COLLEGE_COMMISSION_PERCENTAGE`: Requires `college_percentage` between 0.00% and 100.00%.
  3. `COMPANY_SHARE_PERCENTAGE`: Requires `company_percentage` between 0.00% and 100.00%.
  4. `FIXED_FEE_PER_STUDENT`: Requires monetary unit amount per student in specified currency.
  5. `CUSTOM_CONTRACTUAL_RATIO`: Requires structured terms description and approved baseline metrics.
- **FR-RATIO-002:** Exact decimal data types (`NUMERIC(5,2)` for percentages, `NUMERIC(14,2)` for monetary values) shall be used throughout the database and API. Floating point arithmetic is prohibited.
- **FR-RATIO-003:** Speculative revenue, profit, or commission KPIs must NOT be calculated or displayed without verified financial billing data. Displays must accurately show agreed commercial parameters.

### 5.5 Deal Lifecycle & Executive Approval
- **FR-WFL-001:** Deal state machine shall enforce valid transitions only:
  - `DRAFT` -> `SUBMITTED`
  - `SUBMITTED` -> `UNDER_REVIEW` (CEO review action)
  - `SUBMITTED` / `UNDER_REVIEW` -> `APPROVED` (CEO only)
  - `SUBMITTED` / `UNDER_REVIEW` -> `REJECTED` (CEO only, mandatory rejection reason)
  - `SUBMITTED` / `UNDER_REVIEW` -> `NEEDS_CORRECTION` (CEO only, mandatory remarks)
  - `NEEDS_CORRECTION` -> `SUBMITTED` (BDM resubmission after corrections)
  - `APPROVED` -> `ACTIVE` (Upon contract start date & HR onboarding initialization)
  - `ACTIVE` -> `COMPLETED` (Upon contract expiration or fulfillment)
  - `APPROVED` / `ACTIVE` -> `CANCELLED` (CEO only, with auditable justification)
- **FR-WFL-002:** Direct transition from `DRAFT` or `SUBMITTED` directly to `APPROVED` without CEO authorization is blocked.
- **FR-WFL-003:** Every transition shall persist a record into `deal_status_history` and `audit_logs` including actor ID, previous status, new status, timestamp, IP address, and comments.

### 5.6 HR Operational Tracking Module
- **FR-HR-001:** HR dashboard shall automatically ingest deals upon submission and approval.
- **FR-HR-002:** HR users can create, assign, and update operational onboarding tasks associated with a deal (e.g., "MoU Signing & Legal Vetting", "Syllabus & Curriculum Signoff", "Trainer Deployment", "Portal Account Setup").
- **FR-HR-003:** Tasks must track: Task Title, Assigned HR Owner, Due Date, Completed Date, Operational Status (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`, `OVERDUE`), and Internal Remarks.
- **FR-HR-004:** HR updates must not alter the commercial agreement values or deal approval status.

### 5.7 Dashboards & Analytics
- **FR-DASH-001 (BDM Dashboard):** Displays BDM's own metrics: Total Deals Created, Drafts, Submitted, In Review, Approved, Active, Rejected, Needs Correction, Personal Target vs. Achievement, Recent Activity, and College Pipeline.
- **FR-DASH-002 (HR Dashboard):** Displays operational metrics: Newly Submitted Deals Awaiting Review, Approved Deals Awaiting Onboarding, Total Active College Partnerships, Pending Tasks, In-Progress Tasks, Completed Tasks, Overdue Tasks, Workload distribution across HR team.
- **FR-DASH-003 (CEO Dashboard):** Displays organization-wide executive KPIs:
  - Total Registered Colleges
  - Total Deals by Status (Submitted, In Review, Approved, Active, Rejected, Completed)
  - Clean Approval Rate: `Approved Deals / (Approved + Rejected Deals) * 100` (excluding pending reviews)
  - BDM Performance Breakdown (Deals submitted, approved, rejected per BDM)
  - State & Geographic Distribution
  - Category-wise Distribution
  - Target vs. Actual Pipeline
  - Real-time recent institutional submissions stream.

### 5.8 Reporting & Secure Export
- **FR-REP-001:** Support filtering deals by Date Range, College, State, BDM, Status, Category, and Ratio Type.
- **FR-REP-002:** Export datasets to CSV and Excel formats.
- **FR-REP-003 [SECURITY]:** Export generator must sanitize every cell value against CSV/Formula Injection (OWASP ASVS 5.3.3) by prefixing any string starting with `=`, `+`, `-`, `@`, `\t`, `\r` with a single apostrophe `'`.
- **FR-REP-004:** Export events must generate an audit log entry detailing who exported what dataset, row count, and applied filter criteria.

### 5.9 In-App Notification Center
- **FR-NOTIF-001:** System shall generate notifications for:
  - New Deal Submission -> Alerts CEO and HR
  - Deal Approved / Rejected / Needs Correction -> Alerts Deal BDM
  - HR Task Assigned / Due / Overdue -> Alerts Assigned HR Owner
- **FR-NOTIF-002:** Notifications must strictly conform to recipient authorization scope (never leak unapproved commercial margins to unauthorized personnel).

---

## 6. Non-Functional Requirements (NFR)

### 6.1 Performance & Scalability
- **NFR-PERF-001:** API response times for standard queries (p95) < 200ms; Dashboard aggregate queries (p95) < 350ms under concurrent loads.
- **NFR-PERF-002:** Database tables must feature compound and covering indexes on high-frequency query paths (`(bdm_id, status)`, `(college_id, created_at)`, `(status, submitted_at)`).
- **NFR-PERF-003:** Server-side pagination (default 20, max 100 items per page) required for all list endpoints.

### 6.2 Security & Compliance (SEC)
- **NFR-SEC-001:** Zero Trust architecture: every route and service method performs explicit role and ownership verification.
- **NFR-SEC-002:** Defense against OWASP Top 10: parameterized SQL queries exclusively (zero raw string concatenation), output encoding, strict CSP headers, and CSRF token verification.
- **NFR-SEC-003:** Data protection in accordance with India's Digital Personal Data Protection (DPDP) Act 2023: minimization of personal representative data, masking of contact numbers in public views, encryption in transit (TLS 1.3), and encryption at rest.

### 6.3 Reliability & Availability
- **NFR-REL-001:** Database transactions with strict ACID semantics (`SERIALIZABLE` or `READ COMMITTED` with row-level locks where concurrent revisions occur).
- **NFR-REL-002:** Graceful error handling with standardized JSON error envelopes; zero internal stack trace exposure in non-development environments.

### 6.4 Maintainability & Code Quality
- **NFR-MNT-001:** Layered modular architecture: Presentation Layer (Next.js UI) -> API Routing -> Application/Service Layer -> Domain Logic -> Data Access Layer.
- **NFR-MNT-002:** 100% TypeScript type coverage with strict mode enabled; schema validation through Zod on all incoming boundaries.

---

## 7. Requirement Traceability Matrix (RTM)

| Req ID | Component / Layer | Test Verification | Status |
|---|---|---|---|
| **FR-AUTH-001..004** | `src/server/security/auth.ts` | Unit & API Auth Tests | Complete |
| **FR-COL-001..004** | `src/server/services/collegeService.ts` | Duplicate & Search Tests | Complete |
| **FR-DEAL-001..005** | `src/server/services/dealService.ts` | Persistence & Server Timestamp Tests | Complete |
| **FR-RATIO-001..003** | `src/server/domain/ratioRules.ts` | Mathematical Invariant Tests | Complete |
| **FR-WFL-001..003** | `src/server/domain/dealStateMachine.ts` | State Transition & RBAC Tests | Complete |
| **FR-HR-001..004** | `src/server/services/hrTaskService.ts` | Task Lifecycle & Operational Tests | Complete |
| **FR-DASH-001..003** | `src/server/services/kpiService.ts` | Aggregation & Isolation Tests | Complete |
| **FR-REP-001..004** | `src/server/services/exportService.ts` | Formula Injection & Filter Tests | Complete |
| **FR-NOTIF-001..002** | `src/server/services/notificationService.ts` | Event Trigger & Delivery Tests | Complete |
