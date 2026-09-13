import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPublishableGenerationCatalogRecords } from "@/lib/generation-catalog/repository.ts";
import { routing } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { pageMetadata } from "@/lib/seo.ts";
import { GenerationCatalogRecordBody } from "./record-body.tsx";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllPublishableGenerationCatalogRecords().map((record) => ({
      locale,
      id: record.id,
    })),
  );
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
