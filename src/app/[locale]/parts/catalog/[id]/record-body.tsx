import { useTranslations } from "next-intl";
import Image from "next/image";
import { CatalogRecordDetails } from "@/components/catalog-record-details.tsx";
import { getLegacyPartForCatalogRecord } from "@/lib/generation-catalog/repository.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import type { GenerationCatalogRecord } from "@/lib/generation-catalog/schema.ts";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { getAllParts, getPartImage } from "@/lib/parts/repository.ts";
import {
  beybladeImagePartOf,
  buildPartNameIndex,
  composeBeybladeName,
  composeBeybladeStats,
  composeBeybladeWeight,
  productCodeOf,
} from "@/lib/generation-catalog/beyblade-name.ts";
import { CatalogStats } from "@/components/catalog-stats.tsx";
import styles from "./page.module.css";

/**
 * One Catalog record, as the page and as the catalog dialog. Everything here
 * is static JSON, so the dialog shows the whole record; `variant="dialog"`
 * only drops the breadcrumb (the list is still visible behind it) and
 * demotes the name to an <h2> so the list's own <h1> stays the page's one.
 */
export function GenerationCatalogRecordBody({
  locale,
  record,
  siblings,
  variant = "page",
  headingId = "catalog-record-heading",
}: {
  locale: Locale;
  record: GenerationCatalogRecord;
  siblings: GenerationCatalogRecord[];
  variant?: "page" | "dialog";
  headingId?: string;
}) {
  const t = useTranslations("PartsPage");
  const legacyPart = getLegacyPartForCatalogRecord(record.id);
  const prefix = locale === "zh-TW" ? "" : `/${encodeURIComponent(locale)}`;
  // A complete Beyblade's model string is unreadable on its own; the name
  // built from its Parts is what a player would actually say out loud.
  const partNameIndex = buildPartNameIndex(getAllParts());
  const composedName = composeBeybladeName(record, partNameIndex, locale)
    // A Part record's own name is the catalogue's English one; the reader's
    // language, where a projection exists, is the same rule the list uses.
    ?? (legacyPart ? localizedNameOf(legacyPart, locale) : undefined);
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

  const inDialog = variant === "dialog";
  const Root = inDialog ? "div" : "main";

  return (
    <Root className={inDialog ? styles.dialogVariant : styles.page}>
      {inDialog ? null : (
        <nav className={styles.breadcrumb} aria-label={t("title")}>
          <Link href="/parts">{t("title")}</Link>
        </nav>
      )}

      <header className={styles.header}>
        <p className={styles.kicker}>
          {productCode ? <span className={styles.code}>{productCode}</span> : null}
          {kindLabel}
        </p>
        {inDialog
          ? <h2 id={headingId} className={styles.name}>{composedName ?? record.name}</h2>
          : <h1 id={headingId} className={styles.name}>{composedName ?? record.name}</h1>}
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
        <div className={styles.stats}>
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
        </div>
      ) : null}

      <div className={styles.details}>
      <CatalogRecordDetails
        record={record}
        allRecords={siblings}
        recordHref={(id) => `${prefix}/parts/catalog/${encodeURIComponent(id)}`}
        recordNameFor={recordNameFor}
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
      </div>
    </Root>
  );
}
