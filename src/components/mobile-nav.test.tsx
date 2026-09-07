import { cleanup, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileNav } from "./mobile-nav.tsx";
import en from "@/messages/en.json";
import ja from "@/messages/ja.json";
import zh from "@/messages/zh-TW.json";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("@/i18n/navigation.ts", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
  usePathname: () => route.pathname,
}));

afterEach(cleanup);

describe("task-oriented mobile navigation", () => {
  it.each([["en", en], ["ja", ja], ["zh-TW", zh]] as const)("shows visible labels in %s", (locale, messages) => {
    route.pathname = "/parts/dran-sword";
    render(<NextIntlClientProvider locale={locale} messages={messages}><MobileNav /></NextIntlClientProvider>);
    const links = within(screen.getByRole("navigation")).getAllByRole("link");
    expect(links.map(link => link.getAttribute("href"))).toEqual(["/parts", "/combo", "/events", "/guides"]);
    for (const link of links) expect(link.textContent?.trim()).toBeTruthy();
    expect(links[0]).toHaveAttribute("aria-current", "page");
    expect(links.filter(link => link.hasAttribute("aria-current"))).toHaveLength(1);
  });
  it.each([["/combo", "/combo"], ["/meta", "/events"], ["/guides/start", "/guides"], ["/parts-other", null]] as const)("marks the appropriate task for %s", (pathname, expected) => {
    route.pathname = pathname;
    render(<NextIntlClientProvider locale="en" messages={en}><MobileNav /></NextIntlClientProvider>);
    const current = screen.getAllByRole("link").filter(link => link.hasAttribute("aria-current"));
    expect(current.map(link => link.getAttribute("href"))).toEqual(expected ? [expected] : []);
  });
});
