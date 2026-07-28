import type { GenerationCatalogRecord } from "@/lib/generation-catalog/schema.ts";
import styles from "./catalog-record-details.module.css";

export interface CatalogRecordDetailsLabels {
  kind: string;
  compositionHeading: string;
  containedByHeading: string;
  releasesHeading: string;
  releaseContentsHeading: string;
  provenanceHeading: string;
  systemLabel: string;
  legacyPartLabel: string;
  emptyComposition: string;
}

/**
 * Everything the Catalog knows about one record, as a page of its own.
 *
 * It used to be an article appended to the bottom of the full browser, which
 * meant arriving from a card put the filter form, the tab bar and a grid of
 * 200 unrelated records above the thing you clicked. A record is a
 * destination, so it gets a destination's layout: what it is, where the
 * claim comes from, and every other record it connects to.
 *
 * Relationship lists are optional because the full catalog browser is the
 * better place to compare related results. A focused destination can keep
 * only its identity, provenance, and computed stats.
 */
export function CatalogRecordDetails({
  record,
  allRecords,
  recordHref,
  recordNameFor = (related) => related.name,
  legacyPartHref,
  showRelated = true,
  labels,
}: {
  record: GenerationCatalogRecord;
  allRecords: GenerationCatalogRecord[];
  recordHref: (recordId: string) => string;
  /** Reader-facing name for a related record — a Part in the reader's
   *  language, a complete Beyblade spelled out by its Parts. */
  recordNameFor?: (related: GenerationCatalogRecord) => string;
  legacyPartHref?: string;
  /** The full browser owns cross-record navigation; keep this opt-in for
   * standalone consumers that still want the relationship lists. */
  showRelated?: boolean;
  labels: CatalogRecordDetailsLabels;
}) {
  const parts = record.components.flatMap((component) => {
    const matched = component.recordId
      ? allRecords.find((candidate) => candidate.id === component.recordId)
      : findPartByName(allRecords, component.partType, component.name);
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
  const releaseContents = record.kind === "release"
    ? [
      ...(record.releaseOf ? allRecords.filter((candidate) => candidate.id === record.releaseOf) : []),
      ...(record.containsRecordIds ?? []).flatMap((id) => {
        const contained = allRecords.find((candidate) => candidate.id === id);
        return contained ? [contained] : [];
      }),
    ]
    : [];

  return (
    <article className={styles.details}>
      <dl className={styles.spec}>
        <dt>{labels.kind}</dt>
        <dd>{record.partType ?? "—"}</dd>
        <dt>{labels.systemLabel}</dt>
        <dd>{record.system}</dd>
        <dt>{labels.provenanceHeading}</dt>
        <dd data-catalog-provenance>{record.verificationStatus} · {record.sourceId}</dd>
      </dl>

      {legacyPartHref ? (
        <p className={styles.legacyLink}>
          <a href={legacyPartHref}>{labels.legacyPartLabel}</a>
        </p>
      ) : null}

      {showRelated && record.kind === "beyblade" ? (
        <RecordList heading={labels.compositionHeading} records={parts} recordHref={recordHref} nameFor={recordNameFor} empty={labels.emptyComposition} />
      ) : null}
      {showRelated && record.kind === "part" && containingBeyblades.length > 0 ? (
        <RecordList heading={labels.containedByHeading} records={containingBeyblades} recordHref={recordHref} nameFor={recordNameFor} />
      ) : null}
      {showRelated && record.kind === "release" ? (
        <RecordList heading={labels.releaseContentsHeading} records={releaseContents} recordHref={recordHref} nameFor={recordNameFor} />
      ) : null}
      {showRelated && releases.length > 0 ? (
        <RecordList heading={labels.releasesHeading} records={releases} recordHref={recordHref} nameFor={recordNameFor} />
      ) : null}
    </article>
  );
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * A composition entry names its Part the way the app's own data writes it —
 * "DRANSWORD", "F" — while the Part record carries the catalogue name
 * ("Dran Sword", "Flat"). Matching on the exact string found one Part in
 * three; punctuation-insensitive matching plus the record's aliases (which
 * is where the short code lives) resolves the rest.
 */
function findPartByName(
  records: GenerationCatalogRecord[],
  partType: string,
  name: string,
): GenerationCatalogRecord | undefined {
  const wanted = normalizeName(name);
  if (!wanted) return undefined;

  const candidates = records.filter((record) => record.kind === "part" && record.partType === partType);
  return candidates.find((record) => normalizeName(record.name) === wanted)
    ?? candidates.find((record) => record.aliases.some((alias) => normalizeName(alias) === wanted));
}

function RecordList({
  heading,
  records,
  recordHref,
  nameFor,
  empty,
}: {
  heading: string;
  records: GenerationCatalogRecord[];
  recordHref: (recordId: string) => string;
  nameFor: (related: GenerationCatalogRecord) => string;
  empty?: string;
}) {
  const headingId = `catalog-list-${heading.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`;

  return (
    <section className={styles.list} aria-labelledby={headingId}>
      <h2 id={headingId}>{heading}</h2>
      {records.length === 0 && empty ? <p>{empty}</p> : (
        <ul>
          {records.map((related) => (
            <li key={related.id}>
              <a href={recordHref(related.id)}>{nameFor(related)}</a>
              {related.partType ? <span className={styles.listKind}>{related.partType}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
