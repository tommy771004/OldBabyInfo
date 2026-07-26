import { describe, expect, it } from "vitest";
import { moldBatchCandidateSchema } from "./schema.ts";

describe("mold batch candidate schema", () => {
  it("keeps batch identity, source excerpt and an optional measured weight range separate from official Stat", () => {
    const result = moldBatchCandidateSchema.safeParse({
      partNameRaw: "Dran Sword",
      batchCode: "A1",
      note: "玩家測得較重",
      sourceExcerpt: "A1 約 37.2-37.6g",
      weightGrams: { min: 37.2, max: 37.6 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a reversed or non-positive weight range", () => {
    const result = moldBatchCandidateSchema.safeParse({
      partNameRaw: "Dran Sword",
      batchCode: "A1",
      note: "note",
      weightGrams: { min: 38, max: 37 },
    });
    expect(result.success).toBe(false);
  });
});
