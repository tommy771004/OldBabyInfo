import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import zh from "@/messages/zh-TW.json";
import en from "@/messages/en.json";
import ja from "@/messages/ja.json";
import { localizedSeoCopy } from "@/lib/seo.ts";
import MetaStandingPage from "./page.tsx";

vi.mock("@/i18n/require-locale.ts", () => ({ requireLocale: (params: Promise<unknown>) => params }));
vi.mock("@/lib/combo-appearances-repository.ts", () => ({ getComboAppearances: () => [] }));
vi.mock("@/i18n/navigation.ts", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));

describe("Meta Standing copy", () => {
  afterEach(cleanup);

  it.each([["zh-TW", zh], ["en", en], ["ja", ja]] as const)("renders the existing intro and honest empty state in %s", async (locale, messages) => {
    const page = await MetaStandingPage({ params: Promise.resolve({ locale }) });
    render(<NextIntlClientProvider locale={locale} messages={messages}>{page}</NextIntlClientProvider>);
    expect(screen.getByRole("heading", { level: 1, name: messages.MetaStandingPage.title })).toBeVisible();
    expect(screen.getByText(messages.MetaStandingPage.intro)).toBeVisible();
    expect(screen.getByRole("heading", { name: messages.MetaStandingPage.empty_state_heading })).toBeVisible();
    expect(screen.queryByRole("definition")).not.toBeInTheDocument();
  });

  it("uses Meta Standing consistently in Traditional Chinese and the Combo glossary", () => {
    for (const [locale, messages] of [["zh-TW", zh], ["en", en], ["ja", ja]] as const) {
      expect(messages.MetaStandingPage.title).toBe("Meta Standing");
      expect(localizedSeoCopy("meta", locale).title).toContain("Meta Standing");
    }
    const context = readFileSync("CONTEXT.md", "utf8");
    const combo = context.split("**Combo**：")[1]!.split("**Deck**：")[0]!;
    expect(combo).toContain("Meta Standing");
    expect(combo).not.toContain("勝率統計");
  });
});
