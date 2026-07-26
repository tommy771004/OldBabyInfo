import { describe, expect, it } from "vitest";
import {
  BLADE_WING_COUNTS,
  DEFAULT_WING_COUNT,
  hasObservedWingCount,
  wingCountFor,
} from "./blade-wing-count.ts";

describe("wingCountFor", () => {
  it("returns the observed wing count for a Blade with a real reference photo", () => {
    expect(wingCountFor("OROCHICLUSTER")).toBe(2);
    expect(wingCountFor("DRANSWORD")).toBe(3);
    expect(wingCountFor("AEROPEGASUS")).toBe(4);
  });

  it("falls back to the documented default for a Blade with no cataloged photo", () => {
    expect(wingCountFor("BULLETGRIFFON")).toBe(DEFAULT_WING_COUNT);
    expect(BLADE_WING_COUNTS["BULLETGRIFFON"]).toBeUndefined();
  });

  it("falls back to the default for any unrecognized id", () => {
    expect(wingCountFor("NOT-A-REAL-BLADE")).toBe(DEFAULT_WING_COUNT);
  });
});

describe("hasObservedWingCount", () => {
  it("is true only for Blades read directly off a real photo", () => {
    expect(hasObservedWingCount("AEROPEGASUS")).toBe(true);
    expect(hasObservedWingCount("BULLETGRIFFON")).toBe(false);
  });
});
