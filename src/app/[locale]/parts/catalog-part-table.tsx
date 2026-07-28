import { Link } from "@/i18n/navigation.ts";
import type { GenerationCatalogRecord } from "@/lib/generation-catalog/schema.ts";
import type { WeightRange } from "@/lib/parts/part-weight.ts";
import type { SortDirection, SortField } from "@/lib/parts/filter-sort.ts";
import { formatWeightRange } from "@/lib/parts/part-weight.ts";
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

/** Shown in the kind column for a record that has no Part kind of its own —
 *  a complete Beyblade is not a Blade or a Bit. */

/**
 * What one row can say about itself. A Part answers from its own Stat block;
 * a complete Beyblade answers from its Parts added up (ADR-0007). Anything
 * that cannot answer a column leaves it undefined and the cell reads "—".
 */
export interface CatalogRowFacts {
  name: string;
  href: string;
  attack?: number;
  defense?: number;
  stamina?: number;
  xDash?: number;
  burstResistance?: number;
  weight?: WeightRange;
  releaseAt?: string | null;
}

/**
 * The single `/parts` list. Every tab uses it — Parts read their Stats off
 * their own record, complete Beyblades read theirs off the Combo their Parts
 * make. A row that cannot answer a column reads "—" rather than being hidden
 * in a second list somewhere else on the page.
 */
export function CatalogPartTable({
  records,
  factsFor,
  sortField,
  sortDirection,
  sortQueryFor,
  partTypeLabelFor,
  kindLabel,
  labels,
}: {
  records: GenerationCatalogRecord[];
  factsFor: (record: GenerationCatalogRecord) => CatalogRowFacts;
  sortField: SortField | undefined;
  sortDirection: SortDirection;
  sortQueryFor: (field: SortField, direction: SortDirection) => Record<string, string>;
  partTypeLabelFor: (partType: string) => string;
  kindLabel: string;
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
          const facts = factsFor(record);

          return (
            <tr key={record.id}>
              <td className={styles.kindCell} data-label={labels.partTypeColumn}>
                {record.partType ? partTypeLabelFor(record.partType) : kindLabel}
              </td>
              <td className={styles.nameCell} data-label={labels.nameColumn}>
                <Link href={facts.href}>{facts.name}</Link>
              </td>
              <Cell label={statLabels.attack} value={facts.attack} />
              <Cell label={statLabels.defense} value={facts.defense} />
              <Cell label={statLabels.stamina} value={facts.stamina} />
              <Cell label={statLabels.xDash} value={facts.xDash} />
              <Cell label={statLabels.burstResistance} value={facts.burstResistance} />
              <Cell label={labels.weight} value={facts.weight ? formatWeightRange(facts.weight) : undefined} />
              <Cell label={labels.releaseDate} value={facts.releaseAt ?? undefined} />
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
