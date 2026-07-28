import { describe, expect, it } from "vitest";
import {
  humanizePartType,
  isPublishableCatalogName,
  projectedRecordsFirst,
  partSortValues,
  publishableCatalogRecords,
  sortCatalogPartRecords,
  withProjectedSearchAliases,
} from "./catalog-part-rows.ts";
import { searchGenerationCatalog } from "../generation-catalog/search.ts";
import type { GenerationCatalogRecord } from "../generation-catalog/schema.ts";
import type { Part } from "./schema.ts";

function record(overrides: Partial<GenerationCatalogRecord> & { id: string }): GenerationCatalogRecord {
  return {
    generationId: "x",
    system: "bx",
    kind: "part",
    partType: "blade",
    name: overrides.id,
    aliases: [],
    components: [],
    sourceId: "fixture",
    sourceRecordId: overrides.id,
    sourceUrl: "https://example.com/catalog",
    sourceVersion: "fixture:1",
    verificationStatus: "officially_verified",
    publicationStatus: "accepted",
    ...overrides,
  };
}

function blade(id: string, attack: number, releaseAt: string | null): Part {
  return {
    id,
    nameEn: id,
    aliases: [],
    moldBatches: [],
    generation: "X",
    releaseAt,
    type: "blade",
    stats: { attack, defense: 10, stamina: 10 },
    modes: [],
    statEditions: [],
  };
}

describe("publishableCatalogRecords", () => {
  it("drops records whose name never resolved past a placeholder glyph", () => {
    const records = [record({ id: "real", name: "Dran Sword" }), record({ id: "broken", name: "■" })];

    expect(publishableCatalogRecords(records).map((r) => r.id)).toEqual(["real"]);
  });

  it("keeps single-character names that are real Part names", () => {
    expect(isPublishableCatalogName("F")).toBe(true);
    expect(isPublishableCatalogName("双")).toBe(true);
    expect(isPublishableCatalogName("■■")).toBe(false);
    expect(isPublishableCatalogName("   ")).toBe(false);
  });
});

describe("withProjectedSearchAliases", () => {
  it("makes the Catalog search box find a Part by its Chinese name", () => {
    const dranSword: Part = {
      ...blade("DRANSWORD", 60, "2022-05-10"),
      nameJa: "ドランソード",
      nameZhTw: "蒼龍神劍",
      aliases: ["DrSw"],
    };
    const records = [record({ id: "x:part:dran-sword", name: "Dran Sword" })];
    const enriched = withProjectedSearchAliases(records, () => dranSword);

    expect(searchGenerationCatalog(enriched, "蒼龍神劍")).toHaveLength(1);
    expect(searchGenerationCatalog(enriched, "ドランソード")).toHaveLength(1);
    expect(searchGenerationCatalog(enriched, "drsw")).toHaveLength(1);
    // The un-enriched record only ever matched its official English name.
    expect(searchGenerationCatalog(records, "蒼龍神劍")).toHaveLength(0);
  });

  it("leaves a record without a projection untouched", () => {
    const records = [record({ id: "x:part:lock-chip", partType: "lock_chip", name: "Dran" })];

    expect(withProjectedSearchAliases(records, () => undefined)[0]).toBe(records[0]);
  });
});

describe("sortCatalogPartRecords", () => {
  const records = [
    record({ id: "low" }),
    record({ id: "unprojected", partType: "lock_chip" }),
    record({ id: "high" }),
  ];
  const parts: Record<string, Part> = {
    low: blade("low", 20, "2024-01-01"),
    high: blade("high", 60, null),
  };
  const valueFor = partSortValues((recordId: string) => parts[recordId]);

  it("sorts by the projected Stat in both directions", () => {
    expect(sortCatalogPartRecords(records, valueFor, "attack", "desc").map((r) => r.id))
      .toEqual(["high", "low", "unprojected"]);
    expect(sortCatalogPartRecords(records, valueFor, "attack", "asc").map((r) => r.id))
      .toEqual(["low", "high", "unprojected"]);
  });

  it("keeps records with no Stats at the bottom rather than treating them as zero", () => {
    const sorted = sortCatalogPartRecords(records, valueFor, "attack", "asc");

    expect(sorted[sorted.length - 1]?.id).toBe("unprojected");
  });

  it("orders undated Parts against each other without a NaN comparison", () => {
    const undated = [record({ id: "a" }), record({ id: "b" })];
    const undatedParts: Record<string, Part> = { a: blade("a", 1, null), b: blade("b", 2, null) };
    const sorted = sortCatalogPartRecords(undated, partSortValues((id) => undatedParts[id]), "releaseAt", "desc");

    expect(sorted.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("sinks Parts nobody has weighed when sorting by weight", () => {
    const weighed = { ...blade("weighed", 10, null), moldBatches: [
      { batchCode: "A", note: "observed", sourceUrl: "https://example.com/a", weightGrams: { min: 34, max: 35 } },
    ] };
    const records = [record({ id: "unweighed" }), record({ id: "weighed" })];
    const parts: Record<string, Part> = { weighed, unweighed: blade("unweighed", 90, null) };

    for (const direction of ["asc", "desc"] as const) {
      expect(sortCatalogPartRecords(records, partSortValues((id) => parts[id]), "weight", direction).map((r) => r.id))
        .toEqual(["weighed", "unweighed"]);
    }
  });

  it("sinks undated Parts in both directions when sorting by release date", () => {
    // Ascending used to lead with every dateless Part, because a null date
    // reads as -Infinity.
    const records = [record({ id: "undated" }), record({ id: "dated" })];
    const parts: Record<string, Part> = {
      undated: blade("undated", 10, null),
      dated: blade("dated", 10, "2024-01-01"),
    };

    for (const direction of ["asc", "desc"] as const) {
      expect(sortCatalogPartRecords(records, partSortValues((id) => parts[id]), "releaseAt", direction).map((r) => r.id))
        .toEqual(["dated", "undated"]);
    }
  });

  it("does not mutate the input order", () => {
    const input = [...records];
    sortCatalogPartRecords(input, valueFor, "attack", "desc");

    expect(input.map((r) => r.id)).toEqual(["low", "unprojected", "high"]);
  });
});

describe("projectedRecordsFirst", () => {
  const records = [
    record({ id: "lock", partType: "lock_chip" }),
    record({ id: "blade" }),
    record({ id: "assist", partType: "assist_blade" }),
  ];
  const part = blade("blade", 60, "2022-05-10");

  it("opens the list on the Parts that actually carry Stats", () => {
    const ordered = projectedRecordsFirst(records, (record) => record.id === "blade");

    expect(ordered.map((r) => r.id)).toEqual(["blade", "lock", "assist"]);
  });

  it("leaves the Catalog order alone when no row has Stats to lead with", () => {
    const ordered = projectedRecordsFirst(records, () => false);

    expect(ordered).toBe(records);
  });
});

describe("humanizePartType", () => {
  it("reads a raw snake_case key as words", () => {
    expect(humanizePartType("assist_blade")).toBe("Assist Blade");
    expect(humanizePartType("energy_ring")).toBe("Energy Ring");
  });

  it("capitalizes a single-word key so it sits beside the named kinds", () => {
    expect(humanizePartType("driver")).toBe("Driver");
    expect(humanizePartType("disc")).toBe("Disc");
  });

  it("leaves a name that is already readable alone", () => {
    expect(humanizePartType("ドライバー")).toBe("ドライバー");
    expect(humanizePartType("Db Core")).toBe("Db Core");
  });
});
