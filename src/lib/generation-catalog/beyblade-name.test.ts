import { describe, expect, it } from "vitest";
import { buildPartNameIndex, composeBeybladeName, productCodeOf } from "./beyblade-name.ts";
import { getAllGenerationCatalogRecords } from "./repository.ts";
import { getAllParts } from "../parts/repository.ts";
import type { GenerationCatalogRecord } from "./schema.ts";
import type { Part } from "../parts/schema.ts";

function part(overrides: Partial<Part> & { id: string; type: Part["type"] }): Part {
  return {
    nameEn: overrides.id,
    aliases: [],
    moldBatches: [],
    generation: "X",
    releaseAt: null,
    stats: { attack: 1, defense: 1, stamina: 1 },
    modes: [],
    statEditions: [],
    ...overrides,
  } as Part;
}

function beyblade(overrides: Partial<GenerationCatalogRecord> & { id: string }): GenerationCatalogRecord {
  return {
    generationId: "x",
    system: "bx",
    kind: "beyblade",
    partType: null,
    name: overrides.id,
    aliases: [],
    components: [],
    sourceId: "beybrew",
    sourceRecordId: overrides.id,
    sourceUrl: "https://example.com/catalog",
    sourceVersion: "fixture:1",
    verificationStatus: "official_app_derived",
    publicationStatus: "accepted",
    ...overrides,
  };
}

const dranSword = part({ id: "DRANSWORD", type: "blade", nameEn: "Dran Sword", nameZhTw: "蒼龍神劍" });
const variant = part({
  id: "DRANSWORD_GOLD",
  type: "blade",
  nameEn: "DRANSWORD Metallic Coat: Gold",
  nameZhTw: "蒼龍神劍 金屬塗層:燦金",
});
const ratchet = part({ id: "3-60", type: "ratchet", nameEn: "3-60", nameZhTw: "3-60", height: 60 });
const flat = part({
  id: "FLAT",
  type: "bit",
  nameEn: "Flat",
  nameZhTw: "平面",
  aliases: ["F"],
  stats: { attack: 1, defense: 1, stamina: 1, xDash: 1, burstResistance: 1 },
});

const record = beyblade({
  id: "bx01",
  name: "DRANSWORD3-60F",
  sourceRecordId: "series:BX01_DranSword3-60F",
  components: [
    { partType: "blade", name: "DRANSWORD" },
    { partType: "ratchet", name: "3-60" },
    { partType: "bit", name: "F" },
  ],
});

describe("composeBeybladeName", () => {
  it("rebuilds a readable name from the Parts, in the reader's language", () => {
    const index = buildPartNameIndex([dranSword, ratchet, flat]);

    expect(composeBeybladeName(record, index, "zh-TW")).toBe("蒼龍神劍 3-60 平面");
    expect(composeBeybladeName(record, index, "en")).toBe("Dran Sword 3-60 Flat");
  });

  it("resolves a component written as its short code", () => {
    // The composition says "F"; the Part is "Flat" with "F" as an alias.
    const index = buildPartNameIndex([dranSword, ratchet, flat]);

    expect(composeBeybladeName(record, index, "en")).toContain("Flat");
  });

  it("picks the base Part over a colour variant of the same name", () => {
    const index = buildPartNameIndex([variant, dranSword, ratchet, flat]);

    expect(composeBeybladeName(record, index, "zh-TW")).toBe("蒼龍神劍 3-60 平面");
  });

  it("has no name at all when a component cannot be resolved", () => {
    // Inventing a partial name would be worse than showing the model string.
    const index = buildPartNameIndex([dranSword, ratchet]);

    expect(composeBeybladeName(record, index, "zh-TW")).toBeUndefined();
  });

  it("does not compose a name for anything that is not a complete Beyblade", () => {
    const index = buildPartNameIndex([dranSword, ratchet, flat]);
    const asPart = { ...record, kind: "part" as const };

    expect(composeBeybladeName(asPart, index, "zh-TW")).toBeUndefined();
  });
});

describe("productCodeOf", () => {
  it("reads the product code out of the source record id", () => {
    expect(productCodeOf(record)).toBe("BX-01");
    expect(productCodeOf(beyblade({ id: "ux", sourceRecordId: "series:UX21_HellsNether4-70N" }))).toBe("UX-21");
    expect(productCodeOf(beyblade({ id: "bxg", sourceRecordId: "series:BXG70_Something" }))).toBe("BXG-70");
  });

  it("has no answer for a record that carries no model code", () => {
    expect(productCodeOf(beyblade({ id: "x", sourceRecordId: "blades:Dran Sword" }))).toBeUndefined();
  });
});

describe("against the real seed", () => {
  it("names a real share of the X complete Beyblades", () => {
    const index = buildPartNameIndex(getAllParts());
    const beyblades = getAllGenerationCatalogRecords()
      .filter((entry) => entry.generationId === "x" && entry.kind === "beyblade");
    const named = beyblades.filter((entry) => composeBeybladeName(entry, index, "zh-TW"));

    expect(beyblades.length).toBeGreaterThan(200);
    expect(named.length).toBeGreaterThan(100);
  });
});
