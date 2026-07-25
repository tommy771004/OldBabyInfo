import type { Locale } from "@/i18n/routing.ts";
import type { Part } from "./schema.ts";

/**
 * The list/comparator surfaces show one name in the current UI language,
 * never all three at once (see ADR-0005) — falling back to the English
 * name, which every Part always has, rather than showing blank text.
 */
export function localizedNameOf(part: Part, locale: Locale): string {
  if (locale === "zh-TW") return part.nameZhTw ?? part.nameEn;
  if (locale === "ja") return part.nameJa ?? part.nameEn;
  return part.nameEn;
}
