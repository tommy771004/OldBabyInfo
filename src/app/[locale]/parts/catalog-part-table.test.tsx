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
    // X-Dash and Burst Resistance exist only on a Bit (ADR-0007).
    expect(within(row!).getAllByText("—")).toHaveLength(2);
  });

  it("keeps a record with no X Stats in the same list instead of hiding it", () => {
    renderTable();

    const row = screen.getByRole("link", { name: "Dran" }).closest("tr");
    expect(within(row!).getByText("Lock Chip")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dran" })).toHaveAttribute(
      "href",
      "/parts/catalog/x%3Apart%3Alock-chip",
    );
    expect(within(row!).getAllByText("—")).toHaveLength(6);
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

  it("shows the empty state instead of a headerless table", () => {
    renderTable({ records: [] });

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("No parts match these filters")).toBeInTheDocument();
  });
});
