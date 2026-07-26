/**
 * The Funbox/B4 schedule sheets are hand-entered, and their 地址 / 年齡分組
 * columns carry real inconsistencies that would otherwise surface as
 * duplicate filter options. Normalisation happens at the filter layer
 * only — `Event.venueAddress` / `Event.ageCategory` keep their original
 * source text, because the row a reader sees should still match the
 * sheet it came from.
 */

/** 臺 and 台 are the same character in practice; the sheets mix them
 *  freely (臺北市 4 rows vs 台北市 33). */
function unifyTai(value: string): string {
  return value.replace(/臺/g, "台");
}

/**
 * A 縣轄市 that shares its county's name, written without the county —
 * "宜蘭市羅東鎮…" is really 宜蘭縣. These are genuine same-place merges.
 *
 * Deliberately absent: 新竹市, 嘉義市, 基隆市. Those are 省轄市 — separate
 * administrative units from 新竹縣 / 嘉義縣, not county seats inside them.
 * Merging those would be a factual error, not a cleanup.
 */
const COUNTY_SEAT_TO_COUNTY: Record<string, string> = {
  宜蘭市: "宜蘭縣",
  花蓮市: "花蓮縣",
  台東市: "台東縣",
  屏東市: "屏東縣",
  彰化市: "彰化縣",
  苗栗市: "苗栗縣",
  南投市: "南投縣",
};

/**
 * Reads the 縣市 an address belongs to, or null when the address simply
 * doesn't start with one (15 real rows). Null is surfaced as a visible
 * "other" bucket rather than dropped — a real session must never vanish
 * from the calendar because its address was typed oddly.
 */
export function normalizeCity(venueAddress: string): string | null {
  const match = unifyTai(venueAddress.trim()).match(/^(.{1,3}?[市縣])/);
  if (!match) return null;
  const raw = match[1]!;
  return COUNTY_SEAT_TO_COUNTY[raw] ?? raw;
}

/**
 * "兒童 (6歲~12歲)" (3 rows) and "通常 (6~12歲)" (112 rows) describe the
 * same bracket with different wording. Everything else is left alone —
 * "公開 (6歲以上)" and "成人(12歲以上)" really are different brackets.
 */
const AGE_ALIASES: Record<string, string> = {
  "兒童 (6歲~12歲)": "通常 (6~12歲)",
};

export function normalizeAgeCategory(ageCategory: string): string {
  const trimmed = ageCategory.trim();
  return AGE_ALIASES[trimmed] ?? trimmed;
}
