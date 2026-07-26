import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runRateLimited, stableJson, writeBatch } from "./data-writer.ts";
import type { ConsensusOutcome } from "./extraction.ts";

describe("stableJson", () => {
  it("matches the exact formatting the existing seed scripts already write", () => {
    expect(stableJson({ a: 1, b: [2, 3] })).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}\n');
  });
});

describe("runRateLimited", () => {
  it("calls fn once per item, in order, with the item's own value", async () => {
    const seen: number[] = [];
    const results = await runRateLimited([1, 2, 3], async (n) => {
      seen.push(n);
      return n * 10;
    }, 0);
    expect(seen).toEqual([1, 2, 3]);
    expect(results).toEqual([10, 20, 30]);
  });

  it("actually waits between calls, but not after the last one", async () => {
    const start = Date.now();
    await runRateLimited([1, 2, 3], async () => Date.now(), 30);
    const elapsed = Date.now() - start;
    // Two gaps of ~30ms each (not three), with slack for test-runner jitter.
    expect(elapsed).toBeGreaterThanOrEqual(55);
    expect(elapsed).toBeLessThan(200);
  });
});

describe("writeBatch", () => {
  let dir: string;
  let outputPath: string;
  let needsReviewPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "data-writer-test-"));
    outputPath = join(dir, "out.json");
    needsReviewPath = join(dir, "needs-review.json");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function accepted(value: number, sourceExcerpt = "excerpt"): ConsensusOutcome<number> {
    return { status: "accepted", value, sourceExcerpt, sourceUrl: "https://example.com", model: "a/x" };
  }
  function needsReview(): ConsensusOutcome<number> {
    return {
      status: "needs_review",
      reason: "models disagree",
      candidates: [
        { model: "a/x", value: 1, sourceExcerpt: "e1" },
        { model: "b/y", value: 2, sourceExcerpt: "e2" },
      ],
    };
  }
  function rejected(): ConsensusOutcome<number> {
    return { status: "rejected", reason: "missing source excerpt" };
  }

  it("writes only the merged accepted values to outputPath", () => {
    const result = writeBatch({
      outcomes: [accepted(1), accepted(2), needsReview(), rejected()],
      outputPath,
      needsReviewPath,
      mergeAccepted: (items) => items.map((i) => i.value),
      validateMerged: (v) => v,
      dryRun: false,
    });

    expect(result).toMatchObject({ acceptedCount: 2, needsReviewCount: 1, rejectedCount: 1, written: true });
    expect(JSON.parse(readFileSync(outputPath, "utf-8"))).toEqual([1, 2]);
  });

  it("writes Needs Review items to a separate file, never into outputPath", () => {
    writeBatch({
      outcomes: [accepted(1), needsReview()],
      outputPath,
      needsReviewPath,
      mergeAccepted: (items) => items.map((i) => i.value),
      validateMerged: (v) => v,
      dryRun: false,
    });

    const output = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(output).toEqual([1]);
    const review = JSON.parse(readFileSync(needsReviewPath, "utf-8"));
    expect(review).toHaveLength(1);
    expect(review[0].status).toBe("needs_review");
  });

  it("preserves sourceExcerpt/sourceUrl/model on every accepted item passed to mergeAccepted", () => {
    let seen: unknown;
    writeBatch({
      outcomes: [accepted(1, "real excerpt text")],
      outputPath,
      needsReviewPath,
      mergeAccepted: (items) => {
        seen = items;
        return [];
      },
      validateMerged: (v) => v,
      dryRun: false,
    });
    expect(seen).toEqual([
      { status: "accepted", value: 1, sourceExcerpt: "real excerpt text", sourceUrl: "https://example.com", model: "a/x" },
    ]);
  });

  it("aborts without writing anything when the merged result fails validation", () => {
    expect(() =>
      writeBatch({
        outcomes: [accepted(1)],
        outputPath,
        needsReviewPath,
        mergeAccepted: (items) => items.map((i) => i.value),
        validateMerged: () => {
          throw new Error("structurally invalid");
        },
        dryRun: false,
      }),
    ).toThrow("structurally invalid");

    expect(existsSync(outputPath)).toBe(false);
  });

  it("dry-run reports what would be written without touching the filesystem", () => {
    const result = writeBatch({
      outcomes: [accepted(1), needsReview()],
      outputPath,
      needsReviewPath,
      mergeAccepted: (items) => items.map((i) => i.value),
      validateMerged: (v) => v,
      dryRun: true,
    });

    expect(result.written).toBe(false);
    expect(result.after).toBe("[\n  1\n]\n");
    expect(existsSync(outputPath)).toBe(false);
    expect(existsSync(needsReviewPath)).toBe(false);
  });

  it("dry-run's `before` reflects real existing file content for a real diff preview", () => {
    writeBatch({
      outcomes: [accepted(1)],
      outputPath,
      needsReviewPath,
      mergeAccepted: (items) => items.map((i) => i.value),
      validateMerged: (v) => v,
      dryRun: false,
    });

    const result = writeBatch({
      outcomes: [accepted(1), accepted(2)],
      outputPath,
      needsReviewPath,
      mergeAccepted: (items) => items.map((i) => i.value),
      validateMerged: (v) => v,
      dryRun: true,
    });

    expect(result.before).toBe("[\n  1\n]\n");
    expect(result.after).toBe("[\n  1,\n  2\n]\n");
  });
});
