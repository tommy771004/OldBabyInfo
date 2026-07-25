import { describe, expect, it } from "vitest";
import { splitByDate } from "./split-by-date";
import type { Event } from "./schema";

function event(date: string): Event {
  return {
    id: date,
    tier: "G3",
    venueName: "Test Venue",
    venueAddress: "Test Address",
    date,
    time: "14:00",
    capacity: 32,
    registrationMethod: "onsite",
    ageCategory: "公開 (6歲以上)",
    sourceUrl: "https://example.com",
    results: null,
  };
}

describe("splitByDate", () => {
  it("sorts upcoming events soonest-first", () => {
    const events = [event("2026-08-01"), event("2026-07-20")];
    const { upcoming } = splitByDate(events, "2026-07-15");
    expect(upcoming.map((e) => e.date)).toEqual(["2026-07-20", "2026-08-01"]);
  });

  it("sorts past events most-recent-first", () => {
    const events = [event("2026-07-01"), event("2026-07-10")];
    const { past } = splitByDate(events, "2026-07-15");
    expect(past.map((e) => e.date)).toEqual(["2026-07-10", "2026-07-01"]);
  });

  it("treats today itself as upcoming, not past", () => {
    const { upcoming, past } = splitByDate([event("2026-07-15")], "2026-07-15");
    expect(upcoming).toHaveLength(1);
    expect(past).toHaveLength(0);
  });
});
