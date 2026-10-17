# Security Assumptions (Finalized)

## Multi‑Factor Authentication (MFA)
- **CEO** accounts **must** use MFA (TOTP – Google Authenticator or similar). The MFA challenge is enforced on every login and on any privileged action (user provisioning, deal approval).
- **HR** accounts **should** use MFA; it is enabled by default and can be opted‑out only by an administrator (CEO).
- **BDM** accounts **do not** require MFA, but they can enable it voluntarily from the profile page.

## Forgot‑Password Token
- Tokens are generated using `crypto.randomBytes(32)` and stored **hashed** (bcrypt) in the `password_resets` table.
- Token validity is **15 minutes** from creation.
- Tokens are **single‑use**; once a password is successfully reset the token row is deleted.
- The reset endpoint returns a generic `200 OK` response regardless of whether the email exists, to prevent account enumeration.

## Rate Limiting
- Login: max **5 attempts per minute** per IP address.
- Forgot‑Password: max **3 requests per hour** per email address.

## CSRF & CORS
- CSRF protection applied via `csurf` middleware for all state‑changing requests.
- CORS is locked to the same origin (`https://<your‑domain>`) and allows only `GET`, `POST`, `PUT`, `PATCH`, `DELETE` methods.

## Content Security Policy
- Enforced via `helmet` with a restrictive CSP that only allows scripts/styles from the same origin and the Tailwind CDN.

These assumptions have been **finalized** and are now reflected in the implementation and documentation.
