import type { RateLimiter } from "./rate-limit.ts";
import {
  SCRAPE_TRAP_PENALTY_MS,
  isScrapeTrap,
  rulesFor,
  trafficClassFor,
  type TrafficClass,
} from "./traffic-policy.ts";
import { classifyUserAgent, isRefusedClass, type UserAgentClass } from "./user-agent.ts";

export interface GuardedRequest {
  pathname: string;
  userAgent: string | null;
  /** Already-resolved client address; see `clientKeyFrom`. */
  clientKey: string;
  now: number;
}

export type GuardDecision =
  | { action: "allow"; trafficClass: TrafficClass; userAgentClass: UserAgentClass }
  | {
      action: "deny";
      status: 403 | 429;
      reason: "refused-client" | "scrape-trap" | "rate-limited";
      retryAfterSeconds: number;
      trafficClass: TrafficClass;
      userAgentClass: UserAgentClass;
    };

/**
 * The client address, from the headers a proxy in front of Next actually
 * sets. `x-forwarded-for` is a client-settable header when nothing rewrites
 * it, so only the *left-most* entry is read on Vercel (which appends the real
 * peer) — and the value is used solely as a rate-limit bucket key, never as
 * an identity or an authorization input.
 */
export function clientKeyFrom(headers: Headers): string {
  const forwarded = headers.get("x-vercel-forwarded-for") ?? headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function evaluateRequest(request: GuardedRequest, limiter: RateLimiter): GuardDecision {
  const userAgentClass = classifyUserAgent(request.userAgent);
  const trafficClass = trafficClassFor(request.pathname);

  if (isScrapeTrap(request.pathname)) {
    limiter.penalize(request.clientKey, request.now + SCRAPE_TRAP_PENALTY_MS);
    return {
      action: "deny",
      status: 403,
      reason: "scrape-trap",
      retryAfterSeconds: Math.ceil(SCRAPE_TRAP_PENALTY_MS / 1000),
      trafficClass,
      userAgentClass,
    };
  }

  // A trap hit earlier in the window costs the client every class at once,
  // which is the point: a crawler that took the bait does not get to carry on
  // walking the catalog from the same address.
  const penaltySeconds = limiter.penaltyRemaining(request.clientKey, request.now);
  if (penaltySeconds > 0) {
    return {
      action: "deny",
      status: 429,
      reason: "rate-limited",
      retryAfterSeconds: penaltySeconds,
      trafficClass,
      userAgentClass,
    };
  }

  if (isRefusedClass(userAgentClass)) {
    return {
      action: "deny",
      status: 403,
      reason: "refused-client",
      retryAfterSeconds: 0,
      trafficClass,
      userAgentClass,
    };
  }

  const verdict = limiter.check(
    `${request.clientKey}|${trafficClass}`,
    rulesFor(trafficClass, userAgentClass),
    request.now,
  );
  if (!verdict.allowed) {
    return {
      action: "deny",
      status: 429,
      reason: "rate-limited",
      retryAfterSeconds: verdict.retryAfterSeconds,
      trafficClass,
      userAgentClass,
    };
  }

  return { action: "allow", trafficClass, userAgentClass };
}

/** Body text for a denial. Plain text, no data, and no hint about the rule. */
export function denialMessage(decision: Extract<GuardDecision, { action: "deny" }>): string {
  switch (decision.reason) {
    case "rate-limited":
      return "Too many requests. OldBabyInfo is a hobby site — please slow down.";
    default:
      return "Automated access to this site is not available. See /terms.";
  }
}
