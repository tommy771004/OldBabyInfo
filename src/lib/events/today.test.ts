import { describe, expect, it } from "vitest";
import { taipeiTodayIso } from "./today.ts";

describe("taipeiTodayIso", () => {
  it("returns the Taipei calendar date for a moment that is still 'tomorrow' in UTC", () => {
    // 2026-08-24 16:30Z = 2026-08-25 00:30 in Taiwan. A session dated the
    // 25th must already count as today, not sit in "upcoming" for another
    // eight hours while a player checks whether to head out.
    expect(taipeiTodayIso(new Date("2026-08-24T16:30:00Z"))).toBe("2026-08-25");
  });

  it("returns the same date as UTC during the afternoon", () => {
    expect(taipeiTodayIso(new Date("2026-08-24T06:00:00Z"))).toBe("2026-08-24");
  });

  it("stays on one calendar date across the whole Taipei day", () => {
    // 15:59Z on the 23rd = 23:59 Taipei on the 23rd; one minute later the
    // day flips — both boundaries must read the 23rd/24th, never drift.
    expect(taipeiTodayIso(new Date("2026-08-23T15:59:00Z"))).toBe("2026-08-23");
    expect(taipeiTodayIso(new Date("2026-08-23T16:01:00Z"))).toBe("2026-08-24");
  });
});
