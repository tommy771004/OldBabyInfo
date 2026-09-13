"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { searchParts } from "@/lib/parts/search-parts.ts";
import { buildCompareQuery } from "@/lib/parts/compare-query.ts";
import type { Locale } from "@/i18n/routing.ts";
import type { Part } from "@/lib/parts/schema.ts";
import { compareCopy } from "./compare-copy.ts";
import styles from "./page.module.css";

export function AddPartSearch({
  slugs,
  allParts,
  locale,
  replaceIndex,
}: {
  slugs: string[];
  allParts: Part[];
  locale: Locale;
  replaceIndex?: number;
}) {
  const t = useTranslations("ComparePage");
  const [query, setQuery] = useState("");

  const candidates = useMemo(() => {
    if (query.trim().length === 0) return [];
    return searchParts(allParts, query)
      .filter((p) => !slugs.includes(slugify(p.nameEn)))
      .slice(0, 8);
  }, [allParts, query, slugs]);

  return (
    <div className={styles.addSlot}>
      {/* M3 outlined text field; matches remain a plain list of links under
          it rather than a menu, because picking one navigates the page. */}
      <label className="m3-field">
        <input
          className="m3-field__input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("add_placeholder")}
        />
        <span className="m3-field__label">{replaceIndex === undefined ? t("add_label") : `${compareCopy[locale].replace} · ${replaceIndex === 0 ? compareCopy[locale].left : compareCopy[locale].right}`}</span>
      </label>
      {query.trim().length > 0 ? (
        candidates.length === 0 ? (
          <p className={styles.noMatches}>{t("no_matches")}</p>
        ) : (
          <ul className={styles.candidates}>
            {candidates.map((part) => (
              <li key={part.id}>
                <Link
                  className={`${styles.candidate} m3-state`}
                  href={{
                    pathname: "/parts/compare",
                    query: buildCompareQuery(replaceIndex === undefined
                      ? [...slugs, slugify(part.nameEn)]
                      : slugs.map((slug, index) => index === replaceIndex ? slugify(part.nameEn) : slug)),
                  }}
                  scroll={false}
                  onClick={() => setQuery("")}
                >
                  {localizedNameOf(part, locale)}
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
