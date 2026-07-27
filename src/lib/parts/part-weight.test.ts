import { describe, expect, it } from "vitest";
import { formatWeightRange, weightRangeOf, weightSortValueOf } from "./part-weight.ts";
import { getAllParts } from "./repository.ts";
import type { Part } from "./schema.ts";

function blade(moldBatches: Part["moldBatches"]): Part {
  return {
    id: "DRANSWORD",
    nameEn: "Dran Sword",
    aliases: [],
    moldBatches,
    generation: "X",
    releaseAt: null,
    type: "blade",
    stats: { attack: 60, defense: 30, stamina: 25 },
    modes: [],
    statEditions: [],
  };
}

function batch(batchCode: string, weightGrams?: { min: number; max: number }) {
  return { batchCode, note: "observed", sourceUrl: "https://example.com/batch", weightGrams };
}

describe("weightRangeOf", () => {
  it("spans every weighed batch, not just the first", () => {
    const part = blade([
      batch("A", { min: 34.2, max: 34.6 }),
      batch("B", { min: 34.4, max: 35.1 }),
    ]);

    expect(weightRangeOf(part)).toEqual({ min: 34.2, max: 35.1 });
  });

  it("ignores batches recorded without a weight", () => {
    const part = blade([batch("A"), batch("B", { min: 34.4, max: 34.4 })]);

    expect(weightRangeOf(part)).toEqual({ min: 34.4, max: 34.4 });
  });

  it("has no answer for a Part nobody has weighed", () => {
    expect(weightRangeOf(blade([]))).toBeUndefined();
    expect(weightRangeOf(blade([batch("A")]))).toBeUndefined();
    expect(weightSortValueOf(blade([]))).toBeUndefined();
  });

  it("sorts by the midpoint of the range", () => {
    expect(weightSortValueOf(blade([batch("A", { min: 34, max: 36 })]))).toBe(35);
  });

  it("reads the published weight now that the seed carries one", () => {
    // This assertion used to be `toEqual([])` — no ingested source published
    // a per-Part weight. Go-Shoot's Part database does, and the seed now
    // folds it in, so the column carries real figures for most Parts.
    const weighed = getAllParts().filter((part) => weightRangeOf(part));

    expect(weighed.length).toBeGreaterThan(100);
    expect(weighed.every((part) => weightRangeOf(part)!.min > 0)).toBe(true);
  });

  it("prefers a measured batch range over the published figure", () => {
    const published = blade([]);
    published.weightGrams = 35;
    expect(weightRangeOf(published)).toEqual({ min: 35, max: 35 });

    const measured = { ...published, moldBatches: [batch("A", { min: 34, max: 36 })] };
    expect(weightRangeOf(measured)).toEqual({ min: 34, max: 36 });
  });
});

describe("formatWeightRange", () => {
  it("reads as a range, with the unit once", () => {
    expect(formatWeightRange({ min: 34.2, max: 35.1 })).toBe("34.2–35.1 g");
  });

  it("collapses a single measurement instead of repeating it", () => {
    expect(formatWeightRange({ min: 34.4, max: 34.4 })).toBe("34.4 g");
    expect(formatWeightRange({ min: 34, max: 34 })).toBe("34 g");
  });
});
