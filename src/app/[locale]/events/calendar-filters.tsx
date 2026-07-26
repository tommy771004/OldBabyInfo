"use client";

import { useRouter } from "@/i18n/navigation.ts";
import { OTHER_CITY, type CalendarFilters as Filters, type FilterOption } from "@/lib/events/calendar.ts";
import { buildCalendarQuery } from "@/lib/events/parse-calendar-params.ts";
import type { Event } from "@/lib/events/schema.ts";
import styles from "./page.module.css";

export interface CalendarFilterLabels {
  filtersLabel: string;
  city: string;
  registration: string;
  age: string;
  all: string;
  apply: string;
  cityOther: string;
  registrationLabels: Record<string, string>;
}

/**
 * A real GET <form>, so with JavaScript off the "套用" button submits and
 * the page re-renders from the URL like every other filter on this site.
 *
 * With JavaScript on, changing a <select> navigates immediately using the
 * same buildCalendarQuery the server-rendered links use — which keeps the
 * URL clean (`?city=高雄市`) instead of the raw form encoding
 * (`?scope=upcoming&city=高雄市&reg=&age=`) a plain submit would produce.
 *
 * A <select> rather than a row of links because 地區 alone has 20 real
 * options; sixty filter links would bury the page.
 *
 * `page` is deliberately never carried forward: changing a filter returns
 * to page 1, since page 6 of a freshly narrowed result set is usually empty.
 */
export function CalendarFilters({
  filters,
  options,
  labels,
}: {
  filters: Filters;
  options: { cities: FilterOption[]; registrations: FilterOption[]; ages: FilterOption[] };
  labels: CalendarFilterLabels;
}) {
  const router = useRouter();

  const navigate = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch, page: 1 };
    const query = buildCalendarQuery(next);
    const search = new URLSearchParams(query).toString();
    router.push(search ? `/events?${search}` : "/events");
  };

  return (
    <form method="get" className={styles.filters} aria-label={labels.filtersLabel}>
      {/* Carries the scope through a no-JS submit; the JS path passes it
          through `filters` instead. */}
      <input type="hidden" name="scope" value={filters.scope} />

      <label className={styles.filterField}>
        <span>{labels.city}</span>
        <select
          name="city"
          value={filters.city ?? ""}
          onChange={(e) => navigate({ city: e.target.value || null })}
        >
          <option value="">{labels.all}</option>
          {options.cities.map((option) => (
            <option key={option.value} value={option.value}>
              {(option.value === OTHER_CITY ? labels.cityOther : option.value) + ` (${option.count})`}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.filterField}>
        <span>{labels.registration}</span>
        <select
          name="reg"
          value={filters.registration ?? ""}
          onChange={(e) =>
            navigate({ registration: (e.target.value || null) as Event["registrationMethod"] | null })
          }
        >
          <option value="">{labels.all}</option>
          {options.registrations.map((option) => (
            <option key={option.value} value={option.value}>
              {(labels.registrationLabels[option.value] ?? option.value) + ` (${option.count})`}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.filterField}>
        <span>{labels.age}</span>
        <select
          name="age"
          value={filters.age ?? ""}
          onChange={(e) => navigate({ age: e.target.value || null })}
        >
          <option value="">{labels.all}</option>
          {options.ages.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value + ` (${option.count})`}
            </option>
          ))}
        </select>
      </label>

      {/* Only reachable without JS; the change handlers navigate before
          this would ever be needed. */}
      <noscript>
        <button type="submit" className={styles.filterApply}>
          {labels.apply}
        </button>
      </noscript>
    </form>
  );
}
