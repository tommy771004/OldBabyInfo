import { describe, expect, it } from "vitest";
import type {
  GenerationCatalogRecord,
  GenerationCatalogSnapshot,
  GenerationSource,
} from "./schema.ts";
import {
  promoteNeedsReviewRecord,
  refreshGenerationCatalog,
} from "./refresh.ts";

const source: GenerationSource = {
  id: "fixture-source",
  label: "Fixture source",
  publisher: "Fixture",
  canonicalUrl: "https://example.com/catalog",
  authority: "first_party",
  sourceKind: "official_product",
  sourceRegion: "JP",
  licenseName: null,
  licenseUrl: null,
  rightsStatus: "structured_facts_only",
  generationIds: ["x"],
  sourceVersion: "revision:1",
  contentHash: "sha256:" + "a".repeat(64),
};
const communitySource: GenerationSource = {
  ...source,
  id: "community-source",
  authority: "community_source",
  sourceKind: "community_source",
  rightsStatus: "unknown",
  sourceVersion: "revision:community-1",
  contentHash: "sha256:" + "b".repeat(64),
};

function record(overrides: Partial<GenerationCatalogRecord> = {}): GenerationCatalogRecord {
  return {
    id: "x:part:blade",
    generationId: "x",
    system: "bx",
    kind: "part",
    partType: "blade",
    name: "Dran Sword",
    aliases: ["DS"],
    components: [],
    sourceId: source.id,
    sourceRecordId: "BX-01-blade",
    sourceUrl: source.canonicalUrl,
    sourceVersion: source.sourceVersion,
    verificationStatus: "officially_verified",
    publicationStatus: "accepted",
    ...overrides,
  };
}

function snapshot(records: GenerationCatalogRecord[], capturedAt = "2026-07-26T00:00:00.000Z"): GenerationCatalogSnapshot {
  return {
    schemaVersion: 1,
    capturedAt,
    sources: [source, communitySource],
    generations: [{
      id: "x",
      nameEn: "BEYBLADE X",
      nameJa: "ベイブレードエックス",
      ordinal: 4,
      launchedYear: 2023,
      evidenceSourceId: source.id,
    }, {
      id: "burst",
      nameEn: "Beyblade Burst",
      nameJa: "ベイブレードバースト",
      ordinal: 3,
      launchedYear: 2015,
      evidenceSourceId: source.id,
    }, {
      id: "metal_fight",
      nameEn: "Metal Fight",
      nameJa: "メタルファイト",
      ordinal: 2,
      launchedYear: 2008,
      evidenceSourceId: source.id,
    }, {
      id: "bakuten_shoot",
      nameEn: "Bakuten Shoot",
      nameJa: "爆転シュート",
      ordinal: 1,
      launchedYear: 1999,
      evidenceSourceId: source.id,
    }],
    systems: [{
      id: "bx",
      generationId: "x",
      nameEn: "BX",
      partTypes: ["blade"],
      compatibilityRules: ["fixture"],
    }],
    records,
  };
}

describe("refreshGenerationCatalog", () => {
  it("reports deterministic added, changed, removed, skipped, and review records", async () => {
    const previous = snapshot([record(), record({ id: "x:part:old", name: "Old" })]);
    const result = await refreshGenerationCatalog(previous, snapshot([]), async () => [{
      source,
      records: [
        record({ name: "Dran Sword v2" }),
        record({ id: "x:part:new", name: "New" }),
        record({ id: "x:part:review", publicationStatus: "needs_review", verificationStatus: "needs_review" }),
      ],
      skippedRecordIds: ["x:part:skipped"],
    }]);

    expect(result).toMatchObject({
      status: "updated",
      diff: {
        added: ["x:part:new"],
        changed: ["x:part:blade"],
        removed: ["x:part:old"],
        skipped: ["x:part:skipped"],
        needsReview: ["x:part:review"],
      },
    });
    expect(result.accepted.records.map((item) => item.id)).toEqual(["x:part:blade", "x:part:new"]);
    expect(result.needsReview.records.map((item) => item.id)).toEqual(["x:part:review"]);
  });

  it("retains both snapshots when a source fails or is unexpectedly empty", async () => {
    const previous = snapshot([record()]);
    await expect(refreshGenerationCatalog(previous, snapshot([]), async () => {
      throw new Error("upstream unavailable");
    })).resolves.toMatchObject({ status: "failed", accepted: previous, error: "upstream unavailable" });
    await expect(refreshGenerationCatalog(previous, snapshot([]), async () => [{ source, records: [] }]))
      .resolves.toMatchObject({ status: "failed", accepted: previous, error: expect.stringContaining("empty") });
  });

  it("routes duplicate identity conflicts to Needs Review instead of publishing either variant", async () => {
    const previous = snapshot([]);
    const result = await refreshGenerationCatalog(previous, snapshot([]), async () => [{
      source,
      records: [record(), record({ name: "Conflicting name", sourceRecordId: "BX-01-conflict" })],
    }]);

    expect(result.status).toBe("updated");
    if (result.status !== "updated") throw new Error("Expected updated refresh");
    expect(result.accepted.records).toEqual([]);
    expect(result.needsReview.records).toHaveLength(1);
    expect(result.diff.needsReview).toEqual(["x:part:blade"]);
  });
});

describe("promoteNeedsReviewRecord", () => {
  it("promotes a verified candidate while preserving source provenance", () => {
    const candidate = record({
      publicationStatus: "needs_review",
      verificationStatus: "needs_review",
      sourceId: "community-source",
      sourceRecordId: "community:blade",
    });
    const result = promoteNeedsReviewRecord(
      snapshot([]),
      snapshot([candidate]),
      candidate.id,
      "community_sourced",
    );

    expect(result.accepted.records[0]).toMatchObject({
      id: candidate.id,
      sourceId: "community-source",
      sourceRecordId: "community:blade",
      publicationStatus: "accepted",
      verificationStatus: "community_sourced",
    });
    expect(result.needsReview.records).toEqual([]);
  });
});
