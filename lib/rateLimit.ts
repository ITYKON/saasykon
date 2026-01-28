// Very simple in-memory rate limiter for API routes (per IP + key)
// Note: For production, replace with robust store (Redis) to be shared across instances.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Extract client IP from request headers
 * Checks x-forwarded-for and x-real-ip to handle CDN/proxy scenarios
 */
export function getClientIp(request: Request): string {
  // Check common headers for IP (useful behind proxies/load balancers/CDN)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one (original client)
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  
  // Fallback to 'unknown' if no IP found
  return 'unknown';
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count++;
  return { ok: true };
}
