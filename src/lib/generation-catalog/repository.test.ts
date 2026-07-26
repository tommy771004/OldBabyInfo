import { describe, expect, it } from "vitest";
import {
  getAllGenerationCatalogRecords,
  getGenerationCatalogNeedsReview,
  getGenerationCatalogRecords,
  getGenerationCatalogSnapshot,
  getLegacyPartForCatalogRecord,
} from "./repository.ts";

describe("generation catalog repository", () => {
  it("loads the committed accepted and Needs Review snapshots", () => {
    expect(getAllGenerationCatalogRecords().length).toBeGreaterThan(1_000);
    expect(getGenerationCatalogNeedsReview().length).toBeGreaterThan(100);
  });

  it("contains records for all four official generations", () => {
    const snapshot = getGenerationCatalogSnapshot();
    expect(snapshot.generations.map((generation) => generation.id)).toEqual([
      "bakuten_shoot",
      "metal_fight",
      "burst",
      "x",
    ]);
    for (const generation of snapshot.generations) {
      expect(getGenerationCatalogRecords(generation.id).length).toBeGreaterThan(0);
    }
  });

  it("keeps System definitions separate from Generation definitions", () => {
    const snapshot = getGenerationCatalogSnapshot();
    expect(snapshot.systems.map((system) => system.id)).toEqual(expect.arrayContaining([
      "plastic",
      "hms",
      "metal_system",
      "hybrid_wheel",
      "4d",
      "zero_g_synchrome",
      "burst",
      "gatinko",
      "superking",
      "dynamite_battle",
      "burst_ultimate",
      "bx",
      "ux",
      "cx",
    ]));
    expect(snapshot.systems.find((system) => system.id === "cx")).toMatchObject({
      generationId: "x",
      partTypes: expect.arrayContaining(["main_blade", "assist_blade", "lock_chip"]),
    });
  });

  it("keeps complete Beyblades and component parts as separate record kinds", () => {
    const xRecords = getGenerationCatalogRecords("x");
    expect(xRecords.some((record) => record.kind === "beyblade")).toBe(true);
    expect(xRecords.some((record) => record.kind === "part")).toBe(true);
  });

  it("keeps X lines and CX subcomponent kinds independently browseable", () => {
    const xRecords = getGenerationCatalogRecords("x");
    expect(xRecords.some((record) => record.kind === "beyblade" && record.system === "bx")).toBe(true);
    expect(xRecords.some((record) => record.kind === "beyblade" && record.system === "ux")).toBe(true);
    expect(xRecords.some((record) => record.kind === "beyblade" && record.system === "cx")).toBe(true);
    expect(xRecords.some((record) => record.kind === "part" && record.system === "cx" && record.partType === "main_blade")).toBe(true);
    expect(xRecords.some((record) => record.kind === "part" && record.system === "cx" && record.partType === "assist_blade")).toBe(true);
  });

  it("keeps Burst Layer systems and official/community provenance distinct", () => {
    const snapshot = getGenerationCatalogSnapshot();
    const burstSystemIds = snapshot.systems
      .filter((system) => system.generationId === "burst")
      .map((system) => system.id);
    expect(burstSystemIds).toEqual(expect.arrayContaining([
      "single_layer",
      "dual_layer",
      "god",
      "cho_z",
      "gatinko",
      "superking",
      "dynamite_battle",
      "burst_ultimate",
    ]));
    const burstRecords = getGenerationCatalogRecords("burst");
    expect(burstRecords.some((record) => record.kind === "beyblade" && record.verificationStatus === "officially_verified")).toBe(true);
    expect(burstRecords.some((record) => record.kind === "part" && record.sourceId === "beyblade-fandom" && record.verificationStatus === "community_sourced")).toBe(true);
  });

  it("keeps Metal Fight systems and rights-unclear compositions separated", () => {
    const snapshot = getGenerationCatalogSnapshot();
    expect(snapshot.systems
      .filter((system) => system.generationId === "metal_fight")
      .map((system) => system.id)).toEqual(expect.arrayContaining([
        "metal_system",
        "hybrid_wheel",
        "4d",
        "zero_g_synchrome",
      ]));
    const metalRecords = getGenerationCatalogRecords("metal_fight");
    expect(metalRecords.some((record) => record.sourceId === "beyblade-fandom" && record.kind === "part")).toBe(true);
    expect(getGenerationCatalogNeedsReview().some((record) => record.generationId === "metal_fight" && record.kind === "beyblade")).toBe(true);
    expect(getAllGenerationCatalogRecords().some((record) => record.generationId === "metal_fight" && record.kind === "beyblade" && record.publicationStatus === "needs_review")).toBe(false);
  });

  it("keeps Plastic and HMS incompatible while retaining rights-unclear stock candidates", () => {
    const snapshot = getGenerationCatalogSnapshot();
    const originalSystems = snapshot.systems.filter((system) => system.generationId === "bakuten_shoot");
    expect(originalSystems.map((system) => system.id)).toEqual(expect.arrayContaining(["plastic", "hms"]));
    expect(originalSystems.find((system) => system.id === "plastic")?.compatibilityRules[0]).toMatch(/incompatible/i);
    expect(originalSystems.find((system) => system.id === "hms")?.compatibilityRules[0]).toMatch(/incompatible/i);
    expect(getGenerationCatalogRecords("bakuten_shoot").every((record) => record.publicationStatus === "accepted")).toBe(true);
    expect(getGenerationCatalogNeedsReview().some((record) => record.generationId === "bakuten_shoot" && record.kind === "beyblade")).toBe(true);
  });

  it("keeps official Burst Releases separate from their Beyblade models", () => {
    const records = getGenerationCatalogRecords("burst");
    const byId = new Map(records.map((record) => [record.id, record]));
    const releases = records.filter((record) => record.kind === "release");
    expect(releases.length).toBeGreaterThan(100);
    expect(releases.every((release) =>
      release.verificationStatus === "officially_verified" &&
      release.comboEligible === false &&
      release.releaseOf &&
      byId.get(release.releaseOf)?.kind === "beyblade" &&
      (release.containsRecordIds ?? []).every((id) => byId.has(id)),
    )).toBe(true);
  });

  it("bridges an X Catalog Part back to the legacy X projection without bridging CX", () => {
    const dranSword = getAllGenerationCatalogRecords().find((record) =>
      record.generationId === "x" && record.kind === "part" && record.name === "Dran Sword",
    );
    expect(dranSword).toBeDefined();
    expect(getLegacyPartForCatalogRecord(dranSword!.id)?.id).toBe("DRANSWORD");

    const cxPart = getAllGenerationCatalogRecords().find((record) =>
      record.generationId === "x" && record.system === "cx" && record.partType === "main_blade",
    );
    expect(cxPart).toBeDefined();
    expect(getLegacyPartForCatalogRecord(cxPart!.id)).toBeUndefined();
  });
});
