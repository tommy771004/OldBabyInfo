import { useTranslations } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import {
  getGenerationCatalogSnapshot,
  getLegacyPartForCatalogRecord,
} from "@/lib/generation-catalog/repository.ts";
import {
  generationIdSchema,
  type GenerationCatalogRecord,
  type GenerationId,
} from "@/lib/generation-catalog/schema.ts";
import { searchGenerationCatalog } from "@/lib/generation-catalog/search.ts";
import { selectCatalogRecordsForPage } from "@/lib/generation-catalog/payload.ts";
import { GenerationCatalogBrowser } from "@/components/generation-catalog-browser.tsx";
import {
  humanizePartType,
  projectedRecordsFirst,
  publishableCatalogRecords,
  sortCatalogPartRecords,
  withProjectedSearchAliases,
} from "@/lib/parts/catalog-part-rows.ts";
import type { SortDirection, SortField } from "@/lib/parts/filter-sort.ts";
import { parseFilterSortParams, type FilterSortState } from "@/lib/parts/parse-filter-sort-params.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { CatalogPartTable } from "./catalog-part-table.tsx";
import styles from "./page.module.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Every X Part kind the messages file names; anything else (Burst's
 *  ドライバー, Metal Fight's fusion_wheel) falls back to a humanized key. */
const NAMED_PART_TYPES = [
  "blade",
  "ratchet",
  "bit",
  "assist_blade",
  "lock_chip",
  "main_blade",
  "metal_blade",
  "over_blade",
] as const;

export default async function PartsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await requireLocale(params);

  const catalogParams = await searchParams;
  const state = parseFilterSortParams(catalogParams);
  const catalogGeneration = firstParam(catalogParams.catalogGeneration);
  const selectedGeneration: GenerationId = generationIdSchema.safeParse(catalogGeneration).success
    ? catalogGeneration as GenerationId
    : "x";
  const selectedSystem = firstParam(catalogParams.catalogSystem);
  const selectedKindParam = firstParam(catalogParams.catalogKind);
  const selectedKind = selectedKindParam === "all" || selectedKindParam === "beyblade" || selectedKindParam === "part" || selectedKindParam === "release" || selectedKindParam === "equipment"
    ? selectedKindParam
    : undefined;
  const catalogQuery = firstParam(catalogParams.catalogQuery);
  const selectedPartType = firstParam(catalogParams.catalogPartType);
  const catalogRecordId = firstParam(catalogParams.catalogRecordId);
  const hasCatalogGeneration = generationIdSchema.safeParse(catalogGeneration).success;
  const hasCatalogSearchParams = ["catalogQuery", "catalogSystem", "catalogKind", "catalogPartType"]
    .some((key) => catalogParams[key] !== undefined);
  const catalog = getGenerationCatalogSnapshot();
  const searchAcrossGenerations = hasCatalogSearchParams && !hasCatalogGeneration;
  // One list, built from the Catalog and carrying the X Stats where a Part
  // projection exists — the two used to be stacked as separate sections. The
  // projected names are folded in before the search runs, so a query for
  // 蒼龍神劍 reaches the record that only knows itself as "Dran Sword".
  const searchableRecords = withProjectedSearchAliases(
    catalog.records,
    getLegacyPartForCatalogRecord,
  );
  const foundRecords = hasCatalogSearchParams
    ? searchGenerationCatalog(searchableRecords, catalogQuery ?? "", {
      generationId: hasCatalogGeneration ? selectedGeneration : undefined,
      system: selectedSystem,
      kind: selectedKind === "all" ? undefined : selectedKind,
      partType: selectedPartType,
    })
    : selectCatalogRecordsForPage(searchableRecords, selectedGeneration, false);
  const publishable = publishableCatalogRecords(foundRecords);
  const browserRecords = state.sort
    ? sortCatalogPartRecords(publishable, getLegacyPartForCatalogRecord, state.sort, state.direction)
    : projectedRecordsFirst(publishable, getLegacyPartForCatalogRecord);

  return (
    <PartsPageBody
      locale={locale}
      state={state}
      catalog={catalog}
      catalogRecords={browserRecords}
      selectedGeneration={selectedGeneration}
      selectedSystem={selectedSystem}
      selectedKind={selectedKind ?? "part"}
      selectedPartType={selectedPartType}
      searchQuery={catalogQuery}
      searchAcrossGenerations={searchAcrossGenerations}
      selectedRecordId={catalogRecordId}
    />
  );
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function PartsPageBody({
  locale,
  state,
  catalog,
  catalogRecords,
  selectedGeneration,
  selectedSystem,
  selectedKind,
  selectedPartType,
  searchQuery,
  searchAcrossGenerations,
  selectedRecordId,
}: {
  locale: Locale;
  state: FilterSortState;
  catalog: ReturnType<typeof getGenerationCatalogSnapshot>;
  catalogRecords: GenerationCatalogRecord[];
  selectedGeneration: GenerationId;
  selectedSystem?: string;
  selectedKind: "all" | "beyblade" | "part" | "release" | "equipment";
  selectedPartType?: string;
  searchQuery?: string;
  searchAcrossGenerations?: boolean;
  selectedRecordId?: string;
}) {
  const t = useTranslations("PartsPage");
  const localePrefix = locale === "zh-TW" ? "" : `/${encodeURIComponent(locale)}`;
  const legacyPartHrefForRecord = (recordId: string) => {
    const legacyPart = getLegacyPartForCatalogRecord(recordId);
    return legacyPart ? `${localePrefix}/parts/${slugify(legacyPart.nameEn)}` : undefined;
  };
  const partTypeLabels: Record<string, string> = Object.fromEntries(
    NAMED_PART_TYPES.map((partType) => [partType, t(`part_type_${partType}`)]),
  );
  const partTypeLabelFor = (partType: string) => partTypeLabels[partType] ?? humanizePartType(partType);
  // Only the X Parts view has Stats to sort by, and only there does a table
  // beat cards: every other Generation/kind keeps the card grid.
  const showStatTable = selectedGeneration === "x" &&
    selectedKind === "part" &&
    !searchAcrossGenerations;
  const sortQueryFor = (field: SortField, direction: SortDirection) => ({
    catalogGeneration: selectedGeneration,
    ...(selectedSystem ? { catalogSystem: selectedSystem } : {}),
    catalogKind: selectedKind,
    ...(selectedPartType ? { catalogPartType: selectedPartType } : {}),
    ...(searchQuery ? { catalogQuery: searchQuery } : {}),
    ...(selectedRecordId ? { catalogRecordId: selectedRecordId } : {}),
    sort: field,
    dir: direction,
  });

  return (
    <main className={styles.page}>
      <h1>{t("title")}</h1>

      <GenerationCatalogBrowser
        locale={locale}
        generations={catalog.generations}
        systems={catalog.systems}
        records={catalogRecords}
        selectedGeneration={selectedGeneration}
        selectedSystem={selectedSystem}
        selectedKind={selectedKind}
        selectedPartType={selectedPartType}
        searchQuery={searchQuery}
        searchAcrossGenerations={searchAcrossGenerations}
        selectedRecordId={selectedRecordId}
        legacyPartHrefForRecord={legacyPartHrefForRecord}
        partTypeLabelFor={partTypeLabelFor}
        renderRecords={showStatTable
          ? (records) => (
            <CatalogPartTable
              records={records}
              projectionFor={getLegacyPartForCatalogRecord}
              locale={locale}
              sortField={state.sort}
              sortDirection={state.direction}
              sortQueryFor={sortQueryFor}
              partTypeLabelFor={partTypeLabelFor}
              labels={{
                partTypeColumn: t("part_type_column"),
                nameColumn: t("name_column"),
                attack: t("stat_attack"),
                defense: t("stat_defense"),
                stamina: t("stat_stamina"),
                xDash: t("stat_xDash"),
                burstResistance: t("stat_burstResistance"),
                releaseDate: t("release_date"),
                empty: t("no_results"),
              }}
            />
          )
          : undefined}
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
          searchLabel: t("catalog_search"),
          searchPlaceholder: t("catalog_search_placeholder"),
          searchSubmitLabel: t("catalog_search_submit"),
          partTypeLabel: t("catalog_part_type"),
          legacyPartLabel: t("catalog_legacy_part"),
        }}
      />
    </main>
  );
}
