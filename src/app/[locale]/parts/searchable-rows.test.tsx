import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Part } from "@/lib/parts/schema.ts";
import { SearchableRows } from "./searchable-rows.tsx";

vi.mock("@/i18n/navigation.ts", () => ({
  Link: ({ href, children, ...props }: { href: string | object; children: React.ReactNode }) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>{children}</a>
  ),
}));

const messages = {
  PartsPage: {
    type_blade: "Blade",
    type_ratchet: "Ratchet",
    type_bit: "Bit",
    stat_attack: "Attack",
    stat_defense: "Defense",
    stat_stamina: "Stamina",
    stat_xDash: "X-Dash",
    stat_burstResistance: "Burst",
    release_date: "Release date",
    no_results: "No parts match these filters",
    search_label: "Search parts",
    search_placeholder: "Search by Chinese, Japanese, or English name",
    playstyle_column: "Type",
    silhouette_column: "Silhouette",
    silhouette_label: "{count}-wing silhouette",
    silhouette_unknown_label: "Silhouette not yet available",
    silhouette_ratchet_label: "Height {height} silhouette",
    silhouette_bit_attack: "Attack-type silhouette",
    silhouette_bit_defense: "Defense-type silhouette",
    silhouette_bit_stamina: "Stamina-type silhouette",
    silhouette_bit_balance: "Balance-type silhouette",
  },
};

const parts: Part[] = [
  {
    id: "DRANSWORD",
    type: "blade",
    nameEn: "Dran Sword",
    nameJa: "ドランソード",
    nameZhTw: "蒼龍神劍",
    generation: "X",
    stats: { attack: 60, defense: 30, stamina: 25 },
    modes: [],
    releaseAt: "2023-07-15",
    statEditions: [],
    moldBatches: [],
    aliases: ["劍龍"],
  },
];

function renderRows() {
  return render(
    <NextIntlClientProvider locale="zh-TW" messages={messages}>
      <SearchableRows
        parts={parts}
        locale="zh-TW"
        state={{ type: undefined, sort: undefined, direction: "asc" }}
      />
    </NextIntlClientProvider>,
  );
}

describe("SearchableRows", () => {
  afterEach(cleanup);

  it("shows a matching Part when the player searches by a localized name or alias", () => {
    renderRows();

    const search = screen.getByRole("searchbox", { name: "Search parts" });
    fireEvent.change(search, { target: { value: "劍龍" } });

    expect(screen.getByRole("link", { name: "蒼龍神劍" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").every((header) => header.getAttribute("scope") === "col")).toBe(true);
  });

  it("replaces the table with a visible empty state when there are no matches", () => {
    renderRows();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search parts" }), {
      target: { value: "does-not-exist" },
    });

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("No parts match these filters")).toBeInTheDocument();
  });
});
