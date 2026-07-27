import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GenerationCatalogRecord } from "@/lib/generation-catalog/schema.ts";
import type { Part } from "@/lib/parts/schema.ts";
import { CatalogPartTable } from "./catalog-part-table.tsx";

vi.mock("@/i18n/navigation.ts", () => ({
  Link: ({ href, children, ...props }: { href: string | { query?: Record<string, string> }; children: React.ReactNode }) => (
    <a
      href={typeof href === "string"
        ? href
        : `/parts?${new URLSearchParams(href.query ?? {}).toString()}`}
      {...props}
    >
      {children}
    </a>
  ),
}));

const labels = {
  partTypeColumn: "Kind",
  nameColumn: "Name",
  attack: "Attack",
  defense: "Defense",
  stamina: "Stamina",
  xDash: "X-Dash",
  burstResistance: "Burst",
  weight: "Weight",
  weightNote: "Weight is the measured range across community-recorded mold batches.",
  releaseDate: "Release date",
  empty: "No parts match these filters",
};

function record(overrides: Partial<GenerationCatalogRecord> & { id: string }): GenerationCatalogRecord {
  return {
    generationId: "x",
    system: "bx",
    kind: "part",
    partType: "blade",
    name: overrides.id,
    aliases: [],
    components: [],
    sourceId: "fixture",
    sourceRecordId: overrides.id,
    sourceUrl: "https://example.com/catalog",
    sourceVersion: "fixture:1",
    verificationStatus: "officially_verified",
    publicationStatus: "accepted",
    ...overrides,
  };
}

const dranSword: Part = {
  id: "DRANSWORD",
  type: "blade",
  nameEn: "Dran Sword",
  nameJa: "ドランソード",
  nameZhTw: "蒼龍神劍",
  generation: "X",
  stats: { attack: 60, defense: 30, stamina: 25 },
  modes: [],
  releaseAt: "2022-05-10",
  statEditions: [],
  moldBatches: [],
  aliases: ["DrSw"],
};

const records = [
  record({ id: "x:part:dran-sword", name: "Dran Sword" }),
  record({ id: "x:part:lock-chip", partType: "lock_chip", name: "Dran" }),
];

function renderTable(overrides: Partial<Parameters<typeof CatalogPartTable>[0]> = {}) {
  return render(
    <CatalogPartTable
      records={records}
      projectionFor={(recordId) => recordId === "x:part:dran-sword" ? dranSword : undefined}
      locale="zh-TW"
      sortField={undefined}
      sortDirection="asc"
      sortQueryFor={(field, direction) => ({ sort: field, dir: direction })}
      partTypeLabelFor={(partType) => partType === "lock_chip" ? "Lock Chip" : "Blade"}
      labels={labels}
      {...overrides}
    />,
  );
}

describe("CatalogPartTable", () => {
  afterEach(cleanup);

  it("shows the X Stats and the localized name for a Catalog record that has a projection", () => {
    renderTable();

    const row = screen.getByRole("link", { name: "蒼龍神劍" }).closest("tr");
    expect(row).not.toBeNull();
    expect(screen.getByRole("link", { name: "蒼龍神劍" })).toHaveAttribute("href", "/parts/dran-sword");
    expect(within(row!).getByText("60")).toBeInTheDocument();
    expect(within(row!).getByText("2022-05-10")).toBeInTheDocument();
    // X-Dash, Burst Resistance (Bit-only, ADR-0007) and an unweighed Part.
    expect(within(row!).getAllByText("—")).toHaveLength(3);
  });

  it("keeps a record with no X Stats in the same list instead of hiding it", () => {
    renderTable();

    const row = screen.getByRole("link", { name: "Dran" }).closest("tr");
    expect(within(row!).getByText("Lock Chip")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dran" })).toHaveAttribute(
      "href",
      "/parts/catalog/x%3Apart%3Alock-chip",
    );
    expect(within(row!).getAllByText("—")).toHaveLength(7);
  });

  it("flips the sort direction on the column that is already sorted", () => {
    renderTable({ sortField: "attack", sortDirection: "asc" });

    const attack = screen.getByRole("link", { name: /Attack/ });
    expect(attack).toHaveAttribute("aria-current", "true");
    expect(attack).toHaveAttribute("href", "/parts?sort=attack&dir=desc");
    expect(screen.getByRole("link", { name: /Defense/ })).toHaveAttribute(
      "href",
      "/parts?sort=defense&dir=asc",
    );
  });

  it("shows the weighed range for a Part with recorded mold batches", () => {
    const weighed: Part = {
      ...dranSword,
      moldBatches: [
        {
          batchCode: "A",
          note: "early run",
          sourceUrl: "https://example.com/a",
          weightGrams: { min: 34.2, max: 34.6 },
        },
        {
          batchCode: "B",
          note: "later run",
          sourceUrl: "https://example.com/b",
          weightGrams: { min: 34.4, max: 35.1 },
        },
      ],
    };
    renderTable({ projectionFor: () => weighed });

    // One range across every weighed batch, not one figure per batch.
    expect(screen.getAllByText("34.2–35.1 g").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Weight/ })).toHaveAttribute(
      "href",
      "/parts?sort=weight&dir=asc",
    );
  });

  it("says where the weight came from, since it is not an official spec", () => {
    renderTable();

    expect(screen.getByText(/community-recorded mold batches/)).toBeInTheDocument();
  });

  it("shows the empty state instead of a headerless table", () => {
    renderTable({ records: [] });

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("No parts match these filters")).toBeInTheDocument();
  });
});
