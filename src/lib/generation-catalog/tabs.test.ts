import { describe, expect, it } from "vitest";
import { catalogTabsOf, isTabSelected } from "./tabs.ts";
import type { GenerationCatalogRecord, GenerationSystem } from "./schema.ts";

function record(
  id: string,
  kind: GenerationCatalogRecord["kind"],
  partType: string | null = null,
): GenerationCatalogRecord {
  return {
    id,
    generationId: "x",
    system: "bx",
    kind,
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

const systems: GenerationSystem[] = [
  {
    id: "x",
    generationId: "x",
    nameEn: "BEYBLADE X",
    partTypes: ["blade", "ratchet", "bit"],
    compatibilityRules: [],
  },
  {
    id: "cx",
    generationId: "x",
    nameEn: "CX",
    partTypes: ["main_blade", "assist_blade", "lock_chip"],
    compatibilityRules: [],
  },
];

describe("catalogTabsOf", () => {
  const records = [
    record("bit-1", "part", "bit"),
    record("chip-1", "part", "lock_chip"),
    record("blade-1", "part", "blade"),
    record("blade-2", "part", "blade"),
    record("bx01", "beyblade"),
    record("ratchet-1", "part", "ratchet"),
  ];

  it("orders Part kinds the way the Generation's own Systems declare them", () => {
    expect(catalogTabsOf(records, systems).map((tab) => tab.partType ?? tab.kind)).toEqual([
      "beyblade",
      "part",
      "blade",
      "ratchet",
      "bit",
      "lock_chip",
    ]);
  });

  it("counts each tab", () => {
    const tabs = catalogTabsOf(records, systems);

    expect(tabs.find((tab) => tab.partType === "blade")?.count).toBe(2);
    expect(tabs.find((tab) => tab.kind === "part" && !tab.partType)?.count).toBe(5);
    expect(tabs.find((tab) => tab.kind === "beyblade")?.count).toBe(1);
  });

  it("gives no tab to a category with nothing in it", () => {
    expect(catalogTabsOf(records, systems).some((tab) => tab.kind === "release")).toBe(false);
  });

  it("skips the all-Parts tab when there is only one Part kind to show", () => {
    const tabs = catalogTabsOf([record("blade-1", "part", "blade")], systems);

    expect(tabs.map((tab) => tab.partType)).toEqual(["blade"]);
  });

  it("still surfaces a Part kind no System declared", () => {
    const tabs = catalogTabsOf([...records, record("odd-1", "part", "over_blade")], systems);

    expect(tabs.at(-1)?.partType).toBe("over_blade");
  });
});

describe("isTabSelected", () => {
  it("distinguishes the all-Parts tab from a single Part kind", () => {
    const allParts = { kind: "part" as const, count: 5 };
    const blades = { kind: "part" as const, partType: "blade", count: 2 };

    expect(isTabSelected(allParts, "part", undefined)).toBe(true);
    expect(isTabSelected(allParts, "part", "blade")).toBe(false);
    expect(isTabSelected(blades, "part", "blade")).toBe(true);
    expect(isTabSelected(blades, "beyblade", "blade")).toBe(false);
  });
});
