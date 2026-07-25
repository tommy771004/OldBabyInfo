import { describe, expect, it } from "vitest";
import { eventSchema, eventsFileSchema } from "./schema";

function validEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "funbox-g3-2026-07-11-nangang",
    tier: "G3",
    venueName: "潤泰南港車站店",
    venueAddress: "台北市南港區忠孝東路七段369號A棟3樓",
    date: "2026-07-11",
    time: "14:00",
    capacity: 32,
    registrationMethod: "onsite",
    ageCategory: "公開 (6歲以上)",
    sourceUrl: "https://docs.google.com/spreadsheets/d/1BgyEeGOvVy7G4FQgwFoEjtjpuP0VW58wpQJlzOHUjvQ",
    results: null,
    ...overrides,
  };
}

describe("eventSchema", () => {
  it("accepts a valid scheduled event with no results yet", () => {
    const result = eventSchema.safeParse(validEvent());
    expect(result.success).toBe(true);
  });

  it("rejects an unknown tier — only GP/G1/G2/G3 exist", () => {
    const result = eventSchema.safeParse(validEvent({ tier: "G5" }));
    expect(result.success).toBe(false);
  });

  it("rejects a date that isn't ISO yyyy-mm-dd", () => {
    const result = eventSchema.safeParse(validEvent({ date: "7/11" }));
    expect(result.success).toBe(false);
  });

  it("rejects zero or negative capacity", () => {
    const result = eventSchema.safeParse(validEvent({ capacity: 0 }));
    expect(result.success).toBe(false);
  });

  it("rejects an unknown registration method", () => {
    const result = eventSchema.safeParse(validEvent({ registrationMethod: "carrier pigeon" }));
    expect(result.success).toBe(false);
  });

  it("accepts phone registration — real venue data has a third method beyond onsite/online", () => {
    const result = eventSchema.safeParse(validEvent({ registrationMethod: "phone" }));
    expect(result.success).toBe(true);
  });

  it("accepts 'either' registration — some venues genuinely accept onsite or online", () => {
    const result = eventSchema.safeParse(validEvent({ registrationMethod: "either" }));
    expect(result.success).toBe(true);
  });

  it("accepts store_community registration — some venues register via their own social group, not a general online form", () => {
    const result = eventSchema.safeParse(validEvent({ registrationMethod: "store_community" }));
    expect(result.success).toBe(true);
  });

  it("accepts results once an event has actually happened", () => {
    const result = eventSchema.safeParse(
      validEvent({
        results: {
          topFour: ["Player A", "Player B", "Player C", "Player D"],
          sourceExcerpt: "1st: Player A ...",
        },
      }),
    );
    expect(result.success).toBe(true);
  });
});

describe("eventsFileSchema", () => {
  it("rejects duplicate ids", () => {
    const result = eventsFileSchema.safeParse([validEvent({ id: "dup" }), validEvent({ id: "dup" })]);
    expect(result.success).toBe(false);
  });
});
