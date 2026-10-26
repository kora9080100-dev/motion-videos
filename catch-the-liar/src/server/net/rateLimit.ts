/** Fixed-window counter per key (e.g. room creations per IP per minute). */
export class WindowLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Returns true when the action is allowed. */
  hit(key: string): boolean {
    const t = this.now();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= t) {
      this.hits.set(key, { count: 1, resetAt: t + this.windowMs });
      this.sweep(t);
      return true;
    }
    entry.count += 1;
    return entry.count <= this.limit;
  }

  /** True when the key already used up its allowance in the current window (no counting). */
  blocked(key: string): boolean {
    const entry = this.hits.get(key);
    return !!entry && entry.resetAt > this.now() && entry.count >= this.limit;
  }

  private sweep(t: number): void {
    if (this.hits.size < 5000) return;
    for (const [k, v] of this.hits) if (v.resetAt <= t) this.hits.delete(k);
  }
}

/** Token bucket for per-connection message flooding protection. */
export class TokenBucket {
  private tokens: number;
  private last: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerSecond: number,
    private readonly now: () => number = Date.now,
  ) {
    this.tokens = capacity;
    this.last = now();
  }

  take(): boolean {
    const t = this.now();
    this.tokens = Math.min(this.capacity, this.tokens + ((t - this.last) / 1000) * this.refillPerSecond);
    this.last = t;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

export function clientIp(headers: Record<string, string | string[] | undefined>, remote: string | undefined, trustProxy: boolean): string {
  if (trustProxy) {
    // Set by Cloudflare-fronted hosts (Render) and not spoofable through them.
    for (const h of ['cf-connecting-ip', 'true-client-ip']) {
      const v = headers[h];
      const ip = (Array.isArray(v) ? v[0] : v)?.trim();
      if (ip) return ip;
    }
    const fwd = headers['x-forwarded-for'];
    const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim();
    if (first) return first;
  }
  return remote ?? 'unknown';
}
