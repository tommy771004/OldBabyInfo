import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CatalogRecordDetails } from "./catalog-record-details.tsx";
import type { GenerationCatalogRecord } from "@/lib/generation-catalog/schema.ts";

function record(overrides: Partial<GenerationCatalogRecord> & { id: string }): GenerationCatalogRecord {
  return {
    generationId: "x",
    system: "cx",
    kind: "part",
    partType: "main_blade",
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

const mainBlade = record({ id: "x:part:main-blade", name: "Main Blade" });
const beyblade = record({
  id: "x:beyblade:cx01",
  kind: "beyblade",
  partType: null,
  name: "CX-01",
  components: [{ recordId: "x:part:main-blade", partType: "main_blade", name: "Main Blade" }],
});
const release = record({
  id: "x:release:cx01",
  kind: "release",
  partType: null,
  name: "CX-01 Starter JP",
  releaseOf: "x:beyblade:cx01",
  containsRecordIds: ["x:beyblade:cx01", "x:part:main-blade"],
  sku: "CX-01",
  region: "JP",
  comboEligible: false,
});
const all = [mainBlade, beyblade, release];

const labels = {
  kind: "Kind",
  systemLabel: "System",
  provenanceHeading: "Source",
  compositionHeading: "Stock composition",
  containedByHeading: "Contained in complete Beyblades",
  releasesHeading: "Releases",
  releaseContentsHeading: "Release contents",
  legacyPartLabel: "Open legacy part page",
  emptyComposition: "The source does not record which Parts this is built from.",
};

function renderDetails(overrides: Partial<Parameters<typeof CatalogRecordDetails>[0]> = {}) {
  return render(
    <CatalogRecordDetails
      record={beyblade}
      allRecords={all}
      recordHref={(id) => `/en/parts/catalog/${encodeURIComponent(id)}`}
      labels={labels}
      {...overrides}
    />,
  );
}

describe("CatalogRecordDetails", () => {
  afterEach(cleanup);

  it("shows a complete Beyblade's composition, each Part linked onward", () => {
    renderDetails();

    const composition = screen.getByRole("region", { name: "Stock composition" });
    expect(within(composition).getByRole("link", { name: "Main Blade" })).toHaveAttribute(
      "href",
      "/en/parts/catalog/x%3Apart%3Amain-blade",
    );
  });

  it("lets a Part navigate back to the complete Beyblades that contain it", () => {
    renderDetails({ record: mainBlade });

    const containedBy = screen.getByRole("region", { name: "Contained in complete Beyblades" });
    expect(within(containedBy).getByRole("link", { name: "CX-01" })).toHaveAttribute(
      "href",
      "/en/parts/catalog/x%3Abeyblade%3Acx01",
    );
  });

  it("names where the claim came from", () => {
    renderDetails();

    expect(screen.getByText(/officially_verified/)).toBeInTheDocument();
    expect(screen.getByText(/fixture-source/)).toBeInTheDocument();
  });

  it("links an X Part to the legacy part page when a crosswalk match exists", () => {
    renderDetails({ record: mainBlade, legacyPartHref: "/en/parts/dran-sword" });

    expect(screen.getByRole("link", { name: "Open legacy part page" })).toHaveAttribute(
      "href",
      "/en/parts/dran-sword",
    );
  });

  it("lists what a Release contains", () => {
    renderDetails({ record: release });

    const contents = screen.getByRole("region", { name: "Release contents" });
    expect(within(contents).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "CX-01",
      "CX-01",
      "Main Blade",
    ]);
  });

  it("says so when the source never recorded a composition", () => {
    renderDetails({ record: record({ id: "x:beyblade:bare", kind: "beyblade", partType: null, name: "Bare" }) });

    expect(screen.getByText(labels.emptyComposition)).toBeInTheDocument();
  });

  it("matches a component written the way the app writes it, not the catalogue name", () => {
    // The composition says "DRANSWORD"; the Part record is "Dran Sword".
    const dranSword = record({ id: "x:part:dran-sword", partType: "blade", name: "Dran Sword", aliases: ["DrSw"] });
    const flat = record({ id: "x:part:flat", partType: "bit", name: "Flat", aliases: ["F"] });
    const bx01 = record({
      id: "x:beyblade:bx01",
      kind: "beyblade",
      partType: null,
      name: "DRANSWORD3-60F",
      components: [
        { partType: "blade", name: "DRANSWORD" },
        { partType: "bit", name: "F" },
      ],
    });
    renderDetails({ record: bx01, allRecords: [dranSword, flat, bx01] });

    const composition = screen.getByRole("region", { name: "Stock composition" });
    expect(within(composition).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Dran Sword",
      "Flat",
    ]);
  });
});
