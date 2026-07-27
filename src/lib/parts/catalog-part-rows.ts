import type { GenerationCatalogRecord } from "../generation-catalog/schema.ts";
import { sortValueOf, type SortDirection, type SortField } from "./filter-sort.ts";
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
  projectionFor: PartProjectionLookup,
): GenerationCatalogRecord[] {
  const projected = records.filter((record) => projectionFor(record.id));
  const rest = records.filter((record) => !projectionFor(record.id));
  return projected.length === 0 || rest.length === 0 ? records : [...projected, ...rest];
}

/**
 * Sorting a list where only some rows carry Stats: a record with no X
 * projection has no value on any Stat or release axis at all, so it sinks to
 * the bottom in both directions rather than pretending to be a zero — an
 * ascending Attack sort must not open with a screenful of "—".
 */
export function sortCatalogPartRecords(
  records: GenerationCatalogRecord[],
  projectionFor: PartProjectionLookup,
  field: SortField,
  direction: SortDirection,
): GenerationCatalogRecord[] {
  const factor = direction === "asc" ? 1 : -1;

  return [...records].sort((left, right) => {
    const leftPart = projectionFor(left.id);
    const rightPart = projectionFor(right.id);
    if (!leftPart && !rightPart) return 0;
    if (!leftPart) return 1;
    if (!rightPart) return -1;

    const leftValue = sortValueOf(leftPart, field);
    const rightValue = sortValueOf(rightPart, field);
    // Equality first: two undated Parts both read -Infinity, and subtracting
    // those gives NaN, which sort() would treat as an arbitrary order.
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
