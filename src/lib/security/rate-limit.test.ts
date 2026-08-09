import { describe, expect, it } from "vitest";
import { createRateLimiter, type RateLimitRule } from "./rate-limit.ts";

const PER_MINUTE: RateLimitRule[] = [{ limit: 3, windowMs: 60_000 }];

describe("createRateLimiter", () => {
  it("allows up to the limit and refuses the next request", () => {
    const limiter = createRateLimiter();
    const now = 1_000_000;
    expect(limiter.check("a", PER_MINUTE, now).allowed).toBe(true);
    expect(limiter.check("a", PER_MINUTE, now).allowed).toBe(true);
    const last = limiter.check("a", PER_MINUTE, now);
    expect(last.allowed).toBe(true);
    expect(last.remaining).toBe(0);

    const refused = limiter.check("a", PER_MINUTE, now);
    expect(refused.allowed).toBe(false);
    expect(refused.retryAfterSeconds).toBe(60);
  });

  it("slides: the window frees up as its oldest hit ages out", () => {
    const limiter = createRateLimiter();
    const start = 0;
    for (let i = 0; i < 3; i += 1) limiter.check("a", PER_MINUTE, start + i);
    expect(limiter.check("a", PER_MINUTE, start + 59_000).allowed).toBe(false);
    expect(limiter.check("a", PER_MINUTE, start + 60_001).allowed).toBe(true);
  });

  it("keeps buckets independent per key", () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < 3; i += 1) limiter.check("a", PER_MINUTE, 0);
    expect(limiter.check("a", PER_MINUTE, 0).allowed).toBe(false);
    expect(limiter.check("b", PER_MINUTE, 0).allowed).toBe(true);
  });

  it("applies the tightest of several rules", () => {
    const rules: RateLimitRule[] = [
      { limit: 5, windowMs: 1_000 },
      { limit: 6, windowMs: 600_000 },
    ];
    const limiter = createRateLimiter();
    for (let i = 0; i < 5; i += 1) expect(limiter.check("a", rules, i).allowed).toBe(true);
    // Burst rule is spent; waiting past its window still leaves the long one.
    expect(limiter.check("a", rules, 2_000).allowed).toBe(true);
    expect(limiter.check("a", rules, 2_001).allowed).toBe(false);
  });

  it("does not let a client extend its own block by hammering", () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < 3; i += 1) limiter.check("a", PER_MINUTE, 0);
    for (let i = 0; i < 50; i += 1) limiter.check("a", PER_MINUTE, 30_000);
    expect(limiter.check("a", PER_MINUTE, 60_001).allowed).toBe(true);
  });

  it("reports a penalty in whole seconds until it expires", () => {
    const limiter = createRateLimiter();
    limiter.penalize("a", 900_000);
    expect(limiter.penaltyRemaining("a", 0)).toBe(900);
    expect(limiter.penaltyRemaining("a", 899_000)).toBe(1);
    expect(limiter.penaltyRemaining("a", 900_001)).toBe(0);
    expect(limiter.penaltyRemaining("never-penalized", 0)).toBe(0);
  });

  it("evicts the oldest keys instead of growing without bound", () => {
    const limiter = createRateLimiter({ maxKeys: 10 });
    for (let i = 0; i < 100; i += 1) limiter.check(`key-${i}`, PER_MINUTE, i);
    expect(limiter.size()).toBeLessThanOrEqual(10);
  });
});
