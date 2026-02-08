// Very simple in-memory rate limiter for API routes (per device fingerprint)
// Note: For production, replace with robust store (Redis) to be shared across instances.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Generate a unique device fingerprint from request headers
 * Uses User-Agent, Accept headers, and other browser characteristics
 */
export function getDeviceFingerprint(request: Request): string {
  // Get browser characteristics
  const userAgent = request.headers.get('user-agent') || '';
  const accept = request.headers.get('accept') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  const dnt = request.headers.get('dnt') || '';
  const secFetchSite = request.headers.get('sec-fetch-site') || '';
  const secFetchMode = request.headers.get('sec-fetch-mode') || '';
  const secFetchDest = request.headers.get('sec-fetch-dest') || '';
  
  // Create a hash from these characteristics
  const fingerprint = [
    userAgent,
    accept,
    acceptLanguage,
    acceptEncoding,
    dnt,
    secFetchSite,
    secFetchMode,
    secFetchDest
  ].join('|');
  
  // Simple hash function (not cryptographically secure, but sufficient for rate limiting)
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36); // Convert to base-36 string
}

/**
 * Extract client IP from request headers (fallback for very old browsers)
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

/**
 * Get the best identifier for rate limiting (device fingerprint first, IP fallback)
 */
export function getRateLimitKey(request: Request): string {
  const fingerprint = getDeviceFingerprint(request);
  const ip = getClientIp(request);
  
  // Use device fingerprint as primary identifier, IP as fallback
  // This allows multiple devices on same WiFi to have separate limits
  return fingerprint !== 'unknown' ? `device:${fingerprint}` : `ip:${ip}`;
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

/**
 * Reset the rate limit counter for a specific key
 * Useful for clearing failed login attempts after a successful login
 */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}
