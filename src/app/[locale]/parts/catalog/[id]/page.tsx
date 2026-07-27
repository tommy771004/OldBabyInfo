import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { CatalogRecordDetails } from "@/components/catalog-record-details.tsx";
import { getGenerationCatalogSnapshot, getLegacyPartForCatalogRecord } from "@/lib/generation-catalog/repository.ts";
import type { GenerationCatalogRecord } from "@/lib/generation-catalog/schema.ts";
import { type Locale } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { Link } from "@/i18n/navigation.ts";
import { slugify } from "@/lib/parts/slug.ts";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function GenerationCatalogRecordPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await requireLocale(params);
  const snapshot = getGenerationCatalogSnapshot();
  let recordId: string;
  try {
    recordId = decodeURIComponent(id);
  } catch {
    notFound();
  }
  const record = snapshot.records.find((candidate) => candidate.id === recordId);
  if (!record) notFound();

  return (
    <GenerationCatalogRecordBody
      locale={locale}
      record={record}
      // Related records only ever come from the same Generation: a Part is
      // never a component of a Beyblade from another one.
      siblings={snapshot.records.filter((candidate) => candidate.generationId === record.generationId)}
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
        <p className={styles.kicker}>{kindLabel}</p>
        <h1>{record.name}</h1>
      </header>

      <CatalogRecordDetails
        record={record}
        allRecords={siblings}
        recordHref={(id) => `${prefix}/parts/catalog/${encodeURIComponent(id)}`}
        legacyPartHref={legacyPart ? `${prefix}/parts/${slugify(legacyPart.nameEn)}` : undefined}
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
