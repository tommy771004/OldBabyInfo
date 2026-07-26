import { describe, expect, it } from "vitest";
import type { Part } from "@/lib/parts/schema.ts";
import type { GenerationCatalogRecord } from "./schema.ts";
import { buildXCatalogCrosswalk } from "./legacy-x-bridge.ts";

function catalogPart(overrides: Partial<GenerationCatalogRecord> = {}): GenerationCatalogRecord {
  return {
    id: "x:part:dran-sword",
    generationId: "x",
    system: "bx",
    kind: "part",
    partType: "blade",
    name: "Dran Sword",
    aliases: [],
    components: [],
    sourceId: "beybrew",
    sourceRecordId: "blades:Dran Sword",
    sourceUrl: "https://example.com/dran-sword",
    sourceVersion: "fixture-1",
    verificationStatus: "official_app_derived",
    publicationStatus: "accepted",
    ...overrides,
  };
}

function legacyPart(overrides: Partial<Part> = {}): Part {
  return {
    id: "DRANSWORD",
    type: "blade",
    nameEn: "Dran Sword",
    nameJa: "ドランソード",
    nameZhTw: "赤龍劍",
    aliases: ["DS"],
    generation: "X",
    releaseAt: null,
    stats: { attack: 55, defense: 0, stamina: 0 },
    modes: [],
    statEditions: [],
    moldBatches: [],
    ...overrides,
  } as Part;
}

describe("buildXCatalogCrosswalk", () => {
  it("bridges canonical and localized X Part names to the legacy Part id", () => {
    const result = buildXCatalogCrosswalk(
      [catalogPart(), catalogPart({ id: "x:part:alias", name: "赤龍劍", sourceRecordId: "blades:alias" })],
      [legacyPart()],
    );

    expect(result.matches).toEqual([
      { catalogRecordId: "x:part:alias", legacyPartId: "DRANSWORD" },
      { catalogRecordId: "x:part:dran-sword", legacyPartId: "DRANSWORD" },
    ]);
    expect(result.needsReview).toEqual([]);
  });

  it("does not force CX subcomponents or ambiguous names into the X projection", () => {
    const result = buildXCatalogCrosswalk(
      [
        catalogPart({ id: "x:part:cx-main", system: "cx", partType: "main_blade", name: "Dran Sword" }),
        catalogPart({ id: "x:part:ambiguous", name: "Shared" }),
        catalogPart({ id: "x:part:unknown", name: "Unknown" }),
      ],
      [
        legacyPart(),
        legacyPart({ id: "OTHER", nameEn: "Shared" }),
        legacyPart({ id: "OTHER2", nameEn: "Shared" }),
      ],
    );

    expect(result.matches).toEqual([]);
    expect(result.needsReview).toEqual([
      { catalogRecordId: "x:part:ambiguous", reason: "ambiguous" },
      { catalogRecordId: "x:part:unknown", reason: "unmatched" },
    ]);
  });
});
