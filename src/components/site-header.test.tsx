import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "./site-header.tsx";

const replace = vi.hoisted(() => vi.fn());

vi.mock("@/i18n/navigation.ts", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  usePathname: () => "/",
  useRouter: () => ({ replace }),
}));

const messages = {
  HomePage: {
    nav_label: "Main navigation",
    mobile_parts: "Catalog",
    mobile_combo: "Combo",
    mobile_events: "Events",
    mobile_guides: "Guides",
    nav_home: "Home",
    nav_parts: "Parts",
    nav_events: "Events",
    nav_discussion: "Discussion",
    nav_login: "Sign in",
    nav_terms: "Terms",
  },
  LocaleSwitcher: {
    label: "Language",
    "zh-TW": "繁體中文",
    ja: "日本語",
    en: "English",
  },
};

describe("SiteHeader", () => {
  it("exposes every primary public route and a labelled locale control", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SiteHeader />
      </NextIntlClientProvider>,
    );

    // Both the wide text row and the phone icon bar are in the markup; CSS
    // shows exactly one per viewport, which also removes the other from the
    // accessibility tree. jsdom applies no CSS, so both are visible here.
    const navs = screen.getAllByRole("navigation", { name: "Main navigation" });
    expect(navs).toHaveLength(2);

    for (const label of ["Catalog", "Combo", "Guides", "Events", "Discussion", "Terms"]) {
      // Wide navigation and its mobile counterpart retain reachable links.
      expect(screen.getAllByRole("link", { name: label })).toHaveLength(2);
    }
    // The wordmark now links home at every viewport.
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link", { name: "Sign in" })).toHaveLength(2);

    const localeSelect = screen.getByRole("combobox", { name: "Language" });
    expect(localeSelect).toBeInTheDocument();

    fireEvent.change(localeSelect, { target: { value: "ja" } });
    expect(replace).toHaveBeenCalledWith("/", { locale: "ja" });
  });
});
