import type { MetadataRoute } from "next";
import { routing, type Locale } from "@/i18n/routing";
import { getAllGuides } from "@/lib/guides/repository.ts";
import { getAllParts } from "@/lib/parts/repository.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { getAllSourceDocuments } from "@/lib/source-documents/repository.ts";
import { getAllGenerationCatalogRecords } from "@/lib/generation-catalog/repository.ts";
import { localizedUrl } from "@/lib/seo.ts";

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

function languagesFor(pathname: string, locales: readonly Locale[] = routing.locales) {
  const fallback = locales.includes("zh-TW") ? "zh-TW" : locales[0];
  return Object.fromEntries(
    [
      ...locales.map((locale) => [locale, localizedUrl(locale, pathname)] as const),
      ...(fallback ? [["x-default", localizedUrl(fallback, pathname)] as const] : []),
    ],
  );
}

function localizedEntries(pathname: string, locales: readonly Locale[] = routing.locales): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: localizedUrl(locale, pathname),
    alternates: { languages: languagesFor(pathname, locales) },
    changeFrequency: "weekly",
    priority: pathname === "/" ? 1 : 0.8,
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = sharedPaths.flatMap((pathname) => localizedEntries(pathname));

  for (const locale of routing.locales) {
    for (const guide of getAllGuides(locale)) {
      entries.push({
        url: localizedUrl(locale, `/guides/${guide.slug}`),
        alternates: { languages: languagesFor(`/guides/${guide.slug}`, [locale]) },
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  for (const part of getAllParts()) {
    entries.push(...localizedEntries(`/parts/${slugify(part.nameEn)}`));
  }

  for (const document of getAllSourceDocuments()) {
    entries.push(...localizedEntries(`/sources/${document.id}`));
  }

  for (const record of getAllGenerationCatalogRecords()) {
    const pathname = `/parts/catalog/${encodeURIComponent(record.id)}`;
    entries.push(...localizedEntries(pathname));
  }

  return entries;
}
