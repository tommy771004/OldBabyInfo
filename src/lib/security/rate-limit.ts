/**
 * A sliding-window counter with a penalty box, kept deliberately small and
 * dependency-free so it can run inside Next middleware.
 *
 * Scope of the guarantee: state lives in the memory of one serverless
 * instance. A distributed scraper, or a burst spread across enough cold
 * starts, will see a higher effective limit than the numbers below suggest.
 * That is accepted — the goal is to make bulk extraction of the catalog slow
 * and conspicuous, not to build an authorization boundary. Anything that must
 * actually be enforced belongs in the data layer, not here.
 */

export interface RateLimitRule {
  /** Requests permitted inside `windowMs`. */
  limit: number;
  windowMs: number;
}

export interface RateLimitVerdict {
  allowed: boolean;
  /** Seconds to put in `Retry-After`; 0 when allowed. */
  retryAfterSeconds: number;
  /** Remaining requests under the tightest rule that applied. */
  remaining: number;
}

export interface RateLimiterOptions {
  /**
   * Hard cap on tracked keys. Without it a spray of forged client addresses
   * would turn the limiter itself into the memory exhaustion it prevents.
   */
  maxKeys?: number;
}

export interface RateLimiter {
  check(key: string, rules: readonly RateLimitRule[], now: number): RateLimitVerdict;
  /**
   * Puts a key in the penalty box until `untilMs`, e.g. after a trap hit.
   * Penalties are stored against whatever key the caller chooses and are
   * *not* consulted by `check` — the guard applies them to the bare client
   * key, so one trap hit costs the caller every traffic class at once rather
   * than only the bucket it happened to be in.
   */
  penalize(key: string, untilMs: number): void;
  /** Remaining penalty in seconds, or 0 when the key is not penalized. */
  penaltyRemaining(key: string, now: number): number;
  /** Tracked key count — exposed for tests and eviction assertions. */
  size(): number;
}

const DEFAULT_MAX_KEYS = 20_000;

export function createRateLimiter(options: RateLimiterOptions = {}): RateLimiter {
  const maxKeys = options.maxKeys ?? DEFAULT_MAX_KEYS;
  /** Insertion-ordered, which makes `Map` iteration order a usable LRU-ish queue. */
  const hits = new Map<string, number[]>();
  const penalties = new Map<string, number>();

  function evictIfNeeded(): void {
    while (hits.size > maxKeys) {
      const oldest = hits.keys().next();
      if (oldest.done) return;
      hits.delete(oldest.value);
    }
    while (penalties.size > maxKeys) {
      const oldest = penalties.keys().next();
      if (oldest.done) return;
      penalties.delete(oldest.value);
    }
  }

  return {
    check(key, rules, now) {
      if (rules.length === 0) {
        return { allowed: true, retryAfterSeconds: 0, remaining: Number.POSITIVE_INFINITY };
      }

      const longestWindow = Math.max(...rules.map((rule) => rule.windowMs));
      const previous = hits.get(key) ?? [];
      const timestamps = previous.filter((timestamp) => now - timestamp < longestWindow);

      let remaining = Number.POSITIVE_INFINITY;
      let retryAfterSeconds = 0;
      for (const rule of rules) {
        const inWindow = timestamps.filter((timestamp) => now - timestamp < rule.windowMs);
        const left = rule.limit - inWindow.length;
        remaining = Math.min(remaining, Math.max(left, 0));
        if (left <= 0) {
          const oldest = inWindow[0] ?? now;
          const waitMs = rule.windowMs - (now - oldest);
          retryAfterSeconds = Math.max(retryAfterSeconds, Math.ceil(waitMs / 1000));
        }
      }

      if (retryAfterSeconds > 0) {
        // Refused requests are not recorded: otherwise a client that keeps
        // hammering during a block extends its own window forever, and the
        // stored array grows without bound.
        hits.set(key, timestamps);
        return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 1), remaining: 0 };
      }

      timestamps.push(now);
      hits.delete(key);
      hits.set(key, timestamps);
      evictIfNeeded();
      return { allowed: true, retryAfterSeconds: 0, remaining: Math.max(remaining - 1, 0) };
    },

    penalize(key, untilMs) {
      penalties.delete(key);
      penalties.set(key, untilMs);
      evictIfNeeded();
    },

    penaltyRemaining(key, now) {
      const until = penalties.get(key);
      if (until === undefined) return 0;
      if (until <= now) {
        penalties.delete(key);
        return 0;
      }
      return Math.ceil((until - now) / 1000);
    },

    size() {
      return hits.size;
    },
  };
}
