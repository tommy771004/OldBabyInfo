import type { Part } from "./schema.ts";

/** Case-insensitive, whitespace-insensitive — "Dran Sword" and "dransword"
 *  must match the same part. Full-width/half-width or IME quirks in ja/zh
 *  input are out of scope here; this is spacing/case tolerance only, not a
 *  general transliteration layer. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

function searchableStrings(part: Part): string[] {
  return [part.nameEn, part.nameJa, part.nameZhTw, ...part.aliases].filter(
    (s): s is string => Boolean(s),
  );
}

/**
 * Client-side only (ticket 11: no server round-trip) — searches across
 * nameEn/nameJa/nameZhTw/aliases regardless of the current UI language, so
 * a zh-TW visitor can still find a part by typing its English or Japanese
 * name. See ADR-0005.
 */
export function searchParts(parts: Part[], query: string): Part[] {
  const needle = normalize(query);
  if (needle.length === 0) return parts;

  return parts.filter((part) =>
    searchableStrings(part).some((candidate) => normalize(candidate).includes(needle)),
  );
}
