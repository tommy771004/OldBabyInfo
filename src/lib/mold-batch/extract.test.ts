import { describe, expect, it } from "vitest";
import { attachToParts, extractMoldBatchesFromArticle } from "./extract.ts";
import type { Part } from "../parts/schema.ts";
import type { MoldBatchCandidate } from "./schema.ts";

const CANDIDATES: MoldBatchCandidate[] = [
  { partNameRaw: "Dran Sword", batchCode: "A", note: "早期批次固鎖偏鬆" },
];

describe("extractMoldBatchesFromArticle", () => {
  it("accepts when both models agree on the same candidate list and both cite a source excerpt", async () => {
    const outcome = await extractMoldBatchesFromArticle(
      "https://example.com/mold-batch-article",
      ["qwen/qwen3-coder:free", "google/gemma-4-31b-it:free"],
      async () => ({ value: CANDIDATES, sourceExcerpt: "A 批次的蒼龍神劍固鎖偏鬆" }),
    );

    expect(outcome).toEqual({
      status: "accepted",
      value: CANDIDATES,
      sourceExcerpt: "A 批次的蒼龍神劍固鎖偏鬆",
      sourceUrl: "https://example.com/mold-batch-article",
      model: "qwen/qwen3-coder:free",
    });
  });

  it("flags disagreement between the two models as needs_review", async () => {
    const outcome = await extractMoldBatchesFromArticle(
      "https://example.com/mold-batch-article",
      ["qwen/qwen3-coder:free", "google/gemma-4-31b-it:free"],
      async (model) => ({
        value: model === "qwen/qwen3-coder:free" ? CANDIDATES : [],
        sourceExcerpt: "excerpt",
      }),
    );

    expect(outcome.status).toBe("needs_review");
  });

  it("rejects an extraction missing a source excerpt, even if the candidate list looks fine", async () => {
    const outcome = await extractMoldBatchesFromArticle(
      "https://example.com/mold-batch-article",
      ["qwen/qwen3-coder:free", "google/gemma-4-31b-it:free"],
      async () => ({ value: CANDIDATES, sourceExcerpt: "" }),
    );

    expect(outcome.status).toBe("rejected");
  });
});

function blade(overrides: Partial<Part> = {}): Part {
  return {
    id: "DRANSWORD",
    nameEn: "Dran Sword",
    aliases: [],
    moldBatches: [],
    generation: "X",
    releaseAt: null,
    type: "blade",
    stats: { attack: 60, defense: 30, stamina: 25 },
    modes: [],
    statEditions: [],
    ...overrides,
  } as Part;
}

describe("attachToParts", () => {
  it("puts a candidate whose partNameRaw matches a real Part into matched", () => {
    const result = attachToParts(CANDIDATES, [blade()]);
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0]!.part.id).toBe("DRANSWORD");
    expect(result.unmatched).toHaveLength(0);
  });

  it("puts a candidate with no matching Part into unmatched, not a guessed match", () => {
    const unknownCandidate: MoldBatchCandidate = {
      partNameRaw: "一個查不到的零件名稱",
      batchCode: "B",
      note: "note",
    };
    const result = attachToParts([unknownCandidate], [blade()]);
    expect(result.matched).toHaveLength(0);
    expect(result.unmatched).toEqual([unknownCandidate]);
  });

  it("every candidate lands in exactly one bucket — none silently dropped", () => {
    const unknownCandidate: MoldBatchCandidate = {
      partNameRaw: "查不到",
      batchCode: "B",
      note: "note",
    };
    const result = attachToParts([...CANDIDATES, unknownCandidate], [blade()]);
    expect(result.matched.length + result.unmatched.length).toBe(2);
  });
});
