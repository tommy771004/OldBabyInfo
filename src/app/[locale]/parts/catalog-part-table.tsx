import { Link } from "@/i18n/navigation.ts";
import type { Locale } from "@/i18n/routing.ts";
import type { GenerationCatalogRecord } from "@/lib/generation-catalog/schema.ts";
import type { PartProjectionLookup } from "@/lib/parts/catalog-part-rows.ts";
import type { SortDirection, SortField } from "@/lib/parts/filter-sort.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { formatWeightRange, weightRangeOf } from "@/lib/parts/part-weight.ts";
import { slugify } from "@/lib/parts/slug.ts";
import styles from "./catalog-part-table.module.css";

const STAT_FIELDS = ["attack", "defense", "stamina", "xDash", "burstResistance"] as const;

export interface CatalogPartTableLabels {
  partTypeColumn: string;
  nameColumn: string;
  attack: string;
  defense: string;
  stamina: string;
  xDash: string;
  burstResistance: string;
  weight: string;
  weightNote: string;
  releaseDate: string;
  sortLabel: string;
  empty: string;
}

/**
 * The single `/parts` list: Catalog records as rows, with the X Stats
 * projected onto whichever of them have one. A record with no projection
 * (a CX Lock Chip, a colour variant) is still a real Part and keeps its row —
 * it just reads "—" across the Stat columns instead of being hidden in a
 * second list further down the page.
 */
export function CatalogPartTable({
  records,
  projectionFor,
  locale,
  sortField,
  sortDirection,
  sortQueryFor,
  partTypeLabelFor,
  labels,
}: {
  records: GenerationCatalogRecord[];
  projectionFor: PartProjectionLookup;
  locale: Locale;
  sortField: SortField | undefined;
  sortDirection: SortDirection;
  sortQueryFor: (field: SortField, direction: SortDirection) => Record<string, string>;
  partTypeLabelFor: (partType: string) => string;
  labels: CatalogPartTableLabels;
}) {
  if (records.length === 0) return <p>{labels.empty}</p>;

  const statLabels: Record<(typeof STAT_FIELDS)[number], string> = {
    attack: labels.attack,
    defense: labels.defense,
    stamina: labels.stamina,
    xDash: labels.xDash,
    burstResistance: labels.burstResistance,
  };

  const sortFields = [...STAT_FIELDS, "weight", "releaseAt"] as const;
  const columnLabels: Record<(typeof sortFields)[number], string> = {
    ...statLabels,
    weight: labels.weight,
    releaseAt: labels.releaseDate,
  };

  return (
    <>
      {/* Phone width turns each row into a card and drops the header row with
          it, so the sort controls need a home of their own. Same links, same
          state — only the presentation differs. */}
      <nav className={styles.sortRow} aria-label={labels.sortLabel}>
        <span className={styles.sortRowLabel}>{labels.sortLabel}</span>
        {sortFields.map((field) => (
          <SortLink
            key={field}
            field={field}
            sortField={sortField}
            sortDirection={sortDirection}
            sortQueryFor={sortQueryFor}
          >
            {columnLabels[field]}
          </SortLink>
        ))}
      </nav>

      <table className={styles.table}>
      <caption>{labels.weightNote}</caption>
      <thead>
        <tr>
          <th scope="col">{labels.partTypeColumn}</th>
          <th scope="col">{labels.nameColumn}</th>
          {STAT_FIELDS.map((field) => (
            <th key={field} scope="col">
              <SortLink
                field={field}
                sortField={sortField}
                sortDirection={sortDirection}
                sortQueryFor={sortQueryFor}
              >
                {statLabels[field]}
              </SortLink>
            </th>
          ))}
          <th scope="col">
            <SortLink
              field="weight"
              sortField={sortField}
              sortDirection={sortDirection}
              sortQueryFor={sortQueryFor}
            >
              {labels.weight}
            </SortLink>
          </th>
          <th scope="col">
            <SortLink
              field="releaseAt"
              sortField={sortField}
              sortDirection={sortDirection}
              sortQueryFor={sortQueryFor}
            >
              {labels.releaseDate}
            </SortLink>
          </th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => {
          const part = projectionFor(record.id);
          const isBit = part?.type === "bit";
          const weightRange = part ? weightRangeOf(part) : undefined;

          return (
            <tr key={record.id}>
              <td className={styles.kindCell} data-label={labels.partTypeColumn}>
                {record.partType ? partTypeLabelFor(record.partType) : "—"}
              </td>
              <td className={styles.nameCell} data-label={labels.nameColumn}>
                {part ? (
                  <Link href={`/parts/${slugify(part.nameEn)}`}>{localizedNameOf(part, locale)}</Link>
                ) : (
                  <Link href={`/parts/catalog/${encodeURIComponent(record.id)}`}>{record.name}</Link>
                )}
              </td>
              <Cell label={statLabels.attack} value={part?.stats.attack} />
              <Cell label={statLabels.defense} value={part?.stats.defense} />
              <Cell label={statLabels.stamina} value={part?.stats.stamina} />
              <Cell label={statLabels.xDash} value={isBit ? part.stats.xDash : undefined} />
              <Cell label={statLabels.burstResistance} value={isBit ? part.stats.burstResistance : undefined} />
              <Cell label={labels.weight} value={weightRange ? formatWeightRange(weightRange) : undefined} />
              <Cell label={labels.releaseDate} value={part?.releaseAt ?? undefined} />
            </tr>
          );
        })}
      </tbody>
      </table>
    </>
  );
}

/**
 * One value cell. `data-label` is what the card layout shows in place of the
 * column header, and `data-empty` is what lets it drop the row entirely —
 * a card listing six "—" lines is worse than a card that simply says less.
 * The table keeps the em dash, because a column has to line up.
 */
function Cell({ label, value }: { label: string; value: string | number | undefined }) {
  const empty = value === undefined;
  return (
    <td data-label={label} data-empty={empty ? "true" : undefined}>
      {empty ? "—" : value}
    </td>
  );
}

function SortLink({
  field,
  sortField,
  sortDirection,
  sortQueryFor,
  children,
}: {
  field: SortField;
  sortField: SortField | undefined;
  sortDirection: SortDirection;
  sortQueryFor: (field: SortField, direction: SortDirection) => Record<string, string>;
  children: React.ReactNode;
}) {
  const isActive = sortField === field;
  const nextDirection = isActive && sortDirection === "asc" ? "desc" : "asc";

  return (
    <Link
      href={{ pathname: "/parts", query: sortQueryFor(field, nextDirection) }}
      aria-current={isActive ? "true" : undefined}
    >
      {children}
      {isActive ? (sortDirection === "asc" ? " ▲" : " ▼") : null}
    </Link>
  );
}
