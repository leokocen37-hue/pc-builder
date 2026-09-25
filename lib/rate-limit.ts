// Per-IP rate limiting, in memory.
//
// Deliberately not Redis: a serverless instance holds this map only for its own
// lifetime, so a determined attacker spreading requests across cold starts gets
// more through than the numbers below suggest. That is the trade being made —
// this stops the ordinary case (a script hammering one endpoint from one
// address, a bot filling the contact form) without adding a database to the
// critical path of checkout. Swap in a shared store if abuse survives it.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Drop expired buckets so a long-lived instance doesn't grow forever. */
function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count++;
  return { ok: true };
}

/**
 * The caller's address. Vercel sets x-forwarded-for; the leftmost entry is the
 * client, the rest are proxies. Falls back to a constant so a missing header
 * degrades to one shared bucket rather than to no limit at all.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** 429 with the standard header, so a well-behaved client backs off. */
export function tooManyRequests(retryAfter: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
  });
}
