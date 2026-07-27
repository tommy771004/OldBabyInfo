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

  it("is empty for every Part in the current seed — no source publishes weights yet", () => {
    // Guards the "—" path the whole list renders today; when Mold Batch
    // weights land this flips and the column starts carrying real data.
    expect(getAllParts().filter((part) => weightRangeOf(part))).toEqual([]);
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
