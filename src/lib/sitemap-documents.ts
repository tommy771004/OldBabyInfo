import { routing, type Locale } from "@/i18n/routing";
import { getAllGuides } from "@/lib/guides/repository.ts";
import { getAllParts } from "@/lib/parts/repository.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { getAllPublishableGenerationCatalogRecords } from "@/lib/generation-catalog/repository.ts";
import { absoluteUrl, localizedUrl } from "@/lib/seo.ts";
import type { GenerationId } from "@/lib/generation-catalog/schema.ts";

interface SitemapEntry {
  url: string;
  languages: Record<string, string>;
  changeFrequency: "weekly" | "monthly";
  priority: number;
}

const sharedPaths = [
  "/",
  "/parts",
  "/guides",
  "/events",
  "/discussion",
  "/combo",
  "/meta",
  "/mold-batches",
  "/parts/compare",
  "/terms",
] as const;

const generationGroups: Record<string, GenerationId> = {
  "catalog-original.xml": "bakuten_shoot",
  "catalog-metal.xml": "metal_fight",
  "catalog-burst.xml": "burst",
  "catalog-x.xml": "x",
};

export const SITEMAP_FILES = [
  "static.xml",
  "parts.xml",
  ...Object.keys(generationGroups),
] as const;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function languagesFor(pathname: string, locales: readonly Locale[] = routing.locales) {
  const fallback = locales.includes("zh-TW") ? "zh-TW" : locales[0];
  return Object.fromEntries([
    ...locales.map((locale) => [locale, localizedUrl(locale, pathname)] as const),
    ...(fallback ? [["x-default", localizedUrl(fallback, pathname)] as const] : []),
  ]);
}

function localizedEntries(
  pathname: string,
  changeFrequency: SitemapEntry["changeFrequency"] = "weekly",
  priority = pathname === "/" ? 1 : 0.8,
): SitemapEntry[] {
  return routing.locales.map((locale) => ({
    url: localizedUrl(locale, pathname),
    languages: languagesFor(pathname),
    changeFrequency,
    priority,
  }));
}

export function sitemapEntriesFor(file: string): SitemapEntry[] | undefined {
  if (file === "static.xml") {
    const entries = sharedPaths.flatMap((pathname) => localizedEntries(pathname));
    for (const locale of routing.locales) {
      for (const guide of getAllGuides(locale)) {
        const pathname = `/guides/${guide.slug}`;
        entries.push({
          url: localizedUrl(locale, pathname),
          languages: languagesFor(pathname, [locale]),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
    return entries;
  }

  if (file === "parts.xml") {
    return getAllParts().flatMap((part) =>
      localizedEntries(`/parts/${slugify(part.nameEn)}`),
    );
  }

  const generationId = generationGroups[file];
  if (!generationId) return undefined;
  return getAllPublishableGenerationCatalogRecords()
    .filter((record) => record.generationId === generationId)
    .flatMap((record) =>
      localizedEntries(`/parts/catalog/${encodeURIComponent(record.id)}`),
    );
}

export function buildSitemapIndexXml(): string {
  const sitemaps = SITEMAP_FILES.map((file) =>
    `<sitemap><loc>${escapeXml(absoluteUrl(`/sitemaps/${file}`))}</loc></sitemap>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps}</sitemapindex>`;
}

export function buildUrlSetXml(entries: SitemapEntry[]): string {
  const urls = entries.map((entry) => {
    const alternates = Object.entries(entry.languages).map(([language, href]) =>
      `<xhtml:link rel="alternate" hreflang="${escapeXml(language)}" href="${escapeXml(href)}" />`,
    ).join("");
    return `<url><loc>${escapeXml(entry.url)}</loc>${alternates}` +
      `<changefreq>${entry.changeFrequency}</changefreq>` +
      `<priority>${entry.priority}</priority></url>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
    `xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;
}
