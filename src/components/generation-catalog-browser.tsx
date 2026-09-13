import type {
  GenerationCatalogRecord,
  GenerationDefinition,
  GenerationId,
  GenerationSystem,
} from "@/lib/generation-catalog/schema.ts";
import Image from "next/image";
import { searchGenerationCatalog } from "@/lib/generation-catalog/search.ts";
import { catalogTabsOf, isTabSelected } from "@/lib/generation-catalog/tabs.ts";
import { CheckIcon } from "./ui-icons.tsx";
import {
  CATALOG_DEFAULT_PAGE_SIZE,
  CATALOG_PAGE_SIZES,
  CATALOG_SIZE_PARAM,
  parseCatalogPaginationParams,
  type CatalogPageSize,
} from "@/lib/generation-catalog/pagination.ts";
import styles from "./generation-catalog-browser.module.css";
import { PaginationControls, type PaginationControlsLabels } from "./pagination-controls.tsx";

export interface CatalogFacetRow {
  label: string;
  options: Array<{ key: string; label: string; href: string; selected: boolean }>;
}

export interface GenerationCatalogBrowserLabels {
  heading: string;
  generationLabel: string;
  systemLabel: string;
  kindLabel: string;
  allLabel: string;
  beybladeLabel: string;
  partLabel: string;
  compositionHeading: string;
  containedByHeading: string;
  releasesHeading?: string;
  releaseContentsHeading?: string;
  releaseLabel?: string;
  equipmentLabel?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  searchSubmitLabel?: string;
  legacyPartLabel?: string;
  relatedLabel?: string;
}

interface GenerationCatalogBrowserProps {
  locale: string;
  generations: GenerationDefinition[];
  systems: GenerationSystem[];
  records: GenerationCatalogRecord[];
  /**
   * The pool the tab bar counts, before the selected tab narrows it — the
   * `records` prop arrives already filtered to one tab, which would leave the
   * bar showing a single tab and no way back out.
   */
  tabRecords?: GenerationCatalogRecord[];
  selectedGeneration: GenerationId;
  selectedSystem?: string;
  selectedKind?: "all" | GenerationCatalogRecord["kind"];
  selectedPartType?: string;
  searchQuery?: string;
  searchAcrossGenerations?: boolean;
  /** Localized count for the visible list; a bare number when omitted. */
  recordCountLabel?: (count: number) => string;
  /** Reader-facing name for a raw `partType` key; the raw key when omitted. */
  partTypeLabelFor?: (partType: string) => string;
  /** Reader-facing name for a record whose own name is a model string — a
   *  complete Beyblade reads as its Parts. Falls back to `record.name`. */
  recordNameFor?: (record: GenerationCatalogRecord) => string;
  /** Compact composition/relationship preview shown with each result. */
  recordRelatedFor?: (record: GenerationCatalogRecord) => string | undefined;
  /** Thumbnail for a record, when one can be resolved. */
  recordImageFor?: (record: GenerationCatalogRecord) => { url: string; width: number; height: number } | undefined;
  /** Filters that only make sense for the selected tab — a Blade's playstyle,
   *  a Ratchet's teeth and height. Rendered directly under the tab bar. */
  facetFilters?: CatalogFacetRow[];
  /**
   * Replaces the default card grid with another view of the same visible
   * records — `/parts` swaps in the Stat table for X Parts so the page never
   * shows two lists of the same Parts (see catalog-part-table.tsx).
   */
  renderRecords?: (records: GenerationCatalogRecord[]) => React.ReactNode;
  /**
   * The page the URL asks for. The list is sliced here, after the search and
   * kind filters, because only this component knows how many records they
   * admit — the lede and the tab counts keep describing the whole list.
   * Omitted, every record renders (the compare and detail pages want that).
   */
  pagination?: { page: number; pageSize: CatalogPageSize };
  /** Builds a page link carrying every live filter, facet and sort; the page
   *  owns those parameters, so the page builds the link. */
  paginationHrefFor?: (page: number, pageSize: CatalogPageSize) => string;
  paginationLabels?: PaginationControlsLabels;
  /** "showing 11–20", printed beside the total when the list is paged. */
  pageRangeLabel?: (start: number, end: number) => string;
  labels: GenerationCatalogBrowserLabels;
}

export function GenerationCatalogBrowser({
  locale,
  generations,
  systems,
  records,
  tabRecords,
  selectedGeneration,
  selectedSystem,
  selectedKind,
  selectedPartType,
  searchQuery,
  searchAcrossGenerations = false,
  recordCountLabel = (count) => String(count),
  partTypeLabelFor = (partType) => partType,
  recordNameFor = (record) => record.name,
  recordRelatedFor,
  recordImageFor,
  facetFilters,
  renderRecords,
  pagination,
  paginationHrefFor,
  paginationLabels,
  pageRangeLabel,
  labels,
}: GenerationCatalogBrowserProps) {
  const generationRecords = records.filter((record) => record.generationId === selectedGeneration);
  const generationSystems = systems.filter((system) => system.generationId === selectedGeneration);
  const systemOptions = searchAcrossGenerations ? systems : generationSystems;
  const selectedSystemDefinition = generationSystems.find((system) => system.id === selectedSystem);
  const visibleRecords = searchAcrossGenerations || searchQuery !== undefined
    ? searchGenerationCatalog(records, searchQuery ?? "", {
      generationId: searchAcrossGenerations ? undefined : selectedGeneration,
      system: selectedSystem,
      kind: selectedKind === "all" ? undefined : selectedKind,
      partType: selectedPartType,
    })
    : generationRecords.filter((record) =>
      (!selectedSystem || record.system === selectedSystem) &&
      (selectedKind === "all" || !selectedKind || record.kind === selectedKind) &&
      (!selectedPartType || record.partType === selectedPartType),
    );
  // Paging happens on the final visible list; a page past its end lands on
  // the last page rather than an empty one.
  const pageState = pagination
    ? parseCatalogPaginationParams(
      { catalogPage: String(pagination.page), [CATALOG_SIZE_PARAM]: String(pagination.pageSize) },
      visibleRecords.length,
    )
    : undefined;
  const pageRecords = pageState ? visibleRecords.slice(pageState.start, pageState.end) : visibleRecords;
  // Fewer records than the smallest page means nothing to page through; the
  // controls would only be noise under a four-row list.
  const showPaging = Boolean(pageState && paginationHrefFor && paginationLabels && visibleRecords.length > CATALOG_PAGE_SIZES[0]);
  const visibleKindLabel = selectedPartType
    ? partTypeLabelFor(selectedPartType)
    : selectedKind === "all" || !selectedKind
      ? labels.allLabel
      : kindLabel(selectedKind, labels);
  // Tab counts describe the same pool the list is drawn from, so a search
  // turns the tab bar into a per-category hit count instead of going stale.
  const tabBase = tabRecords ?? (searchAcrossGenerations
    ? records
    : generationRecords.filter((record) => !selectedSystem || record.system === selectedSystem));
  const tabs = catalogTabsOf(tabBase, generationSystems);
  const prefix = locale === "zh-TW" ? "" : `/${encodeURIComponent(locale)}`;
  const formIdSuffix = selectedGeneration.replace(/[^a-zA-Z0-9_-]/g, "-");

  // A filter change starts over at page 1 but keeps the reader's page size.
  const keptPageSize = pagination && pagination.pageSize !== CATALOG_DEFAULT_PAGE_SIZE
    ? String(pagination.pageSize)
    : undefined;
  const hrefFor = (params: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...params, [CATALOG_SIZE_PARAM]: keptPageSize })) {
      if (value) query.set(key, value);
    }
    const queryString = query.toString();
    return `${prefix}/parts${queryString ? `?${queryString}` : ""}`;
  };
  const recordHref = (recordId: string) => `${prefix}/parts/catalog/${encodeURIComponent(recordId)}`;

  return (
    <section className={styles.browser} aria-label={labels.heading}>
      {/* No heading here: the page's own <h1> already names this, and two
          titles saying the same thing was the first thing on the page. */}
      <p className={styles.lede}>
        {visibleKindLabel} · {recordCountLabel(visibleRecords.length)}
        {showPaging && pageState && pageRangeLabel ? <> · {pageRangeLabel(pageState.start + 1, pageState.end)}</> : null}
      </p>

      {/* M3 outlined text field and selects. The label follows the control in
          the DOM because the floating label is driven by `:placeholder-shown`
          on its own sibling — no script, and the resting position is the
          readable one, so a browser that supports nothing still shows a
          labelled field. */}
      <form className={styles.searchForm} method="get" action={`${prefix}/parts`} role="search">
        <div className={`${styles.field} m3-field`}>
          <input
            className="m3-field__input"
            id={`catalog-query-${formIdSuffix}`}
            name="catalogQuery"
            type="search"
            placeholder={labels.searchPlaceholder ?? "Search by name or alias"}
            defaultValue={searchQuery}
          />
          <label className="m3-field__label" htmlFor={`catalog-query-${formIdSuffix}`}>
            {labels.searchLabel ?? "Search catalog"}
          </label>
        </div>
        <div className={`${styles.field} m3-field m3-field--select`}>
          <select
            className="m3-field__input"
            id={`catalog-generation-filter-${formIdSuffix}`}
            name="catalogGeneration"
            defaultValue={searchAcrossGenerations ? "" : selectedGeneration}
          >
            <option value="">{labels.allLabel}</option>
            {generations.map((generation) => <option key={generation.id} value={generation.id}>{generation.nameEn}</option>)}
          </select>
          <label className="m3-field__label" htmlFor={`catalog-generation-filter-${formIdSuffix}`}>
            {labels.generationLabel}
          </label>
        </div>
        <div className={`${styles.field} m3-field m3-field--select`}>
          <select
            className="m3-field__input"
            id={`catalog-system-filter-${formIdSuffix}`}
            name="catalogSystem"
            defaultValue={selectedSystem ?? ""}
          >
            <option value="">{labels.allLabel}</option>
            {systemOptions.map((system) => <option key={system.id} value={system.id}>{system.nameEn}</option>)}
          </select>
          <label className="m3-field__label" htmlFor={`catalog-system-filter-${formIdSuffix}`}>
            {labels.systemLabel}
          </label>
        </div>
        <input type="hidden" name="catalogKind" value={selectedKind ?? "part"} />
        {selectedPartType ? <input type="hidden" name="catalogPartType" value={selectedPartType} /> : null}
        {keptPageSize ? <input type="hidden" name={CATALOG_SIZE_PARAM} value={keptPageSize} /> : null}
        <button type="submit" className={`${styles.searchSubmit} m3-button m3-button--filled m3-state`}>
          {labels.searchSubmitLabel ?? "Search"}
        </button>
      </form>

      <nav className={styles.navGroup} aria-label={labels.generationLabel}>
        {generations.map((generation) => (
          <a
            key={generation.id}
            className="m3-chip m3-state"
            href={hrefFor({ catalogGeneration: generation.id })}
            aria-current={generation.id === selectedGeneration ? "page" : undefined}
          >
            {generation.id === selectedGeneration ? <CheckIcon /> : null}
            {generation.nameEn}
          </a>
        ))}
      </nav>

      {generationSystems.length > 0 ? (
        <nav className={styles.navGroup} aria-label={labels.systemLabel}>
          <a
            className="m3-chip m3-state"
            href={hrefFor({ catalogGeneration: selectedGeneration })}
            aria-current={!selectedSystem ? "page" : undefined}
          >
            {selectedSystem ? null : <CheckIcon />}
            {labels.allLabel}
          </a>
          {generationSystems.map((system) => (
            <a
              key={system.id}
              className="m3-chip m3-state"
              href={hrefFor({ catalogGeneration: selectedGeneration, catalogSystem: system.id })}
              aria-current={system.id === selectedSystem ? "page" : undefined}
            >
              {system.id === selectedSystem ? <CheckIcon /> : null}
              {system.nameEn}
            </a>
          ))}
        </nav>
      ) : null}
      {selectedSystemDefinition ? (
        <p data-catalog-compatibility>{selectedSystemDefinition.compatibilityRules.join(" ")}</p>
      ) : null}

      <nav className="m3-tabs" aria-label={labels.kindLabel}>
        {tabs.map((tab) => (
          <a
            key={`${tab.kind}:${tab.partType ?? ""}`}
            className="m3-tab m3-state"
            href={hrefFor({
              catalogGeneration: selectedGeneration,
              catalogSystem: selectedSystem,
              catalogKind: tab.kind,
              catalogPartType: tab.partType,
            })}
            aria-current={isTabSelected(tab, selectedKind, selectedPartType) ? "page" : undefined}
          >
            {tab.partType ? partTypeLabelFor(tab.partType) : kindLabel(tab.kind, labels)}
            <span className="m3-tab__count">{tab.count}</span>
          </a>
        ))}
      </nav>

      {facetFilters && facetFilters.length > 0 ? (
        <div className={styles.facets}>
          {facetFilters.map((row) => (
            <nav className={styles.facetRow} key={row.label} aria-label={row.label}>
              <span className={styles.facetLabel}>{row.label}</span>
              <span className={styles.navGroup}>
                {row.options.map((option) => (
                  <a
                    key={option.key}
                    className="m3-chip m3-state"
                    href={option.href}
                    aria-current={option.selected ? "page" : undefined}
                  >
                    {option.selected ? <CheckIcon /> : null}
                    {option.label}
                  </a>
                ))}
              </span>
            </nav>
          ))}
        </div>
      ) : null}

      {renderRecords ? renderRecords(pageRecords) : (
        <ul className={styles.recordGrid} aria-label={labels.heading}>
          {pageRecords.map((record) => {
            const image = recordImageFor?.(record);
            const related = recordRelatedFor?.(record);
            return (
              <li className={`${styles.recordCard} current-border`} key={record.id}>
                {image ? (
                  <Image
                    className={styles.recordImage}
                    src={image.url}
                    alt=""
                    width={image.width}
                    height={image.height}
                    sizes="8rem"
                  />
                ) : null}
                <div className={styles.recordMeta}>
                  <span>{kindLabel(record.kind, labels)}</span>
                  {record.partType ? <span>{partTypeLabelFor(record.partType)}</span> : null}
                </div>
                <a className={styles.recordLink} href={recordHref(record.id)}>{recordNameFor(record)}</a>
                {related ? (
                  <span className={styles.recordRelated}>
                    {labels.relatedLabel ? <span className={styles.relatedLabel}>{labels.relatedLabel}: </span> : null}
                    {related}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {showPaging && pageState && paginationHrefFor && paginationLabels ? (
        <PaginationControls
          page={pageState.page}
          pageSize={pageState.pageSize}
          totalPages={pageState.totalPages}
          sizes={CATALOG_PAGE_SIZES}
          hrefFor={paginationHrefFor}
          labels={paginationLabels}
          ariaLabel={labels.heading}
        />
      ) : null}
    </section>
  );
}

function kindLabel(
  kind: GenerationCatalogRecord["kind"],
  labels: GenerationCatalogBrowserLabels,
): string {
  if (kind === "beyblade") return labels.beybladeLabel;
  if (kind === "part") return labels.partLabel;
  if (kind === "release") return labels.releaseLabel ?? "Release";
  return labels.equipmentLabel ?? "Equipment";
}
