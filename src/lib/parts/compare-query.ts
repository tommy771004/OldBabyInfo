const MAX_COMPARE = 4;

/**
 * The comparator's whole state lives in one query param (ticket 17: "比較
 * 組合反映於網址，可分享") — a comma-separated list of Part slugs. Capped
 * at 4 and deduplicated here, not just by UI discipline, so a hand-edited
 * or malformed URL can't produce a comparison wider than the ticket's own
 * "2 至 4" range allows.
 */
export function parseCompareSlugs(raw: string | string[] | undefined): string[] {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return [];
  const seen = new Set<string>();
  for (const slug of value.split(",")) {
    const trimmed = slug.trim();
    if (trimmed) seen.add(trimmed);
  }
  return [...seen].slice(0, MAX_COMPARE);
}

export function buildCompareQuery(slugs: string[]): Record<string, string> {
  const capped = slugs.slice(0, MAX_COMPARE);
  return capped.length > 0 ? { with: capped.join(",") } : {};
}

export function canAddMore(slugs: string[]): boolean {
  return slugs.length < MAX_COMPARE;
}
