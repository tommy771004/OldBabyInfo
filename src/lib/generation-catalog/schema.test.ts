import { describe, expect, it } from "vitest";
import { generationCatalogSnapshotSchema } from "./schema.ts";

const source = {
  id: "fixture-source",
  label: "Fixture source",
  publisher: "OldBabyInfo",
  canonicalUrl: "https://example.com/catalog",
  authority: "first_party" as const,
  sourceKind: "official_product" as const,
  sourceRegion: "global",
  licenseName: null,
  licenseUrl: null,
  rightsStatus: "structured_facts_only" as const,
  generationIds: ["x" as const],
  sourceVersion: "fixture:1",
  contentHash: `sha256:${"a".repeat(64)}`,
};

const generations = [
  {
    id: "bakuten_shoot" as const,
    nameEn: "Original Generation",
    nameJa: "爆転シュート ベイブレード",
    ordinal: 1,
    launchedYear: 1999,
    evidenceSourceId: source.id,
  },
  {
    id: "metal_fight" as const,
    nameEn: "Metal Fight Beyblade",
    nameJa: "メタルファイト ベイブレード",
    ordinal: 2,
    launchedYear: 2008,
    evidenceSourceId: source.id,
  },
  {
    id: "burst" as const,
    nameEn: "Beyblade Burst",
    nameJa: "ベイブレードバースト",
    ordinal: 3,
    launchedYear: 2015,
    evidenceSourceId: source.id,
  },
  {
    id: "x" as const,
    nameEn: "BEYBLADE X",
    nameJa: "ベイブレードエックス",
    ordinal: 4,
    launchedYear: 2023,
    evidenceSourceId: source.id,
  },
];

describe("cross-generation catalog contract", () => {
  it("accepts distinct Beyblade, Part, Release, and Equipment entities", () => {
    const snapshot = generationCatalogSnapshotSchema.parse({
      schemaVersion: 1,
      capturedAt: "2026-07-26T00:00:00.000Z",
      sources: [source],
      generations,
      systems: [{
        id: "cx",
        generationId: "x",
        nameEn: "CX",
        partTypes: ["main_blade", "assist_blade", "lock_chip"],
        compatibilityRules: ["main_blade + assist_blade + lock_chip"],
      }],
      records: [
        {
          id: "x:part:main-blade",
          generationId: "x",
          system: "cx",
          kind: "part",
          partType: "main_blade",
          name: "Main Blade",
          aliases: [],
          components: [],
          sourceId: source.id,
          sourceRecordId: "part:main-blade",
          sourceUrl: source.canonicalUrl,
          sourceVersion: source.sourceVersion,
          verificationStatus: "officially_verified",
          publicationStatus: "accepted",
        },
        {
          id: "x:beyblade:01",
          generationId: "x",
          system: "cx",
          kind: "beyblade",
          partType: null,
          name: "CX-01",
          aliases: [],
          components: [{
            recordId: "x:part:main-blade",
            partType: "main_blade",
            name: "Main Blade",
          }],
          sourceId: source.id,
          sourceRecordId: "beyblade:01",
          sourceUrl: source.canonicalUrl,
          sourceVersion: source.sourceVersion,
          verificationStatus: "officially_verified",
          publicationStatus: "accepted",
        },
        {
          id: "x:release:01",
          generationId: "x",
          system: "cx",
          kind: "release",
          partType: null,
          name: "CX-01 Starter",
          aliases: [],
          components: [],
          releaseOf: "x:beyblade:01",
          containsRecordIds: ["x:part:main-blade", "x:equipment:launcher"],
          sourceId: source.id,
          sourceRecordId: "release:01",
          sourceUrl: source.canonicalUrl,
          sourceVersion: source.sourceVersion,
          verificationStatus: "officially_verified",
          publicationStatus: "accepted",
          comboEligible: false,
        },
        {
          id: "x:equipment:launcher",
          generationId: "x",
          system: "cx",
          kind: "equipment",
          partType: null,
          name: "Launcher",
          aliases: [],
          components: [],
          sourceId: source.id,
          sourceRecordId: "equipment:launcher",
          sourceUrl: source.canonicalUrl,
          sourceVersion: source.sourceVersion,
          verificationStatus: "officially_verified",
          publicationStatus: "accepted",
          comboEligible: false,
        },
      ],
    });

    expect(snapshot.systems[0]?.partTypes).toContain("main_blade");
    expect(snapshot.records.map((record) => record.kind)).toEqual([
      "part",
      "beyblade",
      "release",
      "equipment",
    ]);
    expect(snapshot.records.find((record) => record.kind === "release")?.containsRecordIds).toEqual([
      "x:part:main-blade",
      "x:equipment:launcher",
    ]);
  });

  it("rejects equipment that is marked Combo-eligible", () => {
    expect(() => generationCatalogSnapshotSchema.parse({
      schemaVersion: 1,
      capturedAt: "2026-07-26T00:00:00.000Z",
      sources: [source],
      generations,
      systems: [],
      records: [{
        id: "x:equipment:invalid",
        generationId: "x",
        system: "cx",
        kind: "equipment",
        partType: null,
        name: "Launcher",
        aliases: [],
        components: [],
        sourceId: source.id,
        sourceRecordId: "equipment:invalid",
        sourceUrl: source.canonicalUrl,
        sourceVersion: source.sourceVersion,
        verificationStatus: "officially_verified",
        publicationStatus: "accepted",
        comboEligible: true,
      }],
    })).toThrow(/cannot enter a Combo/i);
  });

  it("rejects a component or release relationship that points to an unknown record", () => {
    expect(() => generationCatalogSnapshotSchema.parse({
      schemaVersion: 1,
      capturedAt: "2026-07-26T00:00:00.000Z",
      sources: [source],
      generations,
      systems: [],
      records: [{
        id: "x:release:missing",
        generationId: "x",
        system: "cx",
        kind: "release",
        partType: null,
        name: "Missing model release",
        aliases: [],
        components: [],
        releaseOf: "x:beyblade:does-not-exist",
        sourceId: source.id,
        sourceRecordId: "release:missing",
        sourceUrl: source.canonicalUrl,
        sourceVersion: source.sourceVersion,
        verificationStatus: "officially_verified",
        publicationStatus: "accepted",
      }],
    })).toThrow(/unknown record/i);
  });
});
