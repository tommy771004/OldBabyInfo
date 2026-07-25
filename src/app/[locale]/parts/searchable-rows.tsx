"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing.ts";
import { Link } from "@/i18n/navigation.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { searchParts } from "@/lib/parts/search-parts.ts";
import { buildQuery } from "@/lib/parts/build-query.ts";
import type { SortField } from "@/lib/parts/filter-sort.ts";
import type { FilterSortState } from "@/lib/parts/parse-filter-sort-params.ts";
import type { Part } from "@/lib/parts/schema.ts";

const STAT_FIELDS = ["attack", "defense", "stamina", "xDash", "burstResistance"] as const;

/**
 * Client-side only (ticket 11: no server round-trip). `parts` arrives
 * already type-filtered and sorted by the server (ticket 12, URL-driven —
 * that state stays shareable and works with zero JS); this component adds
 * a live text search on top, entirely in the browser.
 *
 * Owns the whole table (not just tbody): the zero-results message must
 * replace the table wholesale, and a `<p>` can't be a direct child of
 * `<table>` alongside `<thead>` — splitting head/body across the
 * server/client boundary made that HTML invalid on an empty search.
 */
export function SearchableRows({
  parts,
  locale,
  state,
}: {
  parts: Part[];
  locale: Locale;
  state: FilterSortState;
}) {
  const t = useTranslations("PartsPage");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => searchParts(parts, query), [parts, query]);

  return (
    <>
      <div>
        <label>
          <span>{t("search_label")}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_placeholder")}
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <p>{t("no_results")}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t("type_blade")}</th>
              <th>Name</th>
              {STAT_FIELDS.map((field) => (
                <th key={field}>
                  <SortLink field={field} state={state}>
                    {t(`stat_${field}`)}
                  </SortLink>
                </th>
              ))}
              <th>
                <SortLink field="releaseAt" state={state}>
                  {t("release_date")}
                </SortLink>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((part) => (
              <tr key={part.id}>
                <td>{t(`type_${part.type}`)}</td>
                <td>{localizedNameOf(part, locale)}</td>
                <td>{part.stats.attack}</td>
                <td>{part.stats.defense}</td>
                <td>{part.stats.stamina}</td>
                <td>{part.type === "bit" ? part.stats.xDash : "—"}</td>
                <td>{part.type === "bit" ? part.stats.burstResistance : "—"}</td>
                <td>{part.releaseAt ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function SortLink({
  field,
  state,
  children,
}: {
  field: SortField;
  state: FilterSortState;
  children: React.ReactNode;
}) {
  const isActive = state.sort === field;
  const nextDirection = isActive && state.direction === "asc" ? "desc" : "asc";

  return (
    <Link
      href={{
        pathname: "/parts",
        query: buildQuery({ type: state.type, sort: field, direction: nextDirection }),
      }}
      aria-current={isActive ? "true" : undefined}
    >
      {children}
      {isActive ? (state.direction === "asc" ? " ▲" : " ▼") : null}
    </Link>
  );
}
