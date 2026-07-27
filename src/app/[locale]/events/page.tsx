import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { Link } from "@/i18n/navigation.ts";
import { getAllEvents } from "@/lib/events/repository.ts";
import {
  applyFilters,
  filterOptions,
  groupEvents,
  paginateDateGroups,
  splitScope,
  type CalendarFilters,
  type DateGroup,
  type Paged,
  type VenueGroup,
} from "@/lib/events/calendar.ts";
import { buildCalendarQuery, parseCalendarParams } from "@/lib/events/parse-calendar-params.ts";
import { localizedSeoCopy, pageMetadata } from "@/lib/seo.ts";
import { CalendarFilters as FilterForm } from "./calendar-filters.tsx";
import styles from "./page.module.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await requireLocale(params);
  return pageMetadata({ locale, pathname: "/events", ...localizedSeoCopy("events", locale) });
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireLocale(params);

  const filters = parseCalendarParams(await searchParams);
  const scoped = splitScope(getAllEvents(), todayIsoDate())[filters.scope];
  const options = filterOptions(scoped);
  const paged = paginateDateGroups(
    groupEvents(applyFilters(scoped, filters), filters.scope),
    filters.page,
  );

  return <EventsPageBody filters={filters} options={options} paged={paged} />;
}

function EventsPageBody({
  filters,
  options,
  paged,
}: {
  filters: CalendarFilters;
  options: ReturnType<typeof filterOptions>;
  paged: Paged;
}) {
  const t = useTranslations("EventsPage");

  const registrationLabels = Object.fromEntries(
    (["onsite", "online", "phone", "either", "store_community"] as const).map((method) => [
      method,
      t(`registration_${method}`),
    ]),
  );

  const hasActiveFilter =
    filters.city !== null || filters.registration !== null || filters.age !== null;

  return (
    <main className={styles.page}>
      <h1>{t("title")}</h1>

      <nav className={styles.scopeTabs} aria-label={t("title")}>
        {(["upcoming", "past"] as const).map((scope) => (
          <Link
            key={scope}
            href={{
              pathname: "/events",
              // Filters carry across the switch; page resets, because the
              // two scopes have different page counts.
              query: buildCalendarQuery({ ...filters, scope, page: 1 }),
            }}
            className={styles.scopeTab}
            aria-current={filters.scope === scope ? "page" : undefined}
          >
            {t(`scope_${scope}`)}
          </Link>
        ))}
      </nav>

      <FilterForm
        filters={filters}
        options={options}
        labels={{
          filtersLabel: t("filters_label"),
          city: t("filter_city"),
          registration: t("filter_registration"),
          age: t("filter_age"),
          all: t("filter_all"),
          apply: t("filter_apply"),
          cityOther: t("filter_city_other"),
          registrationLabels,
        }}
      />

      <p className={styles.resultSummary}>
        {t("result_summary", { dates: paged.totalDates, events: paged.totalEvents })}
        {hasActiveFilter ? (
          <>
            {" · "}
            <Link href={{ pathname: "/events", query: buildCalendarQuery({ scope: filters.scope }) }}>
              {t("filter_reset")}
            </Link>
          </>
        ) : null}
      </p>

      {paged.groups.length === 0 ? (
        <p className={styles.empty}>{t("no_results")}</p>
      ) : (
        <>
          <div className={styles.dateGroups}>
            {paged.groups.map((group) => (
              <DateSection key={group.date} group={group} />
            ))}
          </div>
          <Pagination filters={filters} paged={paged} />
        </>
      )}
    </main>
  );
}

/** Indexed by Date#getUTCDay(), so Sunday is 0. A literal tuple rather
 *  than a `weekday_${number}` template, which is too wide to be a valid
 *  message key. */
const WEEKDAY_KEYS = [
  "weekday_0",
  "weekday_1",
  "weekday_2",
  "weekday_3",
  "weekday_4",
  "weekday_5",
  "weekday_6",
] as const;

function DateSection({ group }: { group: DateGroup }) {
  const t = useTranslations("EventsPage");
  // Parsed as UTC so the weekday can't drift a day with the server's own
  // timezone — this is a calendar date, not an instant.
  const weekday = new Date(`${group.date}T00:00:00Z`).getUTCDay();

  return (
    <section className={styles.dateGroup}>
      <h2 className={styles.dateHeading}>
        <time dateTime={group.date}>{group.date}</time>
        <span className={styles.weekday}>{t(WEEKDAY_KEYS[weekday]!)}</span>
        <span className={styles.dayCount}>{t("day_events", { count: group.eventCount })}</span>
      </h2>

      {group.cities.map((cityGroup) => (
        <div key={cityGroup.city ?? "other"} className={styles.cityGroup}>
          <h3 className={styles.cityHeading}>{cityGroup.city ?? t("filter_city_other")}</h3>
          <ul className={styles.venueList}>
            {cityGroup.venues.map((venue) => (
              <VenueRow key={venue.venueName} venue={venue} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function VenueRow({ venue }: { venue: VenueGroup }) {
  const t = useTranslations("EventsPage");
  const registrations = [...new Set(venue.sessions.map((s) => s.registrationMethod))];

  return (
    <li className={styles.venue}>
      {/* The row itself is the disclosure trigger. A separate "詳細資訊"
          link per row would repeat the same label 431 times down the page
          and shrink the hit target to a few characters. */}
      <details className={styles.venueDetails}>
        <summary className={styles.venueMain} aria-label={`${venue.venueName} — ${t("venue_details")}`}>
          <span className={styles.venueName}>{venue.venueName}</span>
          <span className={styles.sessions}>
            {venue.sessions.map((session) => (
              <span key={session.id} className={styles.session}>
                <time dateTime={`${session.date}T${session.time}`}>{session.time}</time>
                <span className={styles.age}>{session.ageCategory}</span>
              </span>
            ))}
          </span>
          <span className={styles.registration}>
            {registrations.map((method) => t(`registration_${method}`)).join(" / ")}
          </span>
          <svg
            className={styles.chevron}
            viewBox="0 0 16 16"
            width="14"
            height="14"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6 L8 10 L12 6" />
          </svg>
        </summary>

        <div className={styles.venueDetailsBody}>
          <p className={styles.address}>{venue.venueAddress}</p>
          <ul className={styles.sessionFacts}>
            {venue.sessions.map((session) => (
              <li key={session.id}>
                {session.time} · {t("capacity")} {session.capacity} ·{" "}
                <a href={session.sourceUrl}>{t("source")}</a>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </li>
  );
}

function Pagination({ filters, paged }: { filters: CalendarFilters; paged: Paged }) {
  const t = useTranslations("EventsPage");
  if (paged.totalPages <= 1) return null;

  const pages = Array.from({ length: paged.totalPages }, (_, i) => i + 1);

  return (
    <nav
      className={styles.pagination}
      aria-label={t("page_status", { page: paged.page, totalPages: paged.totalPages })}
    >
      {paged.page > 1 ? (
        <Link
          href={{ pathname: "/events", query: buildCalendarQuery({ ...filters, page: paged.page - 1 }) }}
          rel="prev"
        >
          {t("page_previous")}
        </Link>
      ) : (
        <span className={styles.paginationDisabled}>{t("page_previous")}</span>
      )}

      <span className={styles.pageNumbers}>
        {pages.map((page) =>
          page === paged.page ? (
            <span key={page} className={styles.pageCurrent} aria-current="page">
              {page}
            </span>
          ) : (
            <Link
              key={page}
              href={{ pathname: "/events", query: buildCalendarQuery({ ...filters, page }) }}
              aria-label={t("page_goto", { page })}
            >
              {page}
            </Link>
          ),
        )}
      </span>

      {paged.page < paged.totalPages ? (
        <Link
          href={{ pathname: "/events", query: buildCalendarQuery({ ...filters, page: paged.page + 1 }) }}
          rel="next"
        >
          {t("page_next")}
        </Link>
      ) : (
        <span className={styles.paginationDisabled}>{t("page_next")}</span>
      )}
    </nav>
  );
}
