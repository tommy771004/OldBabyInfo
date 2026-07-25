import { describe, expect, it } from "vitest";
import { getAllEvents } from "./repository";

describe("events repository", () => {
  it("loads the committed seed data and it passes schema validation", () => {
    const events = getAllEvents();
    expect(events.length).toBeGreaterThan(100);
  });

  it("every event has a G3 tier — the only tier we have real schedule data for", () => {
    for (const event of getAllEvents()) {
      expect(event.tier).toBe("G3");
    }
  });
});
