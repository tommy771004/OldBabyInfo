import { describe, expect, it } from "vitest";
import type { GenerationCatalogRecord } from "@/lib/generation-catalog/schema.ts";
import { catalogViewQuery, parseCatalogView, selectCatalogView } from "./catalog-view.ts";

function record(overrides: Partial<GenerationCatalogRecord> & Pick<GenerationCatalogRecord, "id">): GenerationCatalogRecord {
  return {
    generationId: "x",
    system: "bx",
    kind: "part",
    partType: "blade",
    name: overrides.id,
    aliases: [],
    components: [],
    sourceId: "fixture-source",
    sourceRecordId: overrides.id,
    sourceUrl: "https://example.com/catalog",
    sourceVersion: "fixture:1",
    verificationStatus: "officially_verified",
    publicationStatus: "accepted",
    ...overrides,
  };
}

const RECORDS = [
  record({ id: "x:blade:dran-sword", name: "Dran Sword", aliases: ["ドランソード"] }),
  record({ id: "x:ratchet:3-60", partType: "ratchet", name: "3-60" }),
  record({ id: "x:cx:main", system: "cx", partType: "main_blade", name: "Main Blade" }),
  record({ id: "x:beyblade:dran-sword", kind: "beyblade", partType: null, name: "Dran Sword 3-60F" }),
  record({ id: "burst:beyblade:dran-sword", generationId: "burst", system: "burst-standard", kind: "beyblade", partType: null, name: "Dran Sword", aliases: ["ドランソード"] }),
  record({ id: "x:blade:placeholder", name: "■■■" }),
];

const ids = (records: GenerationCatalogRecord[]) => records.map((r) => r.id);

describe("parseCatalogView", () => {
  it("defaults to the Parts tab of BEYBLADE X when the URL says nothing", () => {
    expect(parseCatalogView({})).toEqual({
      generation: "x",
      acrossGenerations: false,
      system: undefined,
      kind: "part",
      partType: undefined,
      query: undefined,
    });
  });

  it("searches across Generations only for the explicit empty value", () => {
    expect(parseCatalogView({ catalogKind: "part" }).acrossGenerations).toBe(false);
    expect(parseCatalogView({ catalogGeneration: "nonsense" })).toMatchObject({ generation: "x", acrossGenerations: false });
    expect(parseCatalogView({ catalogGeneration: "" }).acrossGenerations).toBe(true);
  });

  it("drops the System on an all-Generations search", () => {
    expect(parseCatalogView({ catalogGeneration: "x", catalogSystem: "cx" }).system).toBe("cx");
    expect(parseCatalogView({ catalogGeneration: "", catalogSystem: "cx" }).system).toBeUndefined();
  });

  it("falls back to the Parts tab for an unknown kind", () => {
    expect(parseCatalogView({ catalogKind: "combo" }).kind).toBe("part");
    expect(parseCatalogView({ catalogKind: "all" }).kind).toBe("all");
  });
});

describe("selectCatalogView", () => {
  it("narrows the list to one Part kind but counts tabs over every kind", () => {
    const { records, tabPool } = selectCatalogView(RECORDS, parseCatalogView({ catalogPartType: "blade" }));
    expect(ids(records)).toEqual(["x:blade:dran-sword"]);
    // The tab pool is the Generation before the tab narrows it, so the
    // Ratchet and Beyblade tabs stay reachable.
    expect(ids(tabPool)).toEqual(["x:blade:dran-sword", "x:ratchet:3-60", "x:cx:main", "x:beyblade:dran-sword"]);
  });

  it("searches aliases across Generations for the all-Generations scope", () => {
    const view = parseCatalogView({ catalogGeneration: "", catalogKind: "beyblade", catalogQuery: "ドランソード" });
    expect(ids(selectCatalogView(RECORDS, view).records)).toEqual(["burst:beyblade:dran-sword"]);
    const tabPool = selectCatalogView(RECORDS, { ...view, kind: "all" }).tabPool;
    expect(ids(tabPool)).toEqual(["x:blade:dran-sword", "burst:beyblade:dran-sword"]);
  });

  it("keeps a search inside the selected Generation and System", () => {
    const { records } = selectCatalogView(RECORDS, parseCatalogView({ catalogGeneration: "x", catalogKind: "all", catalogQuery: "dran" }));
    expect(ids(records)).toEqual(["x:blade:dran-sword", "x:beyblade:dran-sword"]);
    const cx = selectCatalogView(RECORDS, parseCatalogView({ catalogGeneration: "x", catalogSystem: "cx", catalogKind: "all" }));
    expect(ids(cx.records)).toEqual(["x:cx:main"]);
  });

  it("never lists or counts a placeholder name", () => {
    const { records, tabPool } = selectCatalogView(RECORDS, parseCatalogView({ catalogPartType: "blade" }));
    expect(ids(records)).not.toContain("x:blade:placeholder");
    expect(ids(tabPool)).not.toContain("x:blade:placeholder");
  });
});

describe("catalogViewQuery", () => {
  it("round-trips an all-Generations search, its query and the page size", () => {
    const view = parseCatalogView({ catalogGeneration: "", catalogSystem: "cx", catalogKind: "beyblade", catalogQuery: "dran" });
    const query = catalogViewQuery(view, 50);
    expect(query).toEqual({ catalogGeneration: "", catalogKind: "beyblade", catalogQuery: "dran", catalogSize: "50" });
    // Through a real URL and back, the empty Generation survives — it is
    // what keeps the next link in the all-Generations search.
    expect(parseCatalogView(Object.fromEntries(new URLSearchParams(query)))).toEqual(view);
  });

  it("carries the System within one Generation and leaves out the default page size", () => {
    expect(catalogViewQuery(parseCatalogView({ catalogGeneration: "x", catalogSystem: "cx", catalogPartType: "main_blade" }), 10))
      .toEqual({ catalogGeneration: "x", catalogSystem: "cx", catalogKind: "part", catalogPartType: "main_blade" });
  });
});
