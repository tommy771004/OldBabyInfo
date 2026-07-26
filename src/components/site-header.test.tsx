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

    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    for (const label of ["Parts", "Events", "Discussion", "Sign in", "Terms"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
    const localeSelect = screen.getByRole("combobox", { name: "Language" });
    expect(localeSelect).toBeInTheDocument();

    fireEvent.change(localeSelect, { target: { value: "ja" } });
    expect(replace).toHaveBeenCalledWith("/", { locale: "ja" });
  });
});
