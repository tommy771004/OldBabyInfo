import { describe, expect, it } from "vitest";
import { getAllParts, getPartById } from "./repository";

describe("parts repository", () => {
  it("loads the committed seed data and it passes schema validation", () => {
    const parts = getAllParts();
    expect(parts.length).toBeGreaterThan(100);
  });

  it("includes Dran Sword with the stats verified in ADR-0007", () => {
    const part = getPartById("DRANSWORD");
    expect(part?.stats).toEqual({ attack: 60, defense: 30, stamina: 25 });
  });

  it("returns undefined for an id that does not exist", () => {
    expect(getPartById("NOT_A_REAL_PART")).toBeUndefined();
  });

  it("every part has a non-empty nameEn", () => {
    for (const part of getAllParts()) {
      expect(part.nameEn.length).toBeGreaterThan(0);
    }
  });
});
