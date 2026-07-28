import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { CatalogRecordDetails } from "@/components/catalog-record-details.tsx";
import {
  getAllPublishableGenerationCatalogRecords,
  getLegacyPartForCatalogRecord,
} from "@/lib/generation-catalog/repository.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import type { GenerationCatalogRecord } from "@/lib/generation-catalog/schema.ts";
import { routing, type Locale } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { Link } from "@/i18n/navigation.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { getAllParts } from "@/lib/parts/repository.ts";
import {
  beybladeImagePartOf,
  buildPartNameIndex,
  composeBeybladeName,
  composeBeybladeStats,
  composeBeybladeWeight,
  productCodeOf,
} from "@/lib/generation-catalog/beyblade-name.ts";
import { getPartImage } from "@/lib/parts/repository.ts";
import Image from "next/image";
import { pageMetadata } from "@/lib/seo.ts";
import { CatalogStats } from "@/components/catalog-stats.tsx";
import styles from "./page.module.css";

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

function GenerationCatalogRecordBody({
  locale,
  record,
  siblings,
}: {
  locale: Locale;
  record: GenerationCatalogRecord;
  siblings: GenerationCatalogRecord[];
}) {
  const t = useTranslations("PartsPage");
  const legacyPart = getLegacyPartForCatalogRecord(record.id);
  const prefix = locale === "zh-TW" ? "" : `/${encodeURIComponent(locale)}`;
  // A complete Beyblade's model string is unreadable on its own; the name
  // built from its Parts is what a player would actually say out loud.
  const partNameIndex = buildPartNameIndex(getAllParts());
  const composedName = composeBeybladeName(record, partNameIndex, locale);
  const comboStats = composeBeybladeStats(record, partNameIndex);
  const comboWeight = composeBeybladeWeight(record, partNameIndex);
  // Related rows read in the same language as the heading above them.
  const recordNameFor = (related: GenerationCatalogRecord) => {
    const projected = getLegacyPartForCatalogRecord(related.id);
    if (projected) return localizedNameOf(projected, locale);
    return composeBeybladeName(related, partNameIndex, locale) ?? related.name;
  };
  const productCode = productCodeOf(record);
  const imagePart = beybladeImagePartOf(record, partNameIndex);
  const image = imagePart ? getPartImage(imagePart.id) : undefined;
  const kindLabel = record.kind === "beyblade"
    ? t("catalog_beyblades")
    : record.kind === "part"
      ? t("catalog_parts")
      : record.kind === "release"
        ? t("catalog_release")
        : t("catalog_equipment");

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label={t("title")}>
        <Link href="/parts">{t("title")}</Link>
      </nav>

      <header className={styles.header}>
        <p className={styles.kicker}>
          {productCode ? <span className={styles.code}>{productCode}</span> : null}
          {kindLabel}
        </p>
        <h1>{composedName ?? record.name}</h1>
        {composedName ? <p className={styles.modelName}>{record.name}</p> : null}
      </header>

      {image && imagePart ? (
        <figure className={styles.figure}>
          <Image
            src={image.url}
            alt={localizedNameOf(imagePart, locale)}
            width={image.width}
            height={image.height}
            sizes="(max-width: 640px) 60vw, 20rem"
          />
          <figcaption>{t("beyblade_image_caption", { part: localizedNameOf(imagePart, locale) })}</figcaption>
        </figure>
      ) : null}

      {record.kind === "beyblade" ? (
        <CatalogStats
          stats={comboStats}
          weightGrams={comboWeight}
          labels={{
            heading: t("catalog_stats"),
            attack: t("stat_attack"),
            defense: t("stat_defense"),
            stamina: t("stat_stamina"),
            xDash: t("stat_xDash"),
            burstResistance: t("stat_burstResistance"),
            weight: t("weight_column"),
            note: t("catalog_stats_note"),
            unavailable: t("catalog_stats_unavailable"),
          }}
        />
      ) : null}

      <CatalogRecordDetails
        record={record}
        allRecords={siblings}
        recordHref={(id) => `${prefix}/parts/catalog/${encodeURIComponent(id)}`}
        recordNameFor={recordNameFor}
        legacyPartHref={legacyPart ? `${prefix}/parts/${slugify(legacyPart.nameEn)}` : undefined}
        showRelated={false}
        labels={{
          kind: t("part_type_column"),
          systemLabel: t("catalog_system"),
          provenanceHeading: t("catalog_provenance"),
          compositionHeading: t("catalog_composition"),
          containedByHeading: t("catalog_contained_by"),
          releasesHeading: t("catalog_releases"),
          releaseContentsHeading: t("catalog_release_contents"),
          legacyPartLabel: t("catalog_legacy_part"),
          emptyComposition: t("catalog_composition_unknown"),
        }}
      />
    </main>
  );
}
