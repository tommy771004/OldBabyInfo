import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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
  // Renders used to pile up in the document between cases, which quietly
  // turned single-element queries into "found multiple" once a case stopped
  // scoping its own markup.
  afterEach(cleanup);

  it.each([
    ["x", false, ["", "cx"]],
    ["burst", false, ["", "burst"]],
    ["x", true, ["", "cx", "burst"]],
  ] as const)("limits System options for %s (across generations: %s)", (generation, across, expected) => {
    render(<GenerationCatalogBrowser
      locale="en"
      generations={generations}
      systems={[...systems, { id: "burst", generationId: "burst", nameEn: "Burst", partTypes: ["layer"], compatibilityRules: [] }]}
      records={records}
      selectedGeneration={generation}
      searchAcrossGenerations={across}
      labels={labels}
    />);

    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/en/parts");
    expect(screen.getByRole("combobox", { name: "Generation" })).toHaveValue(across ? "" : generation);
    const system = screen.getByRole("combobox", { name: "System" });
    expect(within(system).getAllByRole("option").map((option) => (option as HTMLOptionElement).value)).toEqual(expected);
  });

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

describe("GenerationCatalogBrowser pagination", () => {
  afterEach(cleanup);

  const manyParts = Array.from({ length: 23 }, (_, index) => ({
    id: `x:part:blade-${index + 1}`,
    generationId: "x" as const,
    system: "cx",
    kind: "part" as const,
    partType: "main_blade",
    name: `Blade ${String(index + 1).padStart(2, "0")}`,
    aliases: [],
    components: [],
    sourceId: "fixture-source",
    sourceRecordId: `part:blade-${index + 1}`,
    sourceUrl: "https://example.com/catalog",
    sourceVersion: "fixture:1",
    verificationStatus: "officially_verified" as const,
    publicationStatus: "accepted" as const,
  }));
  const paginationLabels = {
    pageSize: "Records per page",
    pageStatus: (page: number, totalPages: number) => `Page ${page} of ${totalPages}`,
    previousPage: "Previous page",
    nextPage: "Next page",
  };
  const hrefFor = (page: number, pageSize: number) => `/en/parts?catalogGeneration=x&catalogPage=${page}&catalogSize=${pageSize}`;

  it("shows one page of records while counting the whole list", () => {
    render(
      <GenerationCatalogBrowser
        locale="en"
        generations={generations}
        systems={systems}
        records={manyParts}
        selectedGeneration="x"
        selectedKind="part"
        recordCountLabel={(count) => `${count} records`}
        pagination={{ page: 2, pageSize: 10 }}
        paginationHrefFor={hrefFor}
        paginationLabels={paginationLabels}
        pageRangeLabel={(start, end) => `showing ${start}–${end}`}
        labels={labels}
      />,
    );

    const grid = screen.getByRole("list", { name: "Parts Catalog" });
    expect(within(grid).getAllByRole("link").map((link) => link.textContent)).toEqual(
      manyParts.slice(10, 20).map((record) => record.name),
    );
    // The lede counts everything the filters admit, not the slice on screen.
    expect(screen.getByText(/23 records/)).toHaveTextContent("showing 11–20");
    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute("href", hrefFor(1, 10));
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute("href", hrefFor(3, 10));
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "10" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "50" })).toHaveAttribute("href", hrefFor(1, 50));
  });

  it("seats the page-size chips with the filters, above the list, and leaves only prev/next below it", () => {
    render(
      <GenerationCatalogBrowser
        locale="en"
        generations={generations}
        systems={systems}
        records={manyParts}
        selectedGeneration="x"
        selectedKind="part"
        pagination={{ page: 1, pageSize: 10 }}
        paginationHrefFor={hrefFor}
        paginationLabels={paginationLabels}
        labels={labels}
      />,
    );

    const sizeRow = screen.getByRole("navigation", { name: "Records per page" });
    const grid = screen.getByRole("list", { name: "Parts Catalog" });
    const pager = screen.getByRole("navigation", { name: "Parts Catalog" });
    // The size row comes before the records; the prev/next pair comes after.
    expect(sizeRow.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(grid.compareDocumentPosition(pager) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // One set of size chips on the page, and it is the one up top.
    expect(within(sizeRow).getAllByRole("link").map((link) => link.textContent)).toEqual(["10", "20", "50"]);
    expect(within(pager).queryByRole("link", { name: "20" })).not.toBeInTheDocument();
    expect(within(pager).getByRole("link", { name: "Next page" })).toHaveAttribute("href", hrefFor(2, 10));
  });

  it("clamps a page past the end and keeps the chosen size in filter links", () => {
    render(
      <GenerationCatalogBrowser
        locale="en"
        generations={generations}
        systems={systems}
        records={manyParts}
        selectedGeneration="x"
        selectedKind="part"
        pagination={{ page: 9, pageSize: 20 }}
        paginationHrefFor={hrefFor}
        paginationLabels={paginationLabels}
        labels={labels}
      />,
    );

    const grid = screen.getByRole("list", { name: "Parts Catalog" });
    expect(within(grid).getAllByRole("link")).toHaveLength(3);
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Next page" })).not.toBeInTheDocument();
    // Changing a filter goes back to page 1 but does not forget the page size.
    expect(screen.getByRole("link", { name: "Beyblade Burst" })).toHaveAttribute(
      "href",
      "/en/parts?catalogGeneration=burst&catalogSize=20",
    );
    expect(screen.getByRole("search").querySelector('input[name="catalogSize"]')).toHaveValue("20");
  });

  it("renders no paging controls when everything fits on the smallest page", () => {
    render(
      <GenerationCatalogBrowser
        locale="en"
        generations={generations}
        systems={systems}
        records={records}
        selectedGeneration="x"
        selectedKind="part"
        pagination={{ page: 1, pageSize: 10 }}
        paginationHrefFor={hrefFor}
        paginationLabels={paginationLabels}
        labels={labels}
      />,
    );

    expect(screen.queryByText("Records per page")).not.toBeInTheDocument();
    expect(screen.queryByText(/Page 1 of 1/)).not.toBeInTheDocument();
  });
});
