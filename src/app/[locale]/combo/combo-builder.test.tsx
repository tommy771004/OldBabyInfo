import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAllParts } from "@/lib/parts/repository.ts";
import { slugify } from "@/lib/parts/slug.ts";
import type { Part } from "@/lib/parts/schema.ts";
import messages from "@/messages/en.json";
import { ComboBuilder } from "./combo-builder.tsx";

vi.mock("@/i18n/navigation.ts", () => ({
  Link: ({ href, children, ...props }: { href: { pathname: string; query: Record<string, string> }; children: React.ReactNode }) => (
    <a href={`${href.pathname}?${new URLSearchParams(href.query)}`} {...props}>{children}</a>
  ),
}));

const allParts = getAllParts();
const blade = allParts.find((part) => part.type === "blade")!;
const ratchet = allParts.find((part) => part.type === "ratchet")!;
const bit = allParts.find((part) => part.type === "bit")!;
const parts = [blade, ratchet, bit];

function builder(selected: Array<Part | undefined>) {
  return <NextIntlClientProvider locale="en" messages={messages}>
    <ComboBuilder blade={selected[0]} ratchet={selected[1]} bit={selected[2]} allParts={parts} locale="en" />
  </NextIntlClientProvider>;
}

describe("ComboBuilder sequential candidates", () => {
  afterEach(cleanup);

  it.each([
    [[], 0],
    [[blade], 1],
    [[blade, ratchet], 2],
    [[undefined, ratchet, bit], 0],
    [[blade, undefined, bit], 1],
  ] as Array<[Array<Part | undefined>, number]>)("expands only the first empty slot in %j", (selected, firstEmpty) => {
    render(builder(selected));
    const list = screen.getByRole("list");
    expect(within(list).getByRole("link", { name: parts[firstEmpty]!.nameEn })).toBeInTheDocument();
    expect(screen.getAllByRole("searchbox")).toHaveLength(3 - selected.filter(Boolean).length);
    expect(screen.getAllByText(messages.ComboBuilderPage.recent_heading)).toHaveLength(1);
    for (const part of selected.filter((part): part is Part => Boolean(part))) {
      expect(screen.getByText(part.nameEn).closest("div[class*='slotFilled']")).toBeInTheDocument();
    }
  });

  it("advances through URL state and clearing preserves the other filled slots", () => {
    const view = render(builder([]));
    expect(screen.getByRole("link", { name: blade.nameEn })).toHaveAttribute("href", `/combo?blade=${slugify(blade.nameEn)}`);
    view.rerender(builder([blade]));
    const next = new URL(screen.getByRole("link", { name: ratchet.nameEn }).getAttribute("href")!, "https://example.com");
    expect(Object.fromEntries(next.searchParams)).toEqual({ blade: slugify(blade.nameEn), ratchet: slugify(ratchet.nameEn) });
    view.rerender(builder(parts));
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    const clear = new URL(screen.getAllByRole("link", { name: messages.ComboBuilderPage.clear })[1]!.getAttribute("href")!, "https://example.com");
    expect(Object.fromEntries(clear.searchParams)).toEqual({ blade: slugify(blade.nameEn), bit: slugify(bit.nameEn) });
    view.rerender(builder([blade, undefined, bit]));
    expect(within(screen.getByRole("list")).getByRole("link", { name: ratchet.nameEn })).toBeInTheDocument();
  });

  it("keeps later inputs usable without expanding a second list", () => {
    const view = render(builder([]));
    fireEvent.change(screen.getByRole("searchbox", { name: messages.ComboBuilderPage.ratchet_slot }), { target: { value: "no-such-ratchet" } });
    expect(screen.getAllByRole("list")).toHaveLength(1);
    expect(screen.queryByText(messages.ComboBuilderPage.no_matches)).not.toBeInTheDocument();
    view.rerender(builder([blade]));
    expect(screen.getByText(messages.ComboBuilderPage.no_matches)).toBeVisible();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
