import { describe, expect, it } from "vitest";
import { evaluateScrapeHealth } from "./scrape-health.ts";

describe("evaluateScrapeHealth", () => {
  it("accepts a scrape at or above the expected target count", () => {
    expect(evaluateScrapeHealth(12, 10)).toEqual({ ok: true, message: "12 targets scraped." });
  });

  it("fails when the result count drops below the configured expectation", () => {
    expect(evaluateScrapeHealth(8, 10)).toEqual({
      ok: false,
      message: "Only 8 of the expected 10 targets were scraped.",
    });
  });
});
