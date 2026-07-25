const SKU_PREFIX = /^<b>[^<]*<\/b>\s*/;
const PLACEHOLDER_GLYPHS = new Set(["■", "◾️", ""]);

/**
 * MasterData.json's localized `name` field is a full retail product title
 * ("<b>BX-01</b> 蒼龍神劍"), not a clean base name. Empirically, the
 * EARLIEST-released SKU in a group consistently carries the plainest title
 * (later reissues add colorway/edition suffixes) — see ADR-0007's sibling
 * finding on Stat Edition. This strips only the reliable part: the leading
 * SKU-code tag. A parenthetical reading (e.g. "F（フラット）") is kept —
 * it's real information about how the short code reads, not decoration.
 */
export function cleanLocalizedName(raw: string): string | null {
  if (PLACEHOLDER_GLYPHS.has(raw)) return null;
  const cleaned = raw.replace(SKU_PREFIX, "").trim();
  return cleaned.length > 0 ? cleaned : null;
}
