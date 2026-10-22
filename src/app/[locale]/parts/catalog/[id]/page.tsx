import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPublishableGenerationCatalogRecords } from "@/lib/generation-catalog/repository.ts";
import { routing } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { pageMetadata } from "@/lib/seo.ts";
import { GenerationCatalogRecordBody } from "./record-body.tsx";

/**
 * Only the default locale is prerendered (ADR-0015). ja and en Catalog pages
 * render on their first request and are cached from then on, so a deployment
 * carries ~2,100 of these pages instead of ~6,400. Unknown ids still 404 —
 * through `notFound()` below rather than through `dynamicParams = false`.
 */
export const dynamicParams = true;

export function generateStaticParams() {
  return getAllPublishableGenerationCatalogRecords().map((record) => ({
    locale: routing.defaultLocale,
    id: record.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await requireLocale(params);
  let recordId: string;
  try {
    recordId = decodeURIComponent(id);
  } catch {
    return {};
  }
  const record = getAllPublishableGenerationCatalogRecords().find((candidate) => candidate.id === recordId);
  if (!record) return {};
  return pageMetadata({
    locale,
    pathname: `/parts/catalog/${encodeURIComponent(record.id)}`,
    title: record.name,
    description: `${record.name} — ${record.generationId} ${record.system} catalog record on OldBabyInfo.`,
  });
}

export default async function GenerationCatalogRecordPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await requireLocale(params);
  const records = getAllPublishableGenerationCatalogRecords();
  let recordId: string;
  try {
    recordId = decodeURIComponent(id);
  } catch {
    notFound();
  }
  const record = records.find((candidate) => candidate.id === recordId);
  if (!record) notFound();

  return (
    <GenerationCatalogRecordBody
      locale={locale}
      record={record}
      // Related records only ever come from the same Generation: a Part is
      // never a component of a Beyblade from another one.
      siblings={records.filter((candidate) => candidate.generationId === record.generationId)}
    />
  );
}
