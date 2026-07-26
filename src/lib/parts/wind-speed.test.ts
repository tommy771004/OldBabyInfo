import { describe, expect, it } from "vitest";
import { windDurationSeconds } from "./wind-speed.ts";

describe("windDurationSeconds", () => {
  it("spins a high-Attack subject faster than a low-Attack one", () => {
    // Real values: Dran Buster (75, the highest single Blade) vs
    // Scorpio Spear's defense mode (25).
    expect(windDurationSeconds(75)).toBeLessThan(windDurationSeconds(25));
  });

  it("separates the two real sides by a visible margin, not a hairline", () => {
    const fast = windDurationSeconds(75);
    const slow = windDurationSeconds(25);
    // At least a 1.5s gap per revolution — a difference a viewer can
    // actually perceive, not a sub-frame nudge.
    expect(slow - fast).toBeGreaterThan(1.5);
  });

  it("never returns zero or a negative duration, which would spin infinitely fast", () => {
    for (const attack of [0, -5, 1]) {
      expect(windDurationSeconds(attack)).toBeGreaterThan(0);
    }
  });

  it("clamps above the real Combo ceiling instead of accelerating without limit", () => {
    // ADR-0007's worked example maxes a real Combo at ~115; nothing real
    // reaches 500, but a bad caller must not produce a blur.
    expect(windDurationSeconds(500)).toBe(windDurationSeconds(120));
  });

  it("stays inside the designed range for every real attack value", () => {
    for (const attack of [0, 25, 60, 75, 115, 120]) {
      const seconds = windDurationSeconds(attack);
      expect(seconds).toBeGreaterThanOrEqual(2.4);
      expect(seconds).toBeLessThanOrEqual(9);
    }
  });

  it("is monotonic across the real range — more Attack is never slower", () => {
    const values = [0, 10, 25, 40, 60, 75, 100, 115, 120].map(windDurationSeconds);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeLessThanOrEqual(values[i - 1]!);
    }
  });
});
