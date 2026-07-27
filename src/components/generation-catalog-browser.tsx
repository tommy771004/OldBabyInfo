import type {
  GenerationCatalogRecord,
  GenerationDefinition,
  GenerationId,
  GenerationSystem,
} from "@/lib/generation-catalog/schema.ts";
import { searchGenerationCatalog } from "@/lib/generation-catalog/search.ts";
import { catalogTabsOf, isTabSelected } from "@/lib/generation-catalog/tabs.ts";
import styles from "./generation-catalog-browser.module.css";

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
  selectedRecordId?: string;
  legacyPartHrefForRecord?: (recordId: string) => string | undefined;
  /** Localized count for the visible list; a bare number when omitted. */
  recordCountLabel?: (count: number) => string;
  /** Reader-facing name for a raw `partType` key; the raw key when omitted. */
  partTypeLabelFor?: (partType: string) => string;
  /** Filters that only make sense for the selected tab — a Blade's playstyle,
   *  a Ratchet's teeth and height. Rendered directly under the tab bar. */
  facetFilters?: CatalogFacetRow[];
  /**
   * Replaces the default card grid with another view of the same visible
   * records — `/parts` swaps in the Stat table for X Parts so the page never
   * shows two lists of the same Parts (see catalog-part-table.tsx).
   */
  renderRecords?: (records: GenerationCatalogRecord[]) => React.ReactNode;
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
  selectedRecordId,
  legacyPartHrefForRecord,
  recordCountLabel = (count) => String(count),
  partTypeLabelFor = (partType) => partType,
  facetFilters,
  renderRecords,
  labels,
}: GenerationCatalogBrowserProps) {
  const generationRecords = records.filter((record) => record.generationId === selectedGeneration);
  const generationSystems = systems.filter((system) => system.generationId === selectedGeneration);
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
  const selectedRecord = generationRecords.find((record) => record.id === selectedRecordId);
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
  const formIdSuffix = (selectedRecordId ?? selectedGeneration).replace(/[^a-zA-Z0-9_-]/g, "-");

  const hrefFor = (params: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    const queryString = query.toString();
    return `${prefix}/parts${queryString ? `?${queryString}` : ""}`;
  };
  const recordHref = (recordId: string) => `${prefix}/parts/catalog/${encodeURIComponent(recordId)}`;

  return (
    <section className={styles.browser} aria-labelledby="generation-catalog-heading">
      <header className={styles.header}>
        <p className={styles.kicker}>CATALOG / {selectedGeneration.toUpperCase()}</p>
        <h2 id="generation-catalog-heading">{labels.heading}</h2>
        <p className={styles.lede}>{visibleKindLabel} · {recordCountLabel(visibleRecords.length)}</p>
      </header>

      <form className={styles.searchForm} method="get" action={`${prefix}/parts`} role="search">
        <div className={styles.field}>
          <label htmlFor={`catalog-query-${formIdSuffix}`}>{labels.searchLabel ?? "Search catalog"}</label>
          <input
            id={`catalog-query-${formIdSuffix}`}
            name="catalogQuery"
            type="search"
            placeholder={labels.searchPlaceholder ?? "Search by name or alias"}
            defaultValue={searchQuery}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`catalog-generation-filter-${formIdSuffix}`}>{labels.generationLabel}</label>
          <select
            id={`catalog-generation-filter-${formIdSuffix}`}
            name="catalogGeneration"
            defaultValue={searchAcrossGenerations ? "" : selectedGeneration}
          >
            <option value="">{labels.allLabel}</option>
            {generations.map((generation) => <option key={generation.id} value={generation.id}>{generation.nameEn}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`catalog-system-filter-${formIdSuffix}`}>{labels.systemLabel}</label>
          <select id={`catalog-system-filter-${formIdSuffix}`} name="catalogSystem" defaultValue={selectedSystem ?? ""}>
            <option value="">{labels.allLabel}</option>
            {systems.map((system) => <option key={system.id} value={system.id}>{system.nameEn}</option>)}
          </select>
        </div>
        <input type="hidden" name="catalogKind" value={selectedKind ?? "part"} />
        {selectedPartType ? <input type="hidden" name="catalogPartType" value={selectedPartType} /> : null}
        <button type="submit">{labels.searchSubmitLabel ?? "Search"}</button>
      </form>

      <nav className={styles.navGroup} aria-label={labels.generationLabel}>
        {generations.map((generation) => (
          <a
            key={generation.id}
            href={hrefFor({ catalogGeneration: generation.id })}
            aria-current={generation.id === selectedGeneration ? "page" : undefined}
          >
            {generation.nameEn}
          </a>
        ))}
      </nav>

      {generationSystems.length > 0 ? (
        <nav className={styles.navGroup} aria-label={labels.systemLabel}>
          <a href={hrefFor({ catalogGeneration: selectedGeneration })} aria-current={!selectedSystem ? "page" : undefined}>
            {labels.allLabel}
          </a>
          {generationSystems.map((system) => (
            <a
              key={system.id}
              href={hrefFor({ catalogGeneration: selectedGeneration, catalogSystem: system.id })}
              aria-current={system.id === selectedSystem ? "page" : undefined}
            >
              {system.nameEn}
            </a>
          ))}
        </nav>
      ) : null}
      {selectedSystemDefinition ? (
        <p data-catalog-compatibility>{selectedSystemDefinition.compatibilityRules.join(" ")}</p>
      ) : null}

      <nav className={styles.tabs} aria-label={labels.kindLabel}>
        {tabs.map((tab) => (
          <a
            key={`${tab.kind}:${tab.partType ?? ""}`}
            href={hrefFor({
              catalogGeneration: selectedGeneration,
              catalogSystem: selectedSystem,
              catalogKind: tab.kind,
              catalogPartType: tab.partType,
            })}
            aria-current={isTabSelected(tab, selectedKind, selectedPartType) ? "page" : undefined}
          >
            {tab.partType ? partTypeLabelFor(tab.partType) : kindLabel(tab.kind, labels)}
            <span className={styles.tabCount}>{tab.count}</span>
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
                  <a key={option.key} href={option.href} aria-current={option.selected ? "page" : undefined}>
                    {option.label}
                  </a>
                ))}
              </span>
            </nav>
          ))}
        </div>
      ) : null}

      {renderRecords ? renderRecords(visibleRecords) : (
        <ul className={styles.recordGrid} aria-label={labels.heading}>
          {visibleRecords.map((record) => (
            <li className={styles.recordCard} key={record.id}>
              <div className={styles.recordMeta}>
                <span>{kindLabel(record.kind, labels)}</span>
                {record.partType ? <span>{partTypeLabelFor(record.partType)}</span> : null}
              </div>
              <a className={styles.recordLink} href={recordHref(record.id)}>{record.name}</a>
            </li>
          ))}
        </ul>
      )}

      {selectedRecord ? (
        <CatalogRecordDetails
          record={selectedRecord}
          allRecords={generationRecords}
          labels={labels}
          recordHref={recordHref}
          legacyPartHref={legacyPartHrefForRecord?.(selectedRecord.id)}
        />
      ) : null}
    </section>
  );
}

function CatalogRecordDetails({
  record,
  allRecords,
  labels,
  recordHref,
  legacyPartHref,
}: {
  record: GenerationCatalogRecord;
  allRecords: GenerationCatalogRecord[];
  labels: GenerationCatalogBrowserLabels;
  recordHref: (recordId: string) => string;
  legacyPartHref?: string;
}) {
  const parts = record.components.flatMap((component) => {
    const matched = component.recordId
      ? allRecords.find((candidate) => candidate.id === component.recordId)
      : allRecords.find((candidate) =>
        candidate.kind === "part" &&
        candidate.partType === component.partType &&
        candidate.name === component.name,
      );
    return matched ? [matched] : [];
  });
  const containingBeyblades = record.kind === "part"
    ? allRecords.filter((candidate) => candidate.kind === "beyblade" && candidate.components.some((component) =>
      component.recordId === record.id ||
      (component.partType === record.partType && component.name === record.name),
    ))
    : [];
  const releases = record.kind !== "release"
    ? allRecords.filter((candidate) => candidate.kind === "release" && (
      candidate.releaseOf === record.id || candidate.containsRecordIds?.includes(record.id)
    ))
    : [];

  return (
    <article className={styles.details} aria-labelledby="catalog-record-heading">
      <h3 id="catalog-record-heading">{record.name}</h3>
      <p>{kindLabel(record.kind, labels)}</p>
      <p data-catalog-provenance>{record.verificationStatus} · {record.sourceId}</p>
      {record.kind === "part" && legacyPartHref ? (
        <p><a href={legacyPartHref}>{labels.legacyPartLabel ?? "Open legacy part page"}</a></p>
      ) : null}
      {record.kind === "beyblade" ? (
        <section aria-labelledby="catalog-composition-heading">
          <h4 id="catalog-composition-heading">{labels.compositionHeading}</h4>
          <ul>
            {parts.map((part) => <li key={part.id}><a href={recordHref(part.id)}>{part.name}</a></li>)}
          </ul>
        </section>
      ) : record.kind === "part" ? (
        <section aria-labelledby="catalog-contained-by-heading">
          <h4 id="catalog-contained-by-heading">{labels.containedByHeading}</h4>
          <ul>
            {containingBeyblades.map((beyblade) => <li key={beyblade.id}><a href={recordHref(beyblade.id)}>{beyblade.name}</a></li>)}
          </ul>
        </section>
      ) : record.kind === "release" ? (
        <section aria-labelledby="catalog-release-contents-heading">
          <h4 id="catalog-release-contents-heading">{labels.releaseContentsHeading ?? "Release contents"}</h4>
          <ul>
            {record.releaseOf ? (
              <li>
                {(() => {
                  const mechanicalModel = allRecords.find((candidate) => candidate.id === record.releaseOf);
                  return mechanicalModel
                    ? <a href={recordHref(mechanicalModel.id)}>{mechanicalModel.name}</a>
                    : record.releaseOf;
                })()}
              </li>
            ) : null}
            {(record.containsRecordIds ?? []).map((containedRecordId) => {
              const contained = allRecords.find((candidate) => candidate.id === containedRecordId);
              return contained ? <li key={contained.id}><a href={recordHref(contained.id)}>{contained.name}</a></li> : null;
            })}
          </ul>
        </section>
      ) : null}
      {releases.length > 0 && labels.releasesHeading ? (
        <section aria-labelledby="catalog-releases-heading">
          <h4 id="catalog-releases-heading">{labels.releasesHeading}</h4>
          <ul>
            {releases.map((release) => <li key={release.id}><a href={recordHref(release.id)}>{release.name}</a></li>)}
          </ul>
        </section>
      ) : null}
    </article>
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
