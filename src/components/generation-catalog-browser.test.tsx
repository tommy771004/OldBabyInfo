import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GenerationCatalogBrowser } from "./generation-catalog-browser.tsx";

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
  it("distinguishes complete Beyblades from Parts and navigates their composition", () => {
    render(
      <GenerationCatalogBrowser
        locale="en"
        generations={generations}
        systems={systems}
        records={records}
        selectedGeneration="x"
        selectedSystem="cx"
        selectedRecordId="x:beyblade:cx01"
        labels={labels}
      />,
    );

    expect(screen.getByRole("heading", { name: "Parts Catalog" })).toBeInTheDocument();
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
    expect(screen.getByText("main_blade")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Stock composition" })).toBeInTheDocument();
    expect(screen.getByText(/officially_verified/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Releases" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "CX-01 Starter JP" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Main Blade" })[0]).toHaveAttribute(
      "href",
      "/en/parts/catalog/x%3Apart%3Amain-blade",
    );
  });

  it("lets a Part navigate back to the complete Beyblades that contain it", () => {
    render(
      <GenerationCatalogBrowser
        locale="en"
        generations={generations}
        systems={systems}
        records={records}
        selectedGeneration="x"
        selectedSystem="cx"
        selectedKind="part"
        selectedRecordId="x:part:main-blade"
        labels={labels}
      />,
    );

    expect(screen.getByRole("heading", { name: "Contained in complete Beyblades" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "CX-01" }).some((link) =>
      link.getAttribute("href") === "/en/parts/catalog/x%3Abeyblade%3Acx01",
    )).toBe(true);
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
    expect(screen.getAllByRole("combobox", { name: "Entity type" }).length).toBeGreaterThan(0);
  });
});
