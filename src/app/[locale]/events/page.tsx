import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { getAllEvents } from "@/lib/events/repository.ts";
import { splitByDate } from "@/lib/events/split-by-date.ts";
import type { Event } from "@/lib/events/schema.ts";
import styles from "./page.module.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Safe: the root layout already 404s on any locale outside `routing.locales`.
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);

  const { upcoming, past } = splitByDate(getAllEvents(), todayIsoDate());

  return <EventsPageBody upcoming={upcoming} past={past} />;
}

function EventsPageBody({ upcoming, past }: { upcoming: Event[]; past: Event[] }) {
  const t = useTranslations("EventsPage");

  return (
    <main className={styles.page}>
      <h1>{t("title")}</h1>
      <p className={styles.intro}>{t("intro")}</p>

      <section className={styles.section}>
        <h2>{t("upcoming")}</h2>
        {upcoming.length === 0 ? (
          <p>{t("no_upcoming")}</p>
        ) : (
          <ul className={styles.eventList}>
            {upcoming.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 ? (
        <details className={styles.past}>
          <summary>
            {t("past")} ({past.length})
          </summary>
          <ul className={styles.eventList}>
            {past.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        </details>
      ) : null}
    </main>
  );
}

function EventRow({ event }: { event: Event }) {
  const t = useTranslations("EventsPage");

  return (
    <li className={styles.event}>
      <div className={styles.eventTier}>{event.tier}</div>
      <div>
        <h3>{event.venueName}</h3>
        <p className={styles.address}>{event.venueAddress}</p>
        <p className={styles.meta}>{event.ageCategory}</p>
      </div>
      <div>
        <dl className={styles.details}>
          <dt>{t("date")}</dt>
          <dd><time dateTime={`${event.date}T${event.time}`}>{event.date} {event.time}</time></dd>
          <dt>{t("capacity")}</dt><dd>{event.capacity}</dd>
          <dt>{t("registration_label")}</dt><dd>{t(`registration_${event.registrationMethod}`)}</dd>
        </dl>
        <a className={styles.source} href={event.sourceUrl}>{t("source")}</a>
      </div>
    </li>
  );
}
