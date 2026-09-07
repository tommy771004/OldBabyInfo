import type { Locale } from "../../i18n/routing.ts";
import { comboKeyOf, parseComboKey } from "../meta-standing.ts";
import { buildComboQuery } from "../parts/combo-query.ts";
import { localizedNameOf } from "../parts/localized-name.ts";
import type { Part } from "../parts/schema.ts";
import { slugify } from "../parts/slug.ts";
import { localizedPath } from "../seo.ts";
import type { SubjectDescriptor } from "./feed.ts";
import type { Thread } from "./rules.ts";

/** Resolve only combos actually discussed, never the Parts Cartesian product. */
export function comboSubjectsForThreads(
  threads: readonly Thread[],
  parts: readonly Part[],
  locale: Locale,
): SubjectDescriptor[] {
  const byId = new Map(parts.map((part) => [part.id, part]));
  const ids = new Set(threads
    .filter((thread) => thread.subjectType === "combo" && thread.hiddenAt === null)
    .map((thread) => thread.subjectId));
  const subjects: SubjectDescriptor[] = [];

  for (const id of ids) {
    let key: ReturnType<typeof parseComboKey>;
    try {
      key = parseComboKey(id);
    } catch {
      continue;
    }
    // Reject extra segments rather than resolving a malformed/stale key to a
    // different combo. Part names and slugs are not substitutes for stable IDs.
    if (comboKeyOf(key.bladeId, key.ratchetId, key.bitId) !== id) continue;
    const blade = byId.get(key.bladeId);
    const ratchet = byId.get(key.ratchetId);
    const bit = byId.get(key.bitId);
    if (blade?.type !== "blade" || ratchet?.type !== "ratchet" || bit?.type !== "bit") continue;

    const query = new URLSearchParams(buildComboQuery({
      blade: slugify(blade.nameEn),
      ratchet: slugify(ratchet.nameEn),
      bit: slugify(bit.nameEn),
    }));
    subjects.push({
      type: "combo",
      id,
      name: [blade, ratchet, bit].map((part) => localizedNameOf(part, locale)).join(" / "),
      href: `${localizedPath(locale, "/combo")}?${query}`,
    });
  }
  return subjects;
}
