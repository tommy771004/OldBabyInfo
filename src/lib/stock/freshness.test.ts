import { describe, expect, it } from "vitest";
import { isStockListingStale } from "./freshness.ts";

describe("isStockListingStale", () => {
  it("keeps a listing fresh until the configured age has elapsed", () => {
    expect(
      isStockListingStale(
        { capturedAt: "2026-07-26T10:00:00.000Z" },
        "2026-07-26T11:59:59.999Z",
        2 * 60 * 60 * 1000,
      ),
    ).toBe(false);
  });

  it("marks a listing stale at the age boundary and when its date is invalid", () => {
    expect(
      isStockListingStale(
        { capturedAt: "2026-07-26T10:00:00.000Z" },
        "2026-07-26T12:00:00.000Z",
        2 * 60 * 60 * 1000,
      ),
    ).toBe(true);
    expect(isStockListingStale({ capturedAt: "not-a-date" }, "2026-07-26T12:00:00.000Z")).toBe(true);
  });
});
