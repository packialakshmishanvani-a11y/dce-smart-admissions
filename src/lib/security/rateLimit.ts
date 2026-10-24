/**
 * In-memory sliding-window rate limiter.
 *
 * This protects a single server process (local dev, one container, one VM).
 * On serverless or multi-instance hosting each instance keeps its own window,
 * so put a shared limiter in front for production — e.g. Upstash Redis
 * (@upstash/ratelimit), Vercel Firewall rate-limit rules, or Cloudflare WAF.
 */
export interface RateLimiter {
  check(key: string, now?: number): { allowed: boolean; retryAfterSeconds: number };
}

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    check(key, now = Date.now()) {
      const windowStart = now - windowMs;
      const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);

      if (recent.length >= limit) {
        hits.set(key, recent);
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
      }

      recent.push(now);
      hits.set(key, recent);

      // Keep memory bounded under a flood of distinct keys.
      if (hits.size > 5000) {
        for (const [k, times] of hits) if (times.every((t) => t <= windowStart)) hits.delete(k);
      }
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

/** Best-effort client key. Only trust x-forwarded-for behind a proxy that sets it. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "anonymous";
}
