import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider, useLocale } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import zh from "@/messages/zh-TW.json";
import en from "@/messages/en.json";
import ja from "@/messages/ja.json";
import { localizedPath } from "@/lib/seo.ts";
import type { Locale } from "@/i18n/routing.ts";
import NotFound from "./not-found.tsx";
import UnmatchedPage from "./[...rest]/page.tsx";

vi.mock("@/i18n/require-locale.ts", () => ({ requireLocale: (params: Promise<unknown>) => params }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_HTTP_ERROR_FALLBACK;404"); } }));
vi.mock("@/i18n/navigation.ts", () => ({
  Link: function Link({ href, children, ...props }: { href: string; children: React.ReactNode }) {
    const locale = useLocale() as Locale;
    return <a {...props} href={localizedPath(locale, href)}>{children}</a>;
  },
}));

describe("localized not-found", () => {
  afterEach(cleanup);

  it.each([["zh-TW", zh, "/"], ["en", en, "/en"], ["ja", ja, "/ja"]] as const)("uses %s copy and a locale-preserving recovery link", (locale, messages, home) => {
    render(<NextIntlClientProvider locale={locale} messages={messages}><NotFound /></NextIntlClientProvider>);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: messages.NotFoundPage.title })).toBeVisible();
    expect(screen.getByText(messages.NotFoundPage.description)).toBeVisible();
    expect(screen.getByRole("link", { name: messages.NotFoundPage.home })).toHaveAttribute("href", home);
  });

  it("sends unmatched public paths to the locale not-found boundary", async () => {
    await expect(UnmatchedPage({ params: Promise.resolve({ locale: "zh-TW", rest: ["missing", "page"] }) }))
      .rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
