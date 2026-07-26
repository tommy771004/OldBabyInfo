export interface ComboSlugs {
  blade?: string;
  ratchet?: string;
  bit?: string;
}

/** The whole Combo lives in three query params (ticket 18: "Combo 反映於
 *  網址，可分享與重新載入") — one per slot, so clearing one slot never
 *  disturbs the other two. */
export function parseComboSlugs(searchParams: Record<string, string | string[] | undefined>): ComboSlugs {
  const pick = (key: string): string | undefined => {
    const v = searchParams[key];
    const value = Array.isArray(v) ? v[0] : v;
    return value && value.trim().length > 0 ? value : undefined;
  };
  return { blade: pick("blade"), ratchet: pick("ratchet"), bit: pick("bit") };
}

export function buildComboQuery(slugs: ComboSlugs): Record<string, string> {
  const query: Record<string, string> = {};
  if (slugs.blade) query.blade = slugs.blade;
  if (slugs.ratchet) query.ratchet = slugs.ratchet;
  if (slugs.bit) query.bit = slugs.bit;
  return query;
}
