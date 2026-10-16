# EduDeal Enterprise Platform
## Role-Based User Manual & Operating Guide

**Document Version:** 1.0.0  
**Classification:** Enterprise Training Documentation  
**Audience:** BDM Leads, Campus Operations HR, CEO & Executive Leadership  

---

## 1. Quick Start & Test Access

The platform provides pre-configured role accounts for demonstration and evaluation:

| Role | User Persona | Email Address | Password |
|---|---|---|---|
| **CEO** | Dr. Rajesh Nair | `ceo@enterprise.edu` | `CeoPassword123!` |
| **HR** | Ananya Iyer | `hr@enterprise.edu` | `HrPassword123!` |
| **BDM 1** | Vikram Sharma | `bdm.vikram@enterprise.edu` | `BdmPassword123!` |
| **BDM 2** | Priya Patel | `bdm.priya@enterprise.edu` | `BdmPassword123!` |

On the `/login` portal, you can click on any of the four "One-Click Role Demonstration Accounts" to populate the credentials immediately.

---

## 2. BDM (Business Development & Management) User Guide

### 2.1 Submitting a New College Deal
1. Log in with your BDM credentials.
2. From the sidebar or dashboard, click **"Submit New Deal"** (`/bdm/deals/new`).
3. **Select College:** Choose from the registered colleges list. If the college is not registered, click **"Register New College"** and enter institutional details. The system checks for duplicate institutions before creation.
4. **Primary Representative:** Choose the primary college official (e.g. Principal, Director, Dean).
5. **Commercial Framework:**
   - Select Ratio Model (e.g. `Revenue Sharing % Company / % College`).
   - If Revenue Sharing is selected, adjust the percentages. Note that the sum must equal exactly 100.00%.
   - Enter the total contract value in INR.
6. **Agreed Dates & Terms:** Set the effective contract start and expiration dates, and specify payment milestones.
7. **Action Options:**
   - Click **"Save as Draft"** if details are incomplete.
   - Click **"Submit Deal for Review"** when finalized.
8. **Server Timestamping:** Upon submission, the platform assigns a trusted UTC server timestamp (`submitted_at`) that cannot be modified. The deal immediately enters the executive review queue.

### 2.2 Resubmitting Deals Returned for Correction
1. If the CEO returns a deal with requested revisions, it appears in your dashboard under **"Needs Correction"**.
2. Open the deal detail view (`/bdm/deals/[id]`).
3. Read the executive feedback remarks at the top of the page.
4. Update the title, scope, or terms directly in the revision form.
5. Click **"Save Revisions & Resubmit Deal"**.

---

## 3. HR (Human Resources) User Guide

### 3.1 Monitoring Ingestion Stream
1. Log in with HR credentials.
2. The **HR Operations Dashboard** (`/hr/dashboard`) receives new college submissions in real-time as soon as field BDMs submit them.
3. Track deals awaiting onboarding, total active colleges, and pending tasks.

### 3.2 Managing Operational Tasks
1. Navigate to **"Operational Tasks"** (`/hr/tasks`).
2. When a deal is approved by the CEO, an onboarding task (*"Initiate Campus Onboarding & MoU Signoff"*) is automatically created for HR.
3. Click **"Create Operational Task"** to add custom deliverables such as:
   - MoU legal vetting
   - Faculty coordination & schedule alignment
   - Technical trainer deployment
4. Update statuses from `PENDING` to `IN_PROGRESS`, add internal notes, and click **"Mark Done"** when completed.

---

## 4. CEO (Chief Executive Officer) User Guide

### 4.1 Executive Overview & KPIs
1. Log in with CEO credentials.
2. The **Executive Dashboard** (`/ceo/dashboard`) provides real-time organizational KPIs:
   - Total Registered Colleges
   - Clean Deal Approval Rate: `(Approved / Reviewed Decided Deals) * 100`
   - BDM Team Productivity comparison table
   - State & Geographic penetration metrics
   - Service category distribution

### 4.2 Deciding on Deals in the Approval Queue
1. Click **"Approval Queue"** (`/ceo/approvals`).
2. All deals in `SUBMITTED` or `UNDER_REVIEW` status appear in the queue.
3. For each deal, you can:
   - **Review:** Initiate formal review (`UNDER_REVIEW`).
   - **Approve:** Authorize commercial terms. This automatically creates an HR onboarding task and notifies the BDM.
   - **Correction:** Return the deal to the BDM with mandatory correction instructions.
   - **Reject:** Decline the deal with a mandatory documented rejection reason (minimum 5 characters).

### 4.3 Reports, Exports & Security Audit
1. Navigate to **"Reports & Export"** (`/ceo/reports`) to filter partnerships and export sanitized CSV reports protected against formula injection.
2. Navigate to **"Security & Audit Logs"** (`/ceo/audit-logs`) to inspect immutable logs of all system events, actors, state diffs, timestamps, and IP addresses.
