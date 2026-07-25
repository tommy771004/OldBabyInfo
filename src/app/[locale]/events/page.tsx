import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { getAllEvents } from "@/lib/events/repository.ts";
import { splitByDate } from "@/lib/events/split-by-date.ts";
import type { Event } from "@/lib/events/schema.ts";

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
    <main>
      <h1>{t("title")}</h1>

      <section>
        <h2>{t("upcoming")}</h2>
        {upcoming.length === 0 ? (
          <p>{t("no_upcoming")}</p>
        ) : (
          <ul>
            {upcoming.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 ? (
        <details>
          <summary>
            {t("past")} ({past.length})
          </summary>
          <ul>
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
    <li>
      <span>{event.tier}</span>
      <span>{event.venueName}</span>
      <span>{event.venueAddress}</span>
      <span>
        {event.date} {event.time}
      </span>
      <span>{event.ageCategory}</span>
      <span>
        {t("capacity")}: {event.capacity}
      </span>
      <span>{t(`registration_${event.registrationMethod}`)}</span>
      <a href={event.sourceUrl}>{t("source")}</a>
    </li>
  );
}
