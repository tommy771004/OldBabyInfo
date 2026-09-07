"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { searchParts } from "@/lib/parts/search-parts.ts";
import { buildCompareQuery, canAddMore } from "@/lib/parts/compare-query.ts";
import { highestIndices } from "@/lib/parts/compare-highlight.ts";
import { PartSilhouette } from "@/components/part-silhouette.tsx";
import type { Locale } from "@/i18n/routing.ts";
import type { Part } from "@/lib/parts/schema.ts";

const STAT_ROWS = ["attack", "defense", "stamina", "xDash", "burstResistance"] as const;

function statValue(part: Part, field: (typeof STAT_ROWS)[number]): number | undefined {
  if (field === "attack" || field === "defense" || field === "stamina") {
    return part.stats[field];
  }
  return part.type === "bit" ? part.stats[field] : undefined;
}

function AddPartSearch({
  slugs,
  allParts,
  locale,
}: {
  slugs: string[];
  allParts: Part[];
  locale: Locale;
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
    <div>
      <label>
        <span>{t("add_label")}</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("add_placeholder")}
        />
      </label>
      {query.trim().length > 0 ? (
        candidates.length === 0 ? (
          <p>{t("no_matches")}</p>
        ) : (
          <ul>
            {candidates.map((part) => (
              <li key={part.id}>
                <Link
                  href={{
                    pathname: "/parts/compare",
                    query: buildCompareQuery([...slugs, slugify(part.nameEn)]),
                  }}
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

export function CompareTable({
  parts,
  allParts,
  locale,
}: {
  parts: Part[];
  allParts: Part[];
  locale: Locale;
}) {
  const t = useTranslations("ComparePage");
  const tp = useTranslations("PartsPage");
  const slugs = parts.map((p) => slugify(p.nameEn));
  const showAddSlot = canAddMore(slugs);

  if (parts.length === 0) {
    return (
      <>
        <p>{t("empty")}</p>
        <AddPartSearch slugs={slugs} allParts={allParts} locale={locale} />
      </>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th />
            {parts.map((part) => (
              <th key={part.id}>
                <Link
                  href={{
                    pathname: "/parts/compare",
                    query: buildCompareQuery(slugs.filter((s) => s !== slugify(part.nameEn))),
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

          {STAT_ROWS.map((field) => {
            const values = parts.map((p) => statValue(p, field));
            const winners = highestIndices(values);
            return (
              <tr key={field}>
                <th scope="row">{tp(`stat_${field}`)}</th>
                {parts.map((part, i) => {
                  const v = statValue(part, field);
                  return (
                    <td key={part.id}>
                      {v === undefined ? (
                        "—"
                      ) : winners.has(i) ? (
                        <strong className="stat-value">{v}</strong>
                      ) : (
                        <span className="stat-value">{v}</span>
                      )}
                    </td>
                  );
                })}
                {showAddSlot ? <td /> : null}
              </tr>
            );
          })}

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
  );
}
