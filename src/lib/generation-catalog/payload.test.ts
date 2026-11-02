import { describe, expect, it } from "vitest";
import { getCatalogPayloadBudget } from "./payload.ts";
import { searchGenerationCatalog } from "./search.ts";
import type { GenerationCatalogRecord } from "./schema.ts";

const records: GenerationCatalogRecord[] = [
  {
    id: "x:part:blade",
    generationId: "x",
    system: "bx",
    kind: "part",
    partType: "blade",
    name: "Blade",
    aliases: [],
    components: [],
    sourceId: "fixture",
    sourceRecordId: "blade",
    sourceUrl: "https://example.com/blade",
    sourceVersion: "fixture-1",
    verificationStatus: "officially_verified",
    publicationStatus: "accepted",
  },
  {
    id: "burst:part:blade",
    generationId: "burst",
    system: "burst",
    kind: "part",
    partType: "layer",
    name: "Layer",
    aliases: [],
    components: [],
    sourceId: "fixture",
    sourceRecordId: "layer",
    sourceUrl: "https://example.com/layer",
    sourceVersion: "fixture-1",
    verificationStatus: "officially_verified",
    publicationStatus: "accepted",
  },
];

describe("catalog payload selection", () => {
  // `/parts` browses and searches through the same call; only whether a
  // Generation is given differs.
  it("loads only the active Generation for browse pages and all accepted records for search", () => {
    expect(searchGenerationCatalog(records, "", { generationId: "x" }).map((record) => record.id)).toEqual(["x:part:blade"]);
    expect(searchGenerationCatalog(records, "").map((record) => record.id)).toEqual([
      "x:part:blade",
      "burst:part:blade",
    ]);
  });

  it("exposes an explicit per-Generation serialized payload budget", () => {
    expect(getCatalogPayloadBudget()).toBeGreaterThan(0);
  });
});
