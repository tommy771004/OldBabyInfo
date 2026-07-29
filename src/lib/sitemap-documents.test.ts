import { describe, expect, it } from "vitest";
import {
  buildSitemapIndexXml,
  buildUrlSetXml,
  SITEMAP_FILES,
  sitemapEntriesFor,
} from "./sitemap-documents.ts";

describe("sitemap documents", () => {
  it("serves a compact sitemap index that lists every child document", () => {
    const xml = buildSitemapIndexXml();

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain("<sitemapindex");
    for (const file of SITEMAP_FILES) {
      expect(xml).toContain(`/sitemaps/${file}`);
    }
    expect(new TextEncoder().encode(xml).byteLength).toBeLessThan(5_000);
  });

  it("partitions every public URL into valid urlset-shaped XML documents", () => {
    const urls = new Set<string>();
    for (const file of SITEMAP_FILES) {
      const entries = sitemapEntriesFor(file);
      expect(entries).toBeDefined();
      const xml = buildUrlSetXml(entries!);
      expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      expect(new TextEncoder().encode(xml).byteLength).toBeLessThan(5_000_000);
      for (const entry of entries!) {
        expect(urls.has(entry.url)).toBe(false);
        urls.add(entry.url);
        expect(entry.languages).toHaveProperty("x-default");
      }
    }
    expect(urls.size).toBeGreaterThan(6_000);
  });

  it("returns no document for an unknown sitemap name", () => {
    expect(sitemapEntriesFor("unknown.xml")).toBeUndefined();
  });
});
