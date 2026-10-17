# Workflow Documentation

## Overview
This document summarises the core user‑registration, authentication, and business‑deal workflow for the **College Business Deal Management & Executive Dashboard** platform.

---
### 1. Registration Flow
- **GET `/api/auth/register`** – Returns `{ hasCeo: boolean }` indicating whether a CEO already exists.
- **POST `/api/auth/register`** – Creates a new user (CEO, HR, or BDM).
  - **Single‑CEO constraint** – The backend checks if a CEO is already active; if so it returns **400** with a clear validation message.
  - Password is hashed with bcrypt and the user is stored with `is_active = TRUE`.
  - For BDM accounts a default business‑target row is inserted.
  - An audit log entry `USER_REGISTERED` is recorded.

---
### 2. Authentication
- **POST `/api/auth/login`** – Verifies credentials, creates a session, sets a `session` cookie, and logs `USER_LOGIN_SUCCESS`.
- **POST `/api/auth/forgot-password`** – Generates a secure 64‑char token, stores it in `password_resets`, and returns a reset URL.
- **POST `/api/auth/reset-password`** – Validates the token, updates the password hash, clears the token, and logs the change.

---
### 3. Role‑Based Access Control (RBAC)
| Role | Can … |
|------|-------|
| **CEO** | View all users, create HR/BDM accounts, approve/reject deals, view KPIs. |
| **HR** | View all deals, add operational notes/tasks, update HR status fields. |
| **BDM** | Create and submit deals, view own deals, edit drafts, see personal performance. |

All permission checks are enforced **server‑side** on every endpoint (list, read, update, export, etc.).

---
### 4. End‑to‑End Test Scripts
- **`scripts/test-registration-flow.js`** – Covers registration, password‑reset, and a single‑deal flow.
- **`scripts/test-e2e-workflow.js`** – Validates the complete multi‑user lifecycle:
  1. Ensure a CEO exists (creates one only if needed).
  2. CEO logs in, fetches team list, creates HR & BDM.
  3. BDM drafts and submits a deal.
  4. CEO approves the deal.
  5. HR creates an operational task.
  6. KPI verification.
- Run any script with `node <script>.js`. All steps should exit with code 0.

---
### 5. How to Run the Project
```bash
# Install dependencies
npm install

# Run database migrations (adds password_resets table, etc.)
npm run db:migrate

# Development server (auto‑reload)
npm run dev   # opens http://localhost:3000

# Production build & start
npm run build
npm start
```

---
### 6. Next Development Steps
1. Add additional integration tests for RBAC edge cases (HR cannot approve deals, BDM cannot edit approved deals, etc.).
2. Polish UI – tooltip on the registration page explaining the *single‑CEO* rule.
3. Deploy to your chosen environment (Docker, PM2, Vercel, etc.).

---
*Generated on 2026‑10‑17.*
