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
import {
  GenerationCatalogBrowser,
  type CatalogFacetRow,
} from "@/components/generation-catalog-browser.tsx";
import {
  availableFacetValues,
  catalogFacetQuery,
  facetsForPartType,
  filterCatalogRecordsByFacets,
  parseCatalogFacetParams,
  type CatalogFacetState,
} from "@/lib/parts/catalog-facets.ts";
import { ratchetTeethParam, type RatchetTeeth } from "@/lib/parts/ratchet-spec.ts";
import type { Playstyle } from "@/lib/parts/schema.ts";
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
  // The tab bar counts the Generation (and System, and search hit) pool
  // *before* the selected tab narrows it, so every tab stays reachable and
  // its count answers "how many are there under this tab".
  const tabRecords = publishableCatalogRecords(
    catalogQuery !== undefined || searchAcrossGenerations
      ? searchGenerationCatalog(searchableRecords, catalogQuery ?? "", {
        generationId: searchAcrossGenerations ? undefined : selectedGeneration,
        system: selectedSystem,
      })
      : selectCatalogRecordsForPage(searchableRecords, selectedGeneration, false)
        .filter((record) => !selectedSystem || record.system === selectedSystem),
  );
  const facets = parseCatalogFacetParams({
    playstyle: firstParam(catalogParams.playstyle),
    teeth: firstParam(catalogParams.teeth),
    height: firstParam(catalogParams.height),
  });
  const faceted = filterCatalogRecordsByFacets(publishable, getLegacyPartForCatalogRecord, facets);
  const browserRecords = state.sort
    ? sortCatalogPartRecords(faceted, getLegacyPartForCatalogRecord, state.sort, state.direction)
    : projectedRecordsFirst(faceted, getLegacyPartForCatalogRecord);
  // Facet chips offer only values present before facet filtering, so picking
  // one never leaves the row showing options that would empty the page.
  const facetValues = availableFacetValues(
    publishable.filter((record) => !selectedPartType || record.partType === selectedPartType),
    getLegacyPartForCatalogRecord,
  );

  return (
    <PartsPageBody
      locale={locale}
      state={state}
      catalog={catalog}
      catalogRecords={browserRecords}
      tabRecords={tabRecords}
      selectedGeneration={selectedGeneration}
      selectedSystem={selectedSystem}
      selectedKind={selectedKind ?? "part"}
      selectedPartType={selectedPartType}
      searchQuery={catalogQuery}
      searchAcrossGenerations={searchAcrossGenerations}
      selectedRecordId={catalogRecordId}
      facets={facets}
      facetValues={facetValues}
    />
  );
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * One chip row per facet the selected tab supports — the Blade tab asks how a
 * Part plays, the Ratchet tab asks for its physical spec, and a tab with no
 * sourceable facet (Lock Chip, complete Beyblades) gets no row at all rather
 * than an empty control.
 */
function buildFacetRows({
  partType,
  facets,
  values,
  facetHref,
  labels,
}: {
  partType: string | undefined;
  facets: CatalogFacetState;
  values: ReturnType<typeof availableFacetValues>;
  facetHref: (next: CatalogFacetState) => string;
  labels: {
    allLabel: string;
    playstyle: string;
    teeth: string;
    height: string;
    playstyleOf: (playstyle: Playstyle) => string;
    metal: string;
    heightOf: (height: number) => string;
  };
}): CatalogFacetRow[] {
  const rows: CatalogFacetRow[] = [];

  for (const facet of facetsForPartType(partType)) {
    if (facet === "playstyle" && values.playstyles.length > 0) {
      rows.push({
        label: labels.playstyle,
        options: [
          {
            key: "all",
            label: labels.allLabel,
            href: facetHref({ ...facets, playstyle: undefined }),
            selected: facets.playstyle === undefined,
          },
          ...values.playstyles.map((playstyle) => ({
            key: playstyle,
            label: labels.playstyleOf(playstyle),
            href: facetHref({ ...facets, playstyle }),
            selected: facets.playstyle === playstyle,
          })),
        ],
      });
    }

    if (facet === "ratchetTeeth" && values.teeth.length > 0) {
      rows.push({
        label: labels.teeth,
        options: [
          {
            key: "all",
            label: labels.allLabel,
            href: facetHref({ ...facets, teeth: undefined }),
            selected: facets.teeth === undefined,
          },
          ...values.teeth.map((teeth: RatchetTeeth) => ({
            key: ratchetTeethParam(teeth),
            label: teeth === "metal" ? labels.metal : String(teeth),
            href: facetHref({ ...facets, teeth }),
            selected: facets.teeth === teeth,
          })),
        ],
      });
    }

    if (facet === "ratchetHeight" && values.heights.length > 0) {
      rows.push({
        label: labels.height,
        options: [
          {
            key: "all",
            label: labels.allLabel,
            href: facetHref({ ...facets, height: undefined }),
            selected: facets.height === undefined,
          },
          ...values.heights.map((height) => ({
            key: String(height),
            label: labels.heightOf(height),
            href: facetHref({ ...facets, height }),
            selected: facets.height === height,
          })),
        ],
      });
    }
  }

  return rows;
}

function PartsPageBody({
  locale,
  state,
  catalog,
  catalogRecords,
  tabRecords,
  selectedGeneration,
  selectedSystem,
  selectedKind,
  selectedPartType,
  searchQuery,
  searchAcrossGenerations,
  selectedRecordId,
  facets,
  facetValues,
}: {
  locale: Locale;
  state: FilterSortState;
  catalog: ReturnType<typeof getGenerationCatalogSnapshot>;
  catalogRecords: GenerationCatalogRecord[];
  tabRecords: GenerationCatalogRecord[];
  selectedGeneration: GenerationId;
  selectedSystem?: string;
  selectedKind: "all" | "beyblade" | "part" | "release" | "equipment";
  selectedPartType?: string;
  searchQuery?: string;
  searchAcrossGenerations?: boolean;
  selectedRecordId?: string;
  facets: CatalogFacetState;
  facetValues: ReturnType<typeof availableFacetValues>;
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
  const tabQuery = {
    catalogGeneration: selectedGeneration,
    ...(selectedSystem ? { catalogSystem: selectedSystem } : {}),
    catalogKind: selectedKind,
    ...(selectedPartType ? { catalogPartType: selectedPartType } : {}),
    ...(searchQuery ? { catalogQuery: searchQuery } : {}),
    ...(selectedRecordId ? { catalogRecordId: selectedRecordId } : {}),
  };
  const sortQueryFor = (field: SortField, direction: SortDirection) => ({
    ...tabQuery,
    ...catalogFacetQuery(facets),
    sort: field,
    dir: direction,
  });
  const facetHref = (next: CatalogFacetState) => {
    const query = new URLSearchParams({
      ...tabQuery,
      ...catalogFacetQuery(next),
      ...(state.sort ? { sort: state.sort, dir: state.direction } : {}),
    });
    return `${localePrefix}/parts?${query.toString()}`;
  };
  const facetRows = buildFacetRows({
    partType: selectedPartType,
    facets,
    values: facetValues,
    facetHref,
    labels: {
      allLabel: t("catalog_all"),
      playstyle: t("facet_playstyle"),
      teeth: t("facet_ratchet_teeth"),
      height: t("facet_ratchet_height"),
      playstyleOf: (playstyle) => t(`playstyle_${playstyle}`),
      metal: t("ratchet_teeth_metal"),
      heightOf: (height) => t("ratchet_height_value", { height }),
    },
  });

  return (
    <main className={styles.page}>
      <h1>{t("title")}</h1>

      <GenerationCatalogBrowser
        locale={locale}
        generations={catalog.generations}
        systems={catalog.systems}
        records={catalogRecords}
        tabRecords={tabRecords}
        selectedGeneration={selectedGeneration}
        selectedSystem={selectedSystem}
        selectedKind={selectedKind}
        selectedPartType={selectedPartType}
        searchQuery={searchQuery}
        searchAcrossGenerations={searchAcrossGenerations}
        selectedRecordId={selectedRecordId}
        legacyPartHrefForRecord={legacyPartHrefForRecord}
        partTypeLabelFor={partTypeLabelFor}
        facetFilters={facetRows}
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
                weight: t("weight_column"),
                weightNote: t("weight_note"),
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
