import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { GenerationCatalogBrowser } from "@/components/generation-catalog-browser.tsx";
import {
  getGenerationCatalogSnapshot,
  getLegacyPartForCatalogRecord,
} from "@/lib/generation-catalog/repository.ts";
import type { GenerationId } from "@/lib/generation-catalog/schema.ts";
import { selectCatalogRecordsForPage } from "@/lib/generation-catalog/payload.ts";
import { type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation.ts";
import { slugify } from "@/lib/parts/slug.ts";
import styles from "../../page.module.css";

export const dynamic = "force-dynamic";

export default async function GenerationCatalogRecordPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = (await params) as { locale: Locale; id: string };
  setRequestLocale(locale);
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
      snapshot={snapshot}
      recordId={record.id}
      generationId={record.generationId}
      system={record.system}
      name={record.name}
    />
  );
}

function GenerationCatalogRecordBody({
  locale,
  snapshot,
  recordId,
  generationId,
  system,
  name,
}: {
  locale: Locale;
  snapshot: ReturnType<typeof getGenerationCatalogSnapshot>;
  recordId: string;
  generationId: GenerationId;
  system: string;
  name: string;
}) {
  const t = useTranslations("PartsPage");
  const legacyPart = getLegacyPartForCatalogRecord(recordId);
  const localePrefix = locale === "zh-TW" ? "" : `/${encodeURIComponent(locale)}`;

  return (
    <main className={styles.page}>
      <p><Link href="/parts">{t("title")}</Link></p>
      <h1>{name}</h1>
      <GenerationCatalogBrowser
        locale={locale}
        generations={snapshot.generations}
        systems={snapshot.systems}
        records={selectCatalogRecordsForPage(snapshot.records, generationId, false)}
        selectedGeneration={generationId}
        selectedSystem={system}
        selectedRecordId={recordId}
        legacyPartHrefForRecord={() => legacyPart ? `${localePrefix}/parts/${slugify(legacyPart.nameEn)}` : undefined}
        labels={{
          heading: t("catalog_heading"),
          generationLabel: t("catalog_generation"),
          systemLabel: t("catalog_system"),
          kindLabel: t("catalog_kind"),
          allLabel: t("catalog_all"),
          beybladeLabel: t("catalog_beyblades"),
          partLabel: t("catalog_parts"),
          compositionHeading: t("catalog_composition"),
          containedByHeading: t("catalog_contained_by"),
          releasesHeading: t("catalog_releases"),
          releaseContentsHeading: t("catalog_release_contents"),
          releaseLabel: t("catalog_release"),
          equipmentLabel: t("catalog_equipment"),
          legacyPartLabel: t("catalog_legacy_part"),
        }}
      />
    </main>
  );
}
