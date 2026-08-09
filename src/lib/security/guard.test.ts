import { describe, expect, it } from "vitest";
import { clientKeyFrom, denialMessage, evaluateRequest, type GuardDecision } from "./guard.ts";
import { createRateLimiter } from "./rate-limit.ts";

const CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function request(overrides: Partial<Parameters<typeof evaluateRequest>[0]> = {}) {
  return {
    pathname: "/parts",
    userAgent: CHROME,
    clientKey: "203.0.113.9",
    now: 1_000_000,
    ...overrides,
  };
}

function denial(decision: GuardDecision) {
  if (decision.action !== "deny") throw new Error("expected a denial");
  return decision;
}

describe("clientKeyFrom", () => {
  it("reads the left-most forwarded address", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 70.41.3.18, 150.172.238.178" });
    expect(clientKeyFrom(headers)).toBe("203.0.113.9");
  });

  it("prefers the platform header over the client-settable one", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "198.51.100.4",
      "x-forwarded-for": "1.1.1.1",
    });
    expect(clientKeyFrom(headers)).toBe("198.51.100.4");
  });

  it("falls back to a shared bucket rather than throwing", () => {
    expect(clientKeyFrom(new Headers())).toBe("unknown");
  });
});

describe("evaluateRequest", () => {
  it("lets a browsing visitor through", () => {
    const decision = evaluateRequest(request(), createRateLimiter());
    expect(decision.action).toBe("allow");
  });

  it("refuses scripted clients outright", () => {
    const decision = evaluateRequest(
      request({ userAgent: "python-requests/2.32.3" }),
      createRateLimiter(),
    );
    expect(denial(decision).status).toBe(403);
    expect(denial(decision).reason).toBe("refused-client");
  });

  it("refuses a trap hit and penalizes the caller everywhere else", () => {
    const limiter = createRateLimiter();
    const trap = evaluateRequest(request({ pathname: "/internal/parts-export" }), limiter);
    expect(denial(trap).status).toBe(403);
    expect(denial(trap).reason).toBe("scrape-trap");

    // The same client is now blocked on the pages it was actually after.
    const next = evaluateRequest(request({ pathname: "/parts/dran-sword" }), limiter);
    expect(denial(next).status).toBe(429);
  });

  it("throttles a sustained catalog walk", () => {
    const limiter = createRateLimiter();
    let denied = 0;
    for (let i = 0; i < 200; i += 1) {
      const decision = evaluateRequest(
        request({ pathname: `/parts/part-${i}`, now: 1_000_000 + i * 100 }),
        limiter,
      );
      if (decision.action === "deny") denied += 1;
    }
    expect(denied).toBeGreaterThan(0);
  });

  it("keeps the catalog budget separate from the auth budget", () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < 200; i += 1) {
      evaluateRequest(request({ pathname: "/parts", now: 1_000_000 + i }), limiter);
    }
    const auth = evaluateRequest(request({ pathname: "/api/auth/session", now: 1_000_300 }), limiter);
    expect(auth.action).toBe("allow");
  });

  it("limits auth traffic more tightly than page traffic", () => {
    const limiter = createRateLimiter();
    let allowed = 0;
    for (let i = 0; i < 100; i += 1) {
      const decision = evaluateRequest(
        request({ pathname: "/api/auth/callback/google", now: 1_000_000 + i }),
        limiter,
      );
      if (decision.action === "allow") allowed += 1;
    }
    expect(allowed).toBeLessThanOrEqual(20);
  });

  it("answers a throttled client with a Retry-After worth honouring", () => {
    const limiter = createRateLimiter();
    let decision = evaluateRequest(request({ pathname: "/llms.txt" }), limiter);
    for (let i = 0; i < 100 && decision.action === "allow"; i += 1) {
      decision = evaluateRequest(request({ pathname: "/llms.txt", now: 1_000_000 + i }), limiter);
    }
    expect(denial(decision).retryAfterSeconds).toBeGreaterThan(0);
  });

  it("says nothing about the rule that was tripped", () => {
    const message = denialMessage({
      action: "deny",
      status: 403,
      reason: "refused-client",
      retryAfterSeconds: 0,
      trafficClass: "catalog",
      userAgentClass: "scripted",
    });
    expect(message).not.toMatch(/limit|window|\d/i);
  });
});
