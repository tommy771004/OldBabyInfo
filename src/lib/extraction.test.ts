import { describe, expect, it } from "vitest";
import { extractWithConsensus, parseStructuredExtraction } from "./extraction";

function numberValidator(field: string) {
  return (value: unknown) => {
    const v = value as Record<string, unknown>;
    if (typeof v[field] !== "number") throw new Error(`${field} must be a number`);
    return v as { [key: string]: number };
  };
}

describe("parseStructuredExtraction", () => {
  it("accepts data that passes validation", () => {
    const outcome = parseStructuredExtraction({ attack: 58 }, (value) => {
      const v = value as { attack: number };
      if (typeof v.attack !== "number") throw new Error("attack must be a number");
      return v;
    });

    expect(outcome).toEqual({ status: "accepted", value: { attack: 58 } });
  });

  it("rejects data that fails validation, with the reason", () => {
    const outcome = parseStructuredExtraction({ attack: "fifty-eight" }, (value) => {
      const v = value as { attack: unknown };
      if (typeof v.attack !== "number") throw new Error("attack must be a number");
      return v;
    });

    expect(outcome).toEqual({
      status: "rejected",
      reason: "attack must be a number",
    });
  });
});

describe("extractWithConsensus", () => {
  it("accepts when both models agree and both cite a source excerpt", async () => {
    const outcome = await extractWithConsensus({
      models: ["qwen/qwen3-coder:free", "google/gemma-4-31b-it:free"],
      sourceUrl: "https://example.com/dran-buster",
      validate: numberValidator("attack"),
      callModel: async () => ({
        value: { attack: 58 },
        sourceExcerpt: "Attack: 58",
      }),
    });

    expect(outcome).toEqual({
      status: "accepted",
      value: { attack: 58 },
      sourceExcerpt: "Attack: 58",
      sourceUrl: "https://example.com/dran-buster",
      model: "qwen/qwen3-coder:free",
    });
  });

  it("rejects when a model omits its source excerpt, even if values agree", async () => {
    const outcome = await extractWithConsensus({
      models: ["qwen/qwen3-coder:free", "google/gemma-4-31b-it:free"],
      sourceUrl: "https://example.com/dran-buster",
      validate: numberValidator("attack"),
      callModel: async (model) => ({
        value: { attack: 58 },
        sourceExcerpt: model === "qwen/qwen3-coder:free" ? "Attack: 58" : "",
      }),
    });

    expect(outcome).toEqual({
      status: "rejected",
      reason: "missing source excerpt",
    });
  });

  it("flags disagreement between models as needs_review, keeping both candidates", async () => {
    const outcome = await extractWithConsensus({
      models: ["qwen/qwen3-coder:free", "google/gemma-4-31b-it:free"],
      sourceUrl: "https://example.com/dran-buster",
      validate: numberValidator("attack"),
      callModel: async (model) => ({
        value: { attack: model === "qwen/qwen3-coder:free" ? 58 : 61 },
        sourceExcerpt: "Attack: " + (model === "qwen/qwen3-coder:free" ? "58" : "61"),
      }),
    });

    expect(outcome).toEqual({
      status: "needs_review",
      reason: "models disagree",
      candidates: [
        {
          model: "qwen/qwen3-coder:free",
          value: { attack: 58 },
          sourceExcerpt: "Attack: 58",
        },
        {
          model: "google/gemma-4-31b-it:free",
          value: { attack: 61 },
          sourceExcerpt: "Attack: 61",
        },
      ],
    });
  });

  it("rejects a value both models hallucinate in agreement, once it fails value-domain validation", async () => {
    const attackInValidRange = (value: unknown) => {
      const v = value as { attack: number };
      if (v.attack < 0 || v.attack > 100) {
        throw new Error("attack out of range 0-100");
      }
      return v;
    };

    const outcome = await extractWithConsensus({
      models: ["qwen/qwen3-coder:free", "google/gemma-4-31b-it:free"],
      sourceUrl: "https://example.com/dran-buster",
      validate: attackInValidRange,
      // Both models confidently hallucinate the same impossible value.
      callModel: async () => ({
        value: { attack: 9999 },
        sourceExcerpt: "Attack: 9999",
      }),
    });

    expect(outcome).toEqual({
      status: "rejected",
      reason: "attack out of range 0-100",
    });
  });

  it("refuses to run when both models are from the same vendor family", async () => {
    await expect(
      extractWithConsensus({
        models: ["qwen/qwen3-coder:free", "qwen/qwen3-next-80b-a3b-instruct:free"],
        sourceUrl: "https://example.com/dran-buster",
        validate: numberValidator("attack"),
        callModel: async () => ({ value: { attack: 58 }, sourceExcerpt: "Attack: 58" }),
      }),
    ).rejects.toThrow(/family/i);
  });
});
