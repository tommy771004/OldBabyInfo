import type { GenerationCatalogRecord } from "../generation-catalog/schema.ts";
import { sortValueOf, type SortDirection, type SortField } from "./filter-sort.ts";
import { weightSortValueOf } from "./part-weight.ts";
import type { Part } from "./schema.ts";

/**
 * The Catalog record is the identity; the X Part projection carries the
 * Stats. `/parts` shows one list built from both, so every helper here takes
 * the same lookup rather than a pre-joined row type — the Catalog record
 * stays the thing being filtered, sorted, and linked.
 */
export type PartProjectionLookup = (recordId: string) => Part | undefined;

/**
 * beybrew's MasterData ships a handful of records whose name never resolved
 * past a placeholder glyph — `master:BeybladePartsBlade:DRANSWORD` arrives
 * with `name: "■"`. The record is real, but a reader can't tell what it is,
 * so the public list leaves it out instead of publishing a row nobody can
 * name. Fixing the names belongs in the scraper, not here.
 */
const PLACEHOLDER_NAME = /^[\s■□◼◻▪▫�]*$/u;

export function isPublishableCatalogName(name: string): boolean {
  return !PLACEHOLDER_NAME.test(name);
}

export function publishableCatalogRecords(
  records: GenerationCatalogRecord[],
): GenerationCatalogRecord[] {
  return records.filter((record) => isPublishableCatalogName(record.name));
}

/**
 * An X Part record carries only its official English name, while the Chinese
 * and Japanese names live on the projected Part (ADR-0005: English name is
 * the key, aliases are the search layer). Folding the projection's names into
 * `aliases` is what lets the single Catalog search box find 蒼龍神劍 and
 * ドランソード, not just "Dran Sword" — the merged list would otherwise be
 * unsearchable in the two languages most of its readers use.
 */
export function withProjectedSearchAliases(
  records: GenerationCatalogRecord[],
  projectionFor: PartProjectionLookup,
): GenerationCatalogRecord[] {
  return records.map((record) => {
    const part = projectionFor(record.id);
    if (!part) return record;

    const projected = [part.nameEn, part.nameJa, part.nameZhTw, ...part.aliases].filter(
      (value): value is string => Boolean(value),
    );
    const merged = [...new Set([...record.aliases, ...projected])];
    return merged.length === record.aliases.length ? record : { ...record, aliases: merged };
  });
}

/**
 * Default order for the merged list: the Parts a reader came for — the ones
 * carrying X Stats — before the ones that can only ever show "—". Catalog
 * order runs alphabetically by Part kind, which would otherwise open the
 * page on 17 Assist Blades with an empty Stat row apiece.
 */
export function projectedRecordsFirst(
  records: GenerationCatalogRecord[],
  hasFacts: (record: GenerationCatalogRecord) => boolean,
): GenerationCatalogRecord[] {
  const answered = records.filter(hasFacts);
  const rest = records.filter((record) => !hasFacts(record));
  return answered.length === 0 || rest.length === 0 ? records : [...answered, ...rest];
}

/**
 * What one record is worth on one column, or nothing when it cannot answer.
 *
 * Taking a resolver rather than a Part is what lets complete Beyblades sort:
 * their Stats are the Combo their Parts make, not a Stat block of their own,
 * so a Part-shaped lookup returned undefined for all 228 of them and the
 * column headers on that tab were links that did nothing.
 */
export type CatalogSortValue = (record: GenerationCatalogRecord, field: SortField) => number | undefined;

/** The Part-backed resolver every Part tab uses. */
export function partSortValues(projectionFor: PartProjectionLookup): CatalogSortValue {
  return (record, field) => {
    const part = projectionFor(record.id);
    if (!part) return undefined;
    if (field === "weight") return weightSortValueOf(part);
    if (field === "releaseAt") return part.releaseAt === null ? undefined : Date.parse(part.releaseAt);
    return sortValueOf(part, field);
  };
}

/**
 * Sorting a list where only some rows can answer the column: a record with no
 * X projection, a Part nobody has weighed, a Part with no recorded release
 * date — each sinks to the bottom in both directions rather than pretending
 * to be a zero or an infinitely old date. An ascending sort must not open
 * with a screenful of "—".
 */
export function sortCatalogPartRecords(
  records: GenerationCatalogRecord[],
  valueFor: CatalogSortValue,
  field: SortField,
  direction: SortDirection,
): GenerationCatalogRecord[] {
  const factor = direction === "asc" ? 1 : -1;

  return [...records].sort((left, right) => {
    const leftValue = valueFor(left, field);
    const rightValue = valueFor(right, field);

    // Whatever cannot answer this column sinks in *both* directions rather
    // than pretending to be a zero or an infinitely old date. An ascending
    // sort must not open on a screenful of "—".
    if (leftValue === undefined && rightValue === undefined) return 0;
    if (leftValue === undefined) return 1;
    if (rightValue === undefined) return -1;
    if (leftValue === rightValue) return 0;
    return (leftValue - rightValue) * factor;
  });
}

/**
 * Fallback label for a Part kind the messages file doesn't name yet — the
 * Catalog spans four Generations and keeps gaining kinds, so an unnamed one
 * should read as "Energy Ring", never as the raw `energy_ring` key. Values
 * already written in Japanese (Burst's ドライバー) pass through untouched.
 */
export function humanizePartType(partType: string): string {
  return partType
    .split("_")
    .map((word) => (/^[a-z]/.test(word) ? word[0]!.toUpperCase() + word.slice(1) : word))
    .join(" ");
}
