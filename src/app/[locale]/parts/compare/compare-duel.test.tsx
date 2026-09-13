import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnchorHTMLAttributes } from "react";
import type { Part } from "@/lib/parts/schema.ts";
import messages from "@/messages/en.json";
import { CompareTable } from "./compare-table.tsx";
import { CompareDuel } from "./compare-duel.tsx";

vi.mock("@/i18n/navigation.ts", () => ({
  Link: ({ href, scroll: _scroll, ...props }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string | { pathname: string; query: Record<string, string> }; scroll?: boolean;
  }) => { void _scroll; return <a {...props} href={typeof href === "string" ? href : `${href.pathname}?${new URLSearchParams(href.query)}`} />; },
}));

const left = { id: "DRANSWORD", nameEn: "Dran Sword", type: "blade", generation: "X", aliases: [],
  stats: { attack: 60, defense: 30, stamina: 40 }, releaseAt: null } as unknown as Part;
const right = { ...left, id: "HELLSSCYTHE", nameEn: "Hells Scythe", stats: { attack: 45, defense: 55, stamina: 60 } } as Part;
const replacement = { ...left, id: "REPLACEMENT", nameEn: "Replacement", stats: { ...left.stats, attack: 75 } } as Part;

function view(parts: Part[]) {
  return <NextIntlClientProvider locale="en" messages={messages}>
    {parts.length === 2
      ? <CompareDuel parts={parts as [Part, Part]} allParts={[left, right, replacement]} locale="en" />
      : <CompareTable parts={parts} allParts={[left, right, replacement]} locale="en" images={{}} />}
  </NextIntlClientProvider>;
}

describe("two-Part compare interaction", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("keeps names, values and one shared center per Stat visible with no initial current", () => {
    const { container } = render(view([left, right]));
    expect(screen.getByRole("heading", { name: "Dran Sword" })).toBeVisible();
    expect(screen.getByLabelText("Dran Sword: 60")).toBeVisible();
    expect(container.querySelectorAll("[data-stat] svg")).toHaveLength(5);
    expect(container.querySelector('[data-stat="attack"]')).toHaveAttribute("data-lead", "left");
    expect(container.querySelector('[data-stat="defense"]')).toHaveAttribute("data-lead", "right");
    expect(container.querySelectorAll('[data-current="true"]')).toHaveLength(0);
    expect(container.querySelector('[data-stat="xDash"]')).toHaveTextContent("Unavailable");
  });

  it("conducts current only on changed rows, once, and never for an identity-only replacement", () => {
    const { container, rerender } = render(view([left, right]));
    rerender(view([replacement, right]));
    const pulses = container.querySelectorAll('[data-current="true"]');
    expect(pulses).toHaveLength(1);
    expect(pulses[0]?.closest("[data-stat]")).toHaveAttribute("data-stat", "attack");
    fireEvent.animationEnd(pulses[0]!);
    expect(container.querySelectorAll('[data-current="true"]')).toHaveLength(0);
    rerender(view([{ ...replacement, id: "SAME_STATS", nameEn: "Same Stats" }, right]));
    expect(container.querySelectorAll('[data-current="true"]')).toHaveLength(0);
  });

  it("provides keyboard-native replacement links that preserve the other side and shareable query", () => {
    render(view([left, right]));
    const input = screen.getByRole("searchbox", { name: "Replace part · Left", hidden: true });
    const details = input.closest("details")!;
    details.open = true;
    fireEvent.change(input, { target: { value: "Replacement" } });
    expect(screen.getByRole("link", { name: "Replacement" })).toHaveAttribute("href", "/parts/compare?with=replacement%2Chells-scythe");
    expect(screen.getByRole("link", { name: "Remove Dran Sword" })).toHaveAttribute("href", "/parts/compare?with=hells-scythe");
  });

  it("renders the static analysis and no playback control when reduced motion is requested", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const request = vi.fn();
    vi.stubGlobal("requestAnimationFrame", request);
    render(view([left, right]));
    expect(screen.getByRole("img", { name: /Static trajectory diagram/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Play battle" })).not.toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });

  it("only schedules frames after Play, cancels on Pause and resets after replacement", () => {
    let callback: FrameRequestCallback | undefined;
    const request = vi.fn((next: FrameRequestCallback) => { callback = next; return 1; });
    const cancel = vi.fn();
    vi.stubGlobal("requestAnimationFrame", request);
    vi.stubGlobal("cancelAnimationFrame", cancel);
    const { rerender } = render(view([left, right]));
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Play battle" }));
    act(() => { callback?.(0); callback?.(1000); });
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(cancel).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Play battle" }));
    rerender(view([replacement, right]));
    expect(screen.getByRole("button", { name: "Play battle" })).toBeVisible();
  });

  it("shows unavailable rather than invented trajectories and preserves one/three-Part comparison", () => {
    const missing = { ...left, stats: { attack: 60, defense: 30 } } as Part;
    const { rerender } = render(view([missing, right]));
    expect(screen.getByText("Insufficient data for battle trajectories.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Play battle" })).not.toBeInTheDocument();
    rerender(view([left]));
    expect(screen.getByRole("table")).toBeVisible();
    rerender(view([left, right, replacement]));
    expect(screen.getByRole("table")).toBeVisible();
  });
});
