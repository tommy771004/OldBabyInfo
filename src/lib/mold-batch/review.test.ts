import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Part } from "../parts/schema.ts";
import { createMoldBatchReviews, mergeReviewedMoldBatches } from "./review.ts";

function blade(): Part {
  return {
    id: "DRANSWORD", type: "blade", nameEn: "Dran Sword", aliases: ["DS"],
    generation: "X", releaseAt: "2023-07-15", moldBatches: [],
    stats: { attack: 60, defense: 30, stamina: 25 },
    playstyle: "attack", modes: [], statEditions: [],
  };
}

function approved(overrides: Record<string, unknown> = {}) {
  return {
    partId: "DRANSWORD", batchCode: "TEST-01", note: "Fixture observation, not real product data",
    sourceUrl: "https://example.com/article", sourceExcerpt: "Fixture passage",
    capturedAt: "2026-08-01T00:00:00.000Z", attributionStatus: "unattributed",
    decision: "approved", reviewedBy: "fixture-reviewer", reviewedAt: "2026-08-02T00:00:00.000Z",
    ...overrides,
  };
}

function pending() {
  const review: Record<string, unknown> = approved();
  delete review.reviewedBy;
  delete review.reviewedAt;
  return { ...review, decision: "pending" };
}

describe("Mold Batch human review", () => {
  it("keeps consensus output pending and preserves excerpt, weight and capture time", () => {
    const reviews = createMoldBatchReviews([{
      part: blade(),
      candidate: { partNameRaw: "Dran Sword", batchCode: "TEST-01", note: "Fixture note", sourceExcerpt: "Specific passage", weightGrams: { min: 34, max: 35 } },
    }], { url: "https://example.com/article", excerpt: "Fallback passage", capturedAt: "2026-08-01T00:00:00.000Z" });
    expect(reviews).toEqual([{
      partId: "DRANSWORD", batchCode: "TEST-01", note: "Fixture note",
      sourceUrl: "https://example.com/article", sourceExcerpt: "Specific passage",
      capturedAt: "2026-08-01T00:00:00.000Z", weightGrams: { min: 34, max: 35 },
      attributionStatus: "unattributed", decision: "pending",
    }]);
    expect(mergeReviewedMoldBatches([blade()], reviews)).toMatchObject({ added: 0, pending: 1 });
  });

  it("adds only approved rows, preserving unrelated fields and other Parts", () => {
    const parts = [blade(), { ...blade(), id: "OTHER", nameEn: "Other" } as Part];
    const before = structuredClone(parts);
    const result = mergeReviewedMoldBatches(parts, [approved(), pending(), approved({ decision: "rejected" })]);
    expect(result).toMatchObject({ added: 1, unchanged: 0, pending: 1, rejected: 1 });
    expect(result.parts[0]?.moldBatches[0]).toMatchObject({ sourceExcerpt: "Fixture passage", attributionStatus: "unattributed" });
    expect(result.parts[0]?.moldBatches[0]).not.toHaveProperty("reviewedBy");
    expect({ ...result.parts[0], moldBatches: [] }).toEqual(parts[0]);
    expect(result.parts[1]).toBe(parts[1]);
    expect(parts).toEqual(before);
  });

  it("is idempotent for repeated approved rows and repeated runs", () => {
    const first = mergeReviewedMoldBatches([blade()], [approved(), approved()]);
    expect(first).toMatchObject({ added: 1, unchanged: 1 });
    const second = mergeReviewedMoldBatches(first.parts, [approved()]);
    expect(second).toMatchObject({ added: 0, unchanged: 1 });
    expect(second.parts).toEqual(first.parts);
  });

  it("retains differing observations from separate sources", () => {
    const result = mergeReviewedMoldBatches([blade()], [approved(), approved({ sourceUrl: "https://example.org/other", note: "A different fixture observation" })]);
    expect(result.added).toBe(2);
    expect(result.parts[0]?.moldBatches).toHaveLength(2);
  });

  it("rejects conflicting rows instead of replacing approved data", () => {
    const parts = mergeReviewedMoldBatches([blade()], [approved()]).parts;
    const before = structuredClone(parts);
    expect(() => mergeReviewedMoldBatches(parts, [approved({ batchCode: "TEST-02" }), approved({ note: "Changed" })])).toThrow("Conflicting Mold Batch");
    expect(parts).toEqual(before);
  });

  it("rejects conflicting duplicates within the proposed review", () => {
    expect(() => mergeReviewedMoldBatches([blade()], [approved(), approved({ note: "Changed" })])).toThrow("Conflicting Mold Batch");
  });

  it("requires an exact current Part id; neither names nor old ids are guessed", () => {
    for (const partId of ["dran-sword", "Dran Sword", "dransword", "UNKNOWN"]) {
      expect(() => mergeReviewedMoldBatches([blade()], [approved({ partId })])).toThrow("Unknown Part id");
    }
  });

  it.each([
    { decision: undefined }, { decision: "accepted" }, { reviewedBy: " " }, { reviewedAt: "yesterday" },
    { sourceExcerpt: " " }, { sourceUrl: "javascript:alert(1)" }, { sourceUrl: "https://user:password@example.com" },
    { capturedAt: undefined }, { attributionStatus: undefined }, { weightGrams: { min: 35, max: 34 } },
    { unknownField: "not silently discarded" },
  ])("rejects invalid approval or evidence: %j", (override) => {
    expect(() => mergeReviewedMoldBatches([blade()], [approved(override)])).toThrow();
  });
});

describe("offline Mold Batch merge CLI", () => {
  let directory: string;
  let partsPath: string;
  let reviewPath: string;
  const script = resolve("scripts/merge-mold-batches.ts");
  const noNetwork = `data:text/javascript,${encodeURIComponent('globalThis.fetch = async () => { throw new Error("NETWORK_MUST_NOT_RUN"); };')}`;
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "oldbaby-mold-review-"));
    partsPath = join(directory, "parts.json");
    reviewPath = join(directory, "review.json");
    writeFileSync(partsPath, JSON.stringify([blade()]));
    writeFileSync(reviewPath, JSON.stringify([approved()]));
  });
  afterEach(() => {
    // Only this test-created temporary directory; never repository fixtures.
    rmSync(directory, { recursive: true, force: true });
  });
  function run(...args: string[]) {
    return spawnSync(process.execPath, ["--import", noNetwork, script, reviewPath, "--parts", partsPath, ...args], { encoding: "utf8", timeout: 15_000 });
  }

  it("defaults to dry-run with no file changes", () => {
    const before = readFileSync(partsPath, "utf8");
    const result = run();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("Dry run");
    expect(readFileSync(partsPath, "utf8")).toBe(before);
    expect(readdirSync(directory).sort()).toEqual(["parts.json", "review.json"]);
  });

  it("requires --write, preserves the review artifact and is byte-idempotent", () => {
    const reviewBefore = readFileSync(reviewPath, "utf8");
    const first = run("--write");
    expect(first.status, first.stderr).toBe(0);
    const after = readFileSync(partsPath, "utf8");
    expect(JSON.parse(after)[0].moldBatches).toHaveLength(1);
    const second = run("--write");
    expect(second.status, second.stderr).toBe(0);
    expect(second.stdout).toContain("not rewritten");
    expect(readFileSync(partsPath, "utf8")).toBe(after);
    expect(readFileSync(reviewPath, "utf8")).toBe(reviewBefore);
    expect(readdirSync(directory).sort()).toEqual(["parts.json", "review.json"]);
  });

  it("accepts schema-defaulted missing moldBatches without rewriting unrelated fields", () => {
    const raw: Record<string, unknown> = { ...blade(), extraCuratedField: "preserve" };
    delete raw.moldBatches;
    writeFileSync(partsPath, JSON.stringify([raw]));
    const before = readFileSync(partsPath, "utf8");

    const preview = run();
    expect(preview.status, preview.stderr).toBe(0);
    expect(readFileSync(partsPath, "utf8")).toBe(before);
    const result = run("--write");
    expect(result.status, result.stderr).toBe(0);
    const [part] = JSON.parse(readFileSync(partsPath, "utf8"));
    expect(part.moldBatches).toHaveLength(1);
    delete part.moldBatches;
    expect(part).toEqual(raw);
  });

  it("does not partly write a proposal with an invalid or unknown approved row", () => {
    const before = readFileSync(partsPath, "utf8");
    writeFileSync(reviewPath, JSON.stringify([approved(), approved({ partId: "UNKNOWN" })]));
    const result = run("--write");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unknown Part id");
    expect(readFileSync(partsPath, "utf8")).toBe(before);
    expect(readdirSync(directory).sort()).toEqual(["parts.json", "review.json"]);
  });

  it("never publishes pending or rejected rows even with --write", () => {
    const before = readFileSync(partsPath, "utf8");
    writeFileSync(reviewPath, JSON.stringify([pending(), approved({ decision: "rejected" })]));
    const result = run("--write");
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("0 added");
    expect(readFileSync(partsPath, "utf8")).toBe(before);
  });

  it("rejects contradictory flags before writing", () => {
    const before = readFileSync(partsPath, "utf8");
    expect(run("--write", "--dry-run").status).toBe(1);
    expect(readFileSync(partsPath, "utf8")).toBe(before);
  });
});
