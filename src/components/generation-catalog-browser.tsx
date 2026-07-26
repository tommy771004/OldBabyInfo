import type {
  GenerationCatalogRecord,
  GenerationDefinition,
  GenerationId,
  GenerationSystem,
} from "@/lib/generation-catalog/schema.ts";

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
}

interface GenerationCatalogBrowserProps {
  locale: string;
  generations: GenerationDefinition[];
  systems: GenerationSystem[];
  records: GenerationCatalogRecord[];
  selectedGeneration: GenerationId;
  selectedSystem?: string;
  selectedKind?: "beyblade" | "part";
  selectedRecordId?: string;
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
  selectedRecordId,
  labels,
}: GenerationCatalogBrowserProps) {
  const generationRecords = records.filter((record) => record.generationId === selectedGeneration);
  const generationSystems = systems.filter((system) => system.generationId === selectedGeneration);
  const selectedSystemDefinition = generationSystems.find((system) => system.id === selectedSystem);
  const visibleRecords = generationRecords.filter((record) =>
    (!selectedSystem || record.system === selectedSystem) &&
    (!selectedKind || record.kind === selectedKind),
  );
  const selectedRecord = generationRecords.find((record) => record.id === selectedRecordId);
  const prefix = locale === "zh-TW" ? "" : `/${encodeURIComponent(locale)}`;

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
    <section aria-labelledby="generation-catalog-heading">
      <h2 id="generation-catalog-heading">{labels.heading}</h2>

      <nav aria-label={labels.generationLabel}>
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
        <nav aria-label={labels.systemLabel}>
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

      <nav aria-label={labels.kindLabel}>
        {[
          [undefined, labels.allLabel],
          ["beyblade", labels.beybladeLabel],
          ["part", labels.partLabel],
        ].map(([kind, label]) => (
          <a
            key={label}
            href={hrefFor({
              catalogGeneration: selectedGeneration,
              catalogSystem: selectedSystem,
              catalogKind: kind,
            })}
            aria-current={selectedKind === kind ? "page" : undefined}
          >
            {label}
          </a>
        ))}
      </nav>

      <ul aria-label={labels.heading}>
        {visibleRecords.map((record) => (
          <li key={record.id}>
            <span>{kindLabel(record.kind, labels)}</span>{" "}
            {record.partType ? <span>{record.partType}</span> : null}{" "}
            <a href={recordHref(record.id)}>{record.name}</a>
          </li>
        ))}
      </ul>

      {selectedRecord ? (
        <CatalogRecordDetails
          record={selectedRecord}
          allRecords={generationRecords}
          labels={labels}
          recordHref={recordHref}
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
}: {
  record: GenerationCatalogRecord;
  allRecords: GenerationCatalogRecord[];
  labels: GenerationCatalogBrowserLabels;
  recordHref: (recordId: string) => string;
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
    <article aria-labelledby="catalog-record-heading">
      <h3 id="catalog-record-heading">{record.name}</h3>
      <p>{kindLabel(record.kind, labels)}</p>
      <p data-catalog-provenance>{record.verificationStatus} · {record.sourceId}</p>
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
