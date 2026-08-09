import { describe, expect, it } from "vitest";
import { isScrapeTrap, rulesFor, trafficClassFor, withoutLocalePrefix } from "./traffic-policy.ts";

describe("trafficClassFor", () => {
  it("classifies the data pages a bulk extractor has to walk", () => {
    expect(trafficClassFor("/parts")).toBe("catalog");
    expect(trafficClassFor("/parts/dran-sword")).toBe("catalog");
    expect(trafficClassFor("/parts/catalog/bx-01")).toBe("catalog");
    expect(trafficClassFor("/meta")).toBe("catalog");
    expect(trafficClassFor("/events")).toBe("catalog");
    expect(trafficClassFor("/mold-batches")).toBe("catalog");
  });

  it("classifies localized paths the same as the default locale", () => {
    expect(trafficClassFor("/ja/parts/dran-sword")).toBe("catalog");
    expect(trafficClassFor("/en/meta")).toBe("catalog");
    expect(withoutLocalePrefix("/ja")).toBe("/");
    expect(withoutLocalePrefix("/en/parts")).toBe("/parts");
    // A Part whose slug merely starts with a locale name is not a locale.
    expect(withoutLocalePrefix("/english-only")).toBe("/english-only");
  });

  it("separates the crawl map and the auth endpoints", () => {
    expect(trafficClassFor("/sitemap.xml")).toBe("bulk-index");
    expect(trafficClassFor("/sitemaps/parts-1.xml")).toBe("bulk-index");
    expect(trafficClassFor("/llms.txt")).toBe("bulk-index");
    expect(trafficClassFor("/robots.txt")).toBe("bulk-index");
    expect(trafficClassFor("/api/auth/callback/line")).toBe("auth");
  });

  it("falls back to the default class", () => {
    expect(trafficClassFor("/")).toBe("default");
    expect(trafficClassFor("/login")).toBe("default");
  });
});

describe("rulesFor", () => {
  it("gives declared crawlers headroom to index the whole catalog", () => {
    const crawler = rulesFor("catalog", "search-crawler");
    const browser = rulesFor("catalog", "browser");
    expect(crawler[0]!.limit).toBeGreaterThan(browser[0]!.limit);
  });

  it("still bounds a declared crawler, because the header is forgeable", () => {
    for (const rule of rulesFor("catalog", "search-crawler")) {
      expect(Number.isFinite(rule.limit)).toBe(true);
    }
  });

  it("tightens unidentified clients without ever reaching zero", () => {
    const unidentified = rulesFor("bulk-index", "unidentified");
    const browser = rulesFor("bulk-index", "browser");
    expect(unidentified[0]!.limit).toBeLessThan(browser[0]!.limit);
    expect(unidentified.every((rule) => rule.limit >= 5)).toBe(true);
  });

  it("keeps a normal browsing burst inside the per-minute budget", () => {
    // Next prefetches sibling routes as a page hydrates; a real visit is tens
    // of requests a minute, not hundreds.
    expect(rulesFor("catalog", "browser")[0]!.limit).toBeGreaterThanOrEqual(60);
  });
});

describe("isScrapeTrap", () => {
  it("matches the disallowed path, its locale variants and a trailing slash", () => {
    expect(isScrapeTrap("/internal/parts-export")).toBe(true);
    expect(isScrapeTrap("/internal/parts-export/")).toBe(true);
    expect(isScrapeTrap("/ja/internal/parts-export")).toBe(true);
  });

  it("does not match real pages", () => {
    expect(isScrapeTrap("/parts")).toBe(false);
    expect(isScrapeTrap("/internal")).toBe(false);
  });
});
