// src/server/security/rateLimiter.ts

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding rate limiter.
 * @param key unique identifier (e.g. IP + endpoint)
 * @param maxRequests maximum allowed requests in window
 * @param windowMs window size in milliseconds
 */
export function checkRateLimit(key: string, maxRequests = 5, windowMs = 15 * 60 * 1000): {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || record.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetInSeconds: Math.ceil(windowMs / 1000) };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
  };
}

export function resetRateLimit(key: string): void {
  memoryStore.delete(key);
}
