import { describe, expect, it } from "vitest";
import { searchGenerationCatalog } from "./search.ts";
import type { GenerationCatalogRecord } from "./schema.ts";

const records: GenerationCatalogRecord[] = [
  {
    id: "x:beyblade:dran-sword",
    generationId: "x",
    system: "bx",
    kind: "beyblade",
    partType: null,
    name: "Dran Sword",
    aliases: ["ドランソード", "赤龍劍", "DS"],
    components: [],
    sourceId: "official-x",
    sourceRecordId: "BX-01",
    sourceUrl: "https://example.com/bx-01",
    sourceVersion: "fixture-1",
    verificationStatus: "officially_verified",
    publicationStatus: "accepted",
  },
  {
    id: "burst:beyblade:dran-sword",
    generationId: "burst",
    system: "burst-standard",
    kind: "beyblade",
    partType: null,
    name: "Dran Sword",
    aliases: ["ドランソード"],
    components: [],
    sourceId: "official-burst",
    sourceRecordId: "B-00",
    sourceUrl: "https://example.com/b-00",
    sourceVersion: "fixture-1",
    verificationStatus: "officially_verified",
    publicationStatus: "accepted",
  },
  {
    id: "x:part:blade:dran-sword",
    generationId: "x",
    system: "bx",
    kind: "part",
    partType: "blade",
    name: "Dran Sword",
    aliases: ["DS"],
    components: [],
    sourceId: "official-x",
    sourceRecordId: "BX-01-blade",
    sourceUrl: "https://example.com/bx-01#blade",
    sourceVersion: "fixture-1",
    verificationStatus: "officially_verified",
    publicationStatus: "accepted",
  },
  {
    id: "x:release:bx-01",
    generationId: "x",
    system: "bx",
    kind: "release",
    partType: null,
    name: "Dran Sword Starter",
    aliases: ["BX-01", "赤龍劍入門套裝"],
    components: [],
    sourceId: "official-x",
    sourceRecordId: "BX-01-release",
    sourceUrl: "https://example.com/bx-01-release",
    sourceVersion: "fixture-1",
    verificationStatus: "officially_verified",
    publicationStatus: "accepted",
  },
  {
    id: "metal:part:blade:dran",
    generationId: "metal_fight",
    system: "metal",
    kind: "part",
    partType: "fusion wheel",
    name: "Dranzer",
    aliases: ["DS"],
    components: [],
    sourceId: "official-metal",
    sourceRecordId: "M-01",
    sourceUrl: "https://example.com/m-01",
    sourceVersion: "fixture-1",
    verificationStatus: "officially_verified",
    publicationStatus: "accepted",
  },
  {
    id: "x:equipment:launcher",
    generationId: "x",
    system: "bx",
    kind: "equipment",
    partType: null,
    name: "String Launcher",
    aliases: ["BX Launcher"],
    components: [],
    sourceId: "official-x",
    sourceRecordId: "LAUNCHER-01",
    sourceUrl: "https://example.com/launcher",
    sourceVersion: "fixture-1",
    verificationStatus: "officially_verified",
    publicationStatus: "accepted",
  },
  {
    id: "x:needs-review",
    generationId: "x",
    system: "bx",
    kind: "part",
    partType: "blade",
    name: "Dran Sword candidate",
    aliases: [],
    components: [],
    sourceId: "community",
    sourceRecordId: "review-1",
    sourceUrl: "https://example.com/review",
    sourceVersion: "fixture-1",
    verificationStatus: "needs_review",
    publicationStatus: "needs_review",
  },
];

describe("searchGenerationCatalog", () => {
  it("resolves multilingual aliases and keeps accepted entity kinds distinct", () => {
    expect(searchGenerationCatalog(records, "ドランソード").map((record) => record.id)).toEqual([
      "x:beyblade:dran-sword",
      "burst:beyblade:dran-sword",
    ]);
    expect(searchGenerationCatalog(records, "BX-01", { kind: "release" }).map((record) => record.id)).toEqual([
      "x:release:bx-01",
    ]);
  });

  it("supports generation, system, and Part-kind filters without exposing Needs Review", () => {
    expect(searchGenerationCatalog(records, "DS", { generationId: "metal_fight" }).map((record) => record.id)).toEqual([
      "metal:part:blade:dran",
    ]);
    expect(searchGenerationCatalog(records, "Dran", { system: "bx", partType: "blade" }).map((record) => record.id)).toEqual([
      "x:part:blade:dran-sword",
    ]);
    expect(searchGenerationCatalog(records, "candidate")).toEqual([]);
  });
});
