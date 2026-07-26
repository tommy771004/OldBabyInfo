import type { Part } from "../parts/schema.ts";

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

function namesOf(part: Part): string[] {
  return [part.nameEn, part.nameJa, part.nameZhTw, ...part.aliases].filter(
    (s): s is string => Boolean(s),
  );
}

/**
 * Ticket 35: "與 Part 建立關聯；對不上者記錄而非猜測" — exact match only
 * (against nameEn/nameJa/nameZhTw/aliases), deliberately not the fuzzy
 * substring matching search-parts.ts uses for user-typed search. A wrong
 * guess here silently attaches a real physical-tolerance claim to the
 * wrong Part; returning `undefined` and letting the caller record it as
 * unmatched is always safer than a confident-looking wrong match.
 */
export function matchPartByName(partNameRaw: string, parts: Part[]): Part | undefined {
  const needle = normalize(partNameRaw);
  if (!needle) return undefined;
  return parts.find((part) => namesOf(part).some((name) => normalize(name) === needle));
}
