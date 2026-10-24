// src/server/startup/validateEnv.ts
/**
 * Validate required environment variables for production.
 * Throws an Error if any mandatory variable is missing or empty.
 * Optional variables are allowed to be undefined.
 */
export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'SESSION_SECRET',
  ];

  const missing = required.filter((name) => !process.env[name] || process.env[name]!.trim() === '');

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Provide defaults for rate‑limit configuration if not set.
  if (!process.env.RATE_LIMIT_MAX_REQUESTS) {
    process.env.RATE_LIMIT_MAX_REQUESTS = '10';
  }
  if (!process.env.RATE_LIMIT_WINDOW_MS) {
    process.env.RATE_LIMIT_WINDOW_MS = `${60 * 1000}`; // 1 minute
  }
}
