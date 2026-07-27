import { Link } from "@/i18n/navigation.ts";
import type { Locale } from "@/i18n/routing.ts";
import type { GenerationCatalogRecord } from "@/lib/generation-catalog/schema.ts";
import type { PartProjectionLookup } from "@/lib/parts/catalog-part-rows.ts";
import type { SortDirection, SortField } from "@/lib/parts/filter-sort.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { formatWeightRange, weightRangeOf } from "@/lib/parts/part-weight.ts";
import { slugify } from "@/lib/parts/slug.ts";

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

  return (
    <table>
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
              <td>{record.partType ? partTypeLabelFor(record.partType) : "—"}</td>
              <td>
                {part ? (
                  <Link href={`/parts/${slugify(part.nameEn)}`}>{localizedNameOf(part, locale)}</Link>
                ) : (
                  <Link href={`/parts/catalog/${encodeURIComponent(record.id)}`}>{record.name}</Link>
                )}
              </td>
              <td>{part ? part.stats.attack : "—"}</td>
              <td>{part ? part.stats.defense : "—"}</td>
              <td>{part ? part.stats.stamina : "—"}</td>
              <td>{isBit ? part.stats.xDash : "—"}</td>
              <td>{isBit ? part.stats.burstResistance : "—"}</td>
              <td>{weightRange ? formatWeightRange(weightRange) : "—"}</td>
              <td>{part?.releaseAt ?? "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
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
