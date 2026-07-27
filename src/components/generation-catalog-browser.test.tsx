import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GenerationCatalogBrowser } from "./generation-catalog-browser.tsx";
import type { GenerationCatalogRecord } from "@/lib/generation-catalog/schema.ts";

const generations = [{
  id: "x" as const,
  nameEn: "BEYBLADE X",
  nameJa: "ベイブレードエックス",
  ordinal: 4,
  launchedYear: 2023,
  evidenceSourceId: "fixture-source",
}, {
  id: "burst" as const,
  nameEn: "Beyblade Burst",
  nameJa: "ベイブレードバースト",
  ordinal: 3,
  launchedYear: 2015,
  evidenceSourceId: "fixture-source",
}];

const systems = [{
  id: "cx",
  generationId: "x" as const,
  nameEn: "CX",
  partTypes: ["main_blade", "assist_blade", "lock_chip"],
  compatibilityRules: ["main blade + assist blade + lock chip is system-scoped; incompatible with other Systems."],
}];

const records = [
  {
    id: "x:part:main-blade",
    generationId: "x" as const,
    system: "cx",
    kind: "part" as const,
    partType: "main_blade",
    name: "Main Blade",
    aliases: [],
    components: [],
    sourceId: "fixture-source",
    sourceRecordId: "part:main-blade",
    sourceUrl: "https://example.com/catalog",
    sourceVersion: "fixture:1",
    verificationStatus: "officially_verified" as const,
    publicationStatus: "accepted" as const,
  },
  {
    id: "x:beyblade:cx01",
    generationId: "x" as const,
    system: "cx",
    kind: "beyblade" as const,
    partType: null,
    name: "CX-01",
    aliases: [],
    components: [{ recordId: "x:part:main-blade", partType: "main_blade", name: "Main Blade" }],
    sourceId: "fixture-source",
    sourceRecordId: "beyblade:cx01",
    sourceUrl: "https://example.com/catalog",
    sourceVersion: "fixture:1",
    verificationStatus: "officially_verified" as const,
    publicationStatus: "accepted" as const,
  },
  {
    id: "x:release:cx01",
    generationId: "x" as const,
    system: "cx",
    kind: "release" as const,
    partType: null,
    name: "CX-01 Starter JP",
    aliases: [],
    components: [],
    sourceId: "fixture-source",
    sourceRecordId: "release:cx01",
    sourceUrl: "https://example.com/catalog",
    sourceVersion: "fixture:1",
    verificationStatus: "officially_verified" as const,
    publicationStatus: "accepted" as const,
    releaseOf: "x:beyblade:cx01",
    containsRecordIds: ["x:beyblade:cx01", "x:part:main-blade"],
    sku: "CX-01",
    region: "JP",
    comboEligible: false,
  },
];

const labels = {
  heading: "Parts Catalog",
  generationLabel: "Generation",
  systemLabel: "System",
  kindLabel: "Entity type",
  allLabel: "All",
  beybladeLabel: "Complete Beyblades",
  partLabel: "Parts",
  compositionHeading: "Stock composition",
  containedByHeading: "Contained in complete Beyblades",
  releasesHeading: "Releases",
  releaseContentsHeading: "Release contents",
  releaseLabel: "Release",
  equipmentLabel: "Equipment",
};

describe("GenerationCatalogBrowser", () => {
  // Renders used to pile up in the document between cases, which quietly
  // turned single-element queries into "found multiple" once a case stopped
  // scoping its own markup.
  afterEach(cleanup);

  it("distinguishes complete Beyblades from Parts and navigates their composition", () => {
    render(
      <GenerationCatalogBrowser
        locale="en"
        generations={generations}
        systems={systems}
        records={records}
        selectedGeneration="x"
        selectedSystem="cx"
        labels={labels}
      />,
    );

    // The browser no longer prints its own heading — the page's <h1> names
    // it, and two titles saying the same thing opened every visit. It still
    // has to be a named region.
    expect(screen.getByRole("region", { name: "Parts Catalog" })).toBeInTheDocument();
    expect(screen.getByText(/incompatible with other Systems/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Beyblade Burst" })).toHaveAttribute(
      "href",
      "/en/parts?catalogGeneration=burst",
    );
    expect(screen.getByRole("link", { name: "CX-01" })).toHaveAttribute(
      "href",
      "/en/parts/catalog/x%3Abeyblade%3Acx01",
    );
    expect(screen.getAllByText("Complete Beyblades").length).toBeGreaterThan(0);
    // Both the Part-kind filter and the record card name the kind; without a
    // `partTypeLabelFor` the raw key is what a reader sees.
    expect(screen.getAllByText("main_blade").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Main Blade" })[0]).toHaveAttribute(
      "href",
      "/en/parts/catalog/x%3Apart%3Amain-blade",
    );
  });

  it("narrows the list to one Part kind", () => {
    render(
      <GenerationCatalogBrowser
        locale="en"
        generations={generations}
        systems={systems}
        records={records}
        selectedGeneration="x"
        selectedSystem="cx"
        selectedKind="part"
        selectedPartType="main_blade"
        labels={labels}
      />,
    );

    const grid = screen.getByRole("list", { name: "Parts Catalog" });
    expect(within(grid).getAllByRole("link").map((link) => link.textContent)).toEqual(["Main Blade"]);
  });

  it("searches multilingual aliases across Generations and labels every result kind", () => {
    const crossGenerationRecords = [
      ...records,
      {
        id: "x:beyblade:dran-sword",
        generationId: "x" as const,
        system: "cx",
        kind: "beyblade" as const,
        partType: null,
        name: "Dran Sword",
        aliases: ["ドランソード"],
        components: [],
        sourceId: "fixture-source",
        sourceRecordId: "dran-sword",
        sourceUrl: "https://example.com/dran-sword",
        sourceVersion: "fixture:1",
        verificationStatus: "officially_verified" as const,
        publicationStatus: "accepted" as const,
      },
      {
        id: "burst:beyblade:dran-sword",
        generationId: "burst" as const,
        system: "burst-standard",
        kind: "beyblade" as const,
        partType: null,
        name: "Dran Sword",
        aliases: ["ドランソード"],
        components: [],
        sourceId: "fixture-source",
        sourceRecordId: "burst-dran-sword",
        sourceUrl: "https://example.com/burst-dran-sword",
        sourceVersion: "fixture:1",
        verificationStatus: "officially_verified" as const,
        publicationStatus: "accepted" as const,
      },
    ];

    render(
      <GenerationCatalogBrowser
        locale="ja"
        generations={generations}
        systems={systems}
        records={crossGenerationRecords}
        selectedGeneration="x"
        searchQuery="ドランソード"
        searchAcrossGenerations
        labels={{ ...labels, searchLabel: "Catalog search", searchPlaceholder: "Search catalog" }}
      />,
    );

    expect(screen.getByRole("searchbox", { name: "Catalog search" })).toHaveValue("ドランソード");
    expect(screen.getAllByRole("search").some((form) => form.getAttribute("action") === "/ja/parts")).toBe(true);
    expect(screen.getAllByRole("link", { name: "Dran Sword" })).toHaveLength(2);
    expect(screen.getAllByText("Complete Beyblades").length).toBeGreaterThanOrEqual(2);
    // The kind selection lives in the tab bar, not in the search form.
    expect(screen.getAllByRole("navigation", { name: "Entity type" }).length).toBeGreaterThan(0);
  });

});
