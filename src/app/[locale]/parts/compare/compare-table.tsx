"use client";

import { useTranslations } from "next-intl";
import styles from "./page.module.css";
import { Link } from "@/i18n/navigation.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { buildCompareQuery, canAddMore } from "@/lib/parts/compare-query.ts";
import { PartSilhouette } from "@/components/part-silhouette.tsx";
import { AddPartSearch } from "./add-part-search.tsx";
import { CompareDuel } from "./compare-duel.tsx";
import type { Locale } from "@/i18n/routing.ts";
import type { Part } from "@/lib/parts/schema.ts";

const STAT_ROWS = ["attack", "defense", "stamina", "xDash", "burstResistance"] as const;

function statValue(part: Part, field: (typeof STAT_ROWS)[number]): number | undefined {
  if (field === "attack" || field === "defense" || field === "stamina") return part.stats[field];
  return part.type === "bit" ? part.stats[field] : undefined;
}

/**
 * Two Parts are the page's actual 1-vs-1 state. The older table remains the
 * honest fallback for a hand-authored URL containing one, three or four
 * Parts, where a single left/right winner would be misleading.
 */
export function CompareTable({
  parts,
  allParts,
  locale,
}: {
  parts: Part[];
  allParts: Part[];
  locale: Locale;
  // Kept optional for callers that still pass the former image lookup. The
  // duel uses verified Part silhouettes, not an invented product image.
  images?: Record<string, { url: string; width: number; height: number }>;
}) {
  const t = useTranslations("ComparePage");
  const tp = useTranslations("PartsPage");
  const slugs = parts.map((part) => slugify(part.nameEn));
  const showAddSlot = canAddMore(slugs);

  if (parts.length === 0) {
    return (
      <>
        <p className={styles.empty}>{t("empty")}</p>
        <AddPartSearch slugs={slugs} allParts={allParts} locale={locale} />
      </>
    );
  }

  if (parts.length === 2) {
    return <CompareDuel parts={parts as [Part, Part]} allParts={allParts} locale={locale} />;
  }

  return (
    <div className={styles.tableSection}>
      <div className={styles.scroll}>
        <table>
          <thead>
            <tr>
              <th />
              {parts.map((part) => (
                <th key={part.id}>
                  <Link
                    href={{
                      pathname: "/parts/compare",
                      query: buildCompareQuery(slugs.filter((slug) => slug !== slugify(part.nameEn))),
                    }}
                  >
                    {t("remove")}
                  </Link>
                </th>
              ))}
              {showAddSlot ? <th>{t("add_label")}</th> : null}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{t("row_name")}</th>
              {parts.map((part) => (
                <td key={part.id}>
                  <Link href={`/parts/${slugify(part.nameEn)}`}>{localizedNameOf(part, locale)}</Link>
                </td>
              ))}
              {showAddSlot ? <td /> : null}
            </tr>

            <tr>
              <th scope="row">{t("row_type")}</th>
              {parts.map((part) => (
                <td key={part.id}>{tp(`type_${part.type}`)}</td>
              ))}
              {showAddSlot ? <td /> : null}
            </tr>

            <tr>
              <th scope="row">{tp("silhouette_column")}</th>
              {parts.map((part) => (
                <td key={part.id}>
                  <PartSilhouette part={part} />
                </td>
              ))}
              {showAddSlot ? <td /> : null}
            </tr>

            {STAT_ROWS.map((field) => (
              <tr key={field}>
                <th scope="row">{tp(`stat_${field}`)}</th>
                {parts.map((part) => (
                  <td key={part.id}>{statValue(part, field) ?? "—"}</td>
                ))}
                {showAddSlot ? <td /> : null}
              </tr>
            ))}

            <tr>
              <th scope="row">{tp("release_date")}</th>
              {parts.map((part) => (
                <td key={part.id}>{part.releaseAt ?? "—"}</td>
              ))}
              {showAddSlot ? (
                <td>
                  <AddPartSearch slugs={slugs} allParts={allParts} locale={locale} />
                </td>
              ) : null}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
