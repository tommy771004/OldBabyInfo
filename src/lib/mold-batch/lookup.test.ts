import { describe, expect, it } from "vitest";
import type { Part } from "../parts/schema.ts";
import { getMoldBatchCoverage, lookupMoldBatches } from "./lookup.ts";

const PART_WITH_BATCH: Part = {
  id: "dran-sword",
  nameEn: "Dran Sword",
  nameJa: "ドランソード",
  nameZhTw: "赤龍劍",
  aliases: ["DS"],
  generation: "X",
  releaseAt: "2023-07-15",
  type: "blade",
  stats: { attack: 55, defense: 0, stamina: 0 },
  modes: [],
  statEditions: [],
  moldBatches: [
    {
      batchCode: "A2",
      note: "Early production run reported a slightly heavier blade.",
      sourceUrl: "https://example.com/dran-sword-batches",
    },
  ],
};

const PART_WITHOUT_BATCH: Part = {
  ...PART_WITH_BATCH,
  id: "wizard-arrow",
  nameEn: "Wizard Arrow",
  moldBatches: [],
};

describe("lookupMoldBatches", () => {
  it("finds a batch by its code and keeps the linked Part", () => {
    const result = lookupMoldBatches([PART_WITH_BATCH], " a2 ");

    expect(result).toEqual({
      kind: "matches",
      matches: [
        {
          part: PART_WITH_BATCH,
          batch: PART_WITH_BATCH.moldBatches[0],
        },
      ],
    });
  });

  it("reports an empty query separately from an unknown batch code", () => {
    expect(lookupMoldBatches([PART_WITH_BATCH], "")).toEqual({ kind: "empty-query" });
    expect(lookupMoldBatches([PART_WITH_BATCH], "Z9")).toEqual({
      kind: "no-matches",
      query: "Z9",
    });
  });

  it("reports the available coverage without pretending empty data is complete", () => {
    expect(getMoldBatchCoverage([PART_WITH_BATCH, PART_WITHOUT_BATCH])).toEqual({
      partsWithBatches: 1,
      totalParts: 2,
      batchEntries: 1,
    });
  });
});
