import { describe, expect, it } from "vitest";
import {
  availableFacetValues,
  catalogFacetQuery,
  facetsForPartType,
  filterCatalogRecordsByFacets,
  parseCatalogFacetParams,
} from "./catalog-facets.ts";
import type { GenerationCatalogRecord } from "../generation-catalog/schema.ts";
import type { Part } from "./schema.ts";

function record(id: string, partType: string): GenerationCatalogRecord {
  return {
    id,
    generationId: "x",
    system: "bx",
    kind: "part",
    partType,
    name: id,
    aliases: [],
    components: [],
    sourceId: "fixture",
    sourceRecordId: id,
    sourceUrl: "https://example.com/catalog",
    sourceVersion: "fixture:1",
    verificationStatus: "officially_verified",
    publicationStatus: "accepted",
  };
}

const parts: Record<string, Part> = {
  "attack-blade": {
    id: "attack-blade",
    nameEn: "Dran Sword",
    aliases: [],
    moldBatches: [],
    generation: "X",
    releaseAt: null,
    type: "blade",
    stats: { attack: 60, defense: 30, stamina: 25 },
    playstyle: "attack",
    modes: [],
    statEditions: [],
  },
  "stamina-blade": {
    id: "stamina-blade",
    nameEn: "Wizard Rod",
    aliases: [],
    moldBatches: [],
    generation: "X",
    releaseAt: null,
    type: "blade",
    stats: { attack: 20, defense: 30, stamina: 60 },
    playstyle: "stamina",
    modes: [],
    statEditions: [],
  },
  "ratchet-3-60": {
    id: "ratchet-3-60",
    nameEn: "3-60",
    aliases: [],
    moldBatches: [],
    generation: "X",
    releaseAt: null,
    type: "ratchet",
    stats: { attack: 15, defense: 9, stamina: 6 },
    height: 60,
    statEditions: [],
  },
  "ratchet-m-85": {
    id: "ratchet-m-85",
    nameEn: "M-85",
    aliases: [],
    moldBatches: [],
    generation: "X",
    releaseAt: null,
    type: "ratchet",
    stats: { attack: 10, defense: 10, stamina: 10 },
    height: 85,
    statEditions: [],
  },
};

const projectionFor = (recordId: string) => parts[recordId];

describe("facetsForPartType", () => {
  it("offers each Part kind only the facets its data can answer", () => {
    expect(facetsForPartType("blade")).toEqual(["playstyle", "spinDirection"]);
    // A Bit's tip shape decides how it moves; a Blade's spin decides whether
    // a player's launcher can even fire it.
    expect(facetsForPartType("bit")).toEqual(["playstyle", "bitShape"]);
    expect(facetsForPartType("ratchet")).toEqual(["ratchetTeeth", "ratchetHeight"]);
    // A Lock Chip has no sourced classification — no facet row at all.
    expect(facetsForPartType("lock_chip")).toEqual([]);
    expect(facetsForPartType(undefined)).toEqual([]);
  });
});

describe("filterCatalogRecordsByFacets", () => {
  const records = [
    record("attack-blade", "blade"),
    record("stamina-blade", "blade"),
    record("ratchet-3-60", "ratchet"),
    record("ratchet-m-85", "ratchet"),
    record("variant", "blade"),
  ];

  it("returns the list untouched when nothing is selected", () => {
    expect(filterCatalogRecordsByFacets(records, projectionFor, {})).toBe(records);
  });

  it("filters Blades by the official playstyle", () => {
    expect(filterCatalogRecordsByFacets(records, projectionFor, { playstyle: "attack" }).map((r) => r.id))
      .toEqual(["attack-blade"]);
  });

  it("filters Ratchets by teeth and by height", () => {
    expect(filterCatalogRecordsByFacets(records, projectionFor, { teeth: 3 }).map((r) => r.id))
      .toEqual(["ratchet-3-60"]);
    expect(filterCatalogRecordsByFacets(records, projectionFor, { teeth: "metal" }).map((r) => r.id))
      .toEqual(["ratchet-m-85"]);
    expect(filterCatalogRecordsByFacets(records, projectionFor, { height: 85 }).map((r) => r.id))
      .toEqual(["ratchet-m-85"]);
  });

  it("drops records with no projection, which can't answer a facet either way", () => {
    expect(filterCatalogRecordsByFacets(records, projectionFor, { playstyle: "attack" }).map((r) => r.id))
      .not.toContain("variant");
  });
});

describe("availableFacetValues", () => {
  it("offers only values that are actually present", () => {
    const values = availableFacetValues(
      [record("attack-blade", "blade"), record("ratchet-m-85", "ratchet"), record("variant", "blade")],
      projectionFor,
    );

    expect(values.playstyles).toEqual(["attack"]);
    expect(values.teeth).toEqual(["metal"]);
    expect(values.heights).toEqual([85]);
  });

  it("keeps playstyles in the official order and sinks the metal Ratchet last", () => {
    const values = availableFacetValues(
      [
        record("stamina-blade", "blade"),
        record("attack-blade", "blade"),
        record("ratchet-m-85", "ratchet"),
        record("ratchet-3-60", "ratchet"),
      ],
      projectionFor,
    );

    expect(values.playstyles).toEqual(["attack", "stamina"]);
    expect(values.teeth).toEqual([3, "metal"]);
    expect(values.heights).toEqual([60, 85]);
  });
});

describe("facet params", () => {
  it("round-trips a selection through the URL", () => {
    const state = { playstyle: "defense" as const, teeth: "metal" as const, height: 85 };

    expect(parseCatalogFacetParams(catalogFacetQuery(state))).toEqual(state);
  });

  it("ignores values a hand-edited link can carry", () => {
    expect(parseCatalogFacetParams({ playstyle: "wombat", teeth: "x", height: "-3" })).toEqual({
      playstyle: undefined,
      teeth: undefined,
      height: undefined,
    });
  });
});
