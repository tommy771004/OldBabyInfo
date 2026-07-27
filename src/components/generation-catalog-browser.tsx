import type {
  GenerationCatalogRecord,
  GenerationDefinition,
  GenerationId,
  GenerationSystem,
} from "@/lib/generation-catalog/schema.ts";
import { searchGenerationCatalog } from "@/lib/generation-catalog/search.ts";
import styles from "./generation-catalog-browser.module.css";

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
  partTypeLabel?: string;
  legacyPartLabel?: string;
}

interface GenerationCatalogBrowserProps {
  locale: string;
  generations: GenerationDefinition[];
  systems: GenerationSystem[];
  records: GenerationCatalogRecord[];
  selectedGeneration: GenerationId;
  selectedSystem?: string;
  selectedKind?: "all" | GenerationCatalogRecord["kind"];
  selectedPartType?: string;
  searchQuery?: string;
  searchAcrossGenerations?: boolean;
  selectedRecordId?: string;
  legacyPartHrefForRecord?: (recordId: string) => string | undefined;
  /** Reader-facing name for a raw `partType` key; the raw key when omitted. */
  partTypeLabelFor?: (partType: string) => string;
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
  selectedGeneration,
  selectedSystem,
  selectedKind,
  selectedPartType,
  searchQuery,
  searchAcrossGenerations = false,
  selectedRecordId,
  legacyPartHrefForRecord,
  partTypeLabelFor = (partType) => partType,
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
  const visibleKindLabel = selectedKind === "all" || !selectedKind ? labels.allLabel : kindLabel(selectedKind, labels);
  const partTypeOptions = selectedSystemDefinition
    ? selectedSystemDefinition.partTypes
    : Array.from(new Set(generationSystems.flatMap((system) => system.partTypes))).sort();
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
        <p className={styles.lede}>{visibleKindLabel} · {visibleRecords.length} records</p>
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
        <div className={styles.field}>
          <label htmlFor={`catalog-kind-filter-${formIdSuffix}`}>{labels.kindLabel}</label>
          <select id={`catalog-kind-filter-${formIdSuffix}`} name="catalogKind" defaultValue={selectedKind ?? "all"}>
            <option value="all">{labels.allLabel}</option>
            <option value="beyblade">{labels.beybladeLabel}</option>
            <option value="part">{labels.partLabel}</option>
            <option value="release">{labels.releaseLabel ?? "Release"}</option>
            <option value="equipment">{labels.equipmentLabel ?? "Equipment"}</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`catalog-part-type-filter-${formIdSuffix}`}>{labels.partTypeLabel ?? "Part kind"}</label>
          <select id={`catalog-part-type-filter-${formIdSuffix}`} name="catalogPartType" defaultValue={selectedPartType ?? ""}>
            <option value="">{labels.allLabel}</option>
            {partTypeOptions.map((partType) => (
              <option key={partType} value={partType}>{partTypeLabelFor(partType)}</option>
            ))}
          </select>
        </div>
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

      <nav className={styles.navGroup} aria-label={labels.kindLabel}>
        {[
          [undefined, labels.allLabel],
          ["beyblade", labels.beybladeLabel],
          ["part", labels.partLabel],
          ["release", labels.releaseLabel ?? "Release"],
          ["equipment", labels.equipmentLabel ?? "Equipment"],
        ].map(([kind, label]) => {
          const allKinds = kind === undefined;
          const kindParam = allKinds ? "all" : kind;
          return (
            <a
              key={label}
              href={hrefFor({
                catalogGeneration: selectedGeneration,
                catalogSystem: selectedSystem,
                catalogKind: kindParam,
              })}
              aria-current={(allKinds ? selectedKind === "all" || !selectedKind : selectedKind === kind) ? "page" : undefined}
            >
              {label}
            </a>
          );
        })}
      </nav>

      {selectedKind === "part" && partTypeOptions.length > 0 ? (
        <nav className={styles.navGroup} aria-label={labels.partTypeLabel ?? "Part kind"}>
          <a
            href={hrefFor({
              catalogGeneration: selectedGeneration,
              catalogSystem: selectedSystem,
              catalogKind: "part",
            })}
            aria-current={!selectedPartType ? "page" : undefined}
          >
            {labels.allLabel}
          </a>
          {partTypeOptions.map((partType) => (
            <a
              key={partType}
              href={hrefFor({
                catalogGeneration: selectedGeneration,
                catalogSystem: selectedSystem,
                catalogKind: "part",
                catalogPartType: partType,
              })}
              aria-current={partType === selectedPartType ? "page" : undefined}
            >
              {partTypeLabelFor(partType)}
            </a>
          ))}
        </nav>
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
