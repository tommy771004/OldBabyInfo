import { describe, expect, it } from "vitest";
import { shouldLocalizePath } from "./request-scope.ts";

describe("shouldLocalizePath", () => {
  it("localizes the pages next-intl used to receive", () => {
    expect(shouldLocalizePath("/")).toBe(true);
    expect(shouldLocalizePath("/parts")).toBe(true);
    expect(shouldLocalizePath("/ja/parts/dran-sword")).toBe(true);
  });

  it("keeps next-intl away from API routes and framework internals", () => {
    // A locale rewrite applied to an OAuth callback breaks sign-in.
    expect(shouldLocalizePath("/api/auth/callback/google")).toBe(false);
    expect(shouldLocalizePath("/trpc/anything")).toBe(false);
    expect(shouldLocalizePath("/_next/data/build/index.json")).toBe(false);
    expect(shouldLocalizePath("/_vercel/insights/view")).toBe(false);
  });

  it("keeps next-intl away from anything with a file extension", () => {
    expect(shouldLocalizePath("/sitemap.xml")).toBe(false);
    expect(shouldLocalizePath("/sitemaps/parts-1.xml")).toBe(false);
    expect(shouldLocalizePath("/llms.txt")).toBe(false);
    expect(shouldLocalizePath("/robots.txt")).toBe(false);
  });
});
