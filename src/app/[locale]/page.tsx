import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation.ts";
import { SiteHeader } from "@/components/site-header.tsx";
import { StadiumSignature } from "@/components/stadium-signature.tsx";
import { PlaystyleSymbol } from "@/components/type-symbols.tsx";
import { DiagonalArrow } from "@/components/diagonal-arrow.tsx";
import { LocaleSwitcher } from "@/components/locale-switcher.tsx";
import { getAllParts } from "@/lib/parts/repository.ts";
import { filterByType, sortParts } from "@/lib/parts/filter-sort.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { getAllEvents } from "@/lib/events/repository.ts";
import { splitByDate } from "@/lib/events/split-by-date.ts";
import type { Part } from "@/lib/parts/schema.ts";
import type { Event } from "@/lib/events/schema.ts";
import styles from "./page.module.css";

const DATA_SOURCES = [
  { label: "beybladehub.app", href: "https://beybladehub.app/" },
  { label: "go-shoot.github.io/x", href: "https://go-shoot.github.io/x/" },
  {
    label: "hackmd @liangyutw",
    href: "https://hackmd.io/@liangyutw/beyblade-important-record",
  },
  { label: "yujinyuz/beybrew", href: "https://github.com/yujinyuz/beybrew" },
  { label: "Funbox", href: "https://shop.funbox.com.tw/categories/XI/KB" },
];

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Safe: the root layout already 404s on any locale outside `routing.locales`.
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);

  const parts = getAllParts();
  const topAttackBlade = sortParts(filterByType(parts, "blade"), "attack", "desc")[0];
  const topStaminaBit = sortParts(filterByType(parts, "bit"), "stamina", "desc")[0];
  const { upcoming } = splitByDate(getAllEvents(), todayIsoDate());
  const nextEvent = upcoming[0];

  return (
    <HomeContent
      locale={locale}
      partsCount={parts.length}
      eventsCount={upcoming.length}
      topAttackBlade={topAttackBlade}
      topStaminaBit={topStaminaBit}
      nextEvent={nextEvent}
    />
  );
}

function HomeContent({
  locale,
  partsCount,
  eventsCount,
  topAttackBlade,
  topStaminaBit,
  nextEvent,
}: {
  locale: Locale;
  partsCount: number;
  eventsCount: number;
  topAttackBlade: Part | undefined;
  topStaminaBit: Part | undefined;
  nextEvent: Event | undefined;
}) {
  const t = useTranslations("HomePage");
  const te = useTranslations("EventsPage");

  return (
    <main>
      <section className={styles.hero}>
        <SiteHeader />

        <div className={styles.heroArt}>
          <StadiumSignature />
        </div>

        <div className={styles.heroContent}>
          <h1>{t("hero_headline")}</h1>
          <p className={styles.heroLede}>{t("hero_lede")}</p>
          <Link href="/parts" className={styles.cta}>
            {t("cta_parts")}
            <DiagonalArrow />
          </Link>
          <p className={styles.statLine}>
            <span className="stat-value">{partsCount}</span>
            {t("stat_parts_label")}
            {" · "}
            <span className="stat-value">{eventsCount}</span>
            {t("stat_events_label")}
          </p>
        </div>
      </section>

      <section className={styles.partsSection}>
        <div className={styles.sectionInner}>
          <h2>{t("section_parts_heading")}</h2>
          <p className={styles.sectionLede}>{t("section_parts_lede")}</p>

          <div className={styles.partsGrid}>
            {topAttackBlade ? (
              <PartHighlight
                part={topAttackBlade}
                label={t("part_highlight_attack_label")}
                value={topAttackBlade.stats.attack}
                locale={locale}
              />
            ) : null}
            {topStaminaBit ? (
              <PartHighlight
                part={topStaminaBit}
                label={t("part_highlight_stamina_label")}
                value={topStaminaBit.stats.stamina}
                locale={locale}
              />
            ) : null}
          </div>

          <Link href="/parts" className={styles.textLink}>
            {t("view_all_parts")}
            <DiagonalArrow />
          </Link>
        </div>
      </section>

      <section className={styles.eventsSection}>
        <div className={styles.sectionInner}>
          <h2>{t("section_events_heading")}</h2>
          <p className={styles.sectionLede}>{t("section_events_lede")}</p>

          {nextEvent ? (
            <div className={styles.eventCard}>
              <span className={styles.eventTier}>{nextEvent.tier}</span>
              <dl className={styles.eventDetails}>
                <dt>{t("event_next_label")}</dt>
                <dd>
                  {nextEvent.venueName} · {nextEvent.date} {nextEvent.time}
                </dd>
                <dt>{te("capacity")}</dt>
                <dd>{nextEvent.capacity}</dd>
                <dt>{te("registration_label")}</dt>
                <dd>{te(`registration_${nextEvent.registrationMethod}`)}</dd>
                <dt>{te("source")}</dt>
                <dd>
                  <a href={nextEvent.sourceUrl}>{new URL(nextEvent.sourceUrl).hostname}</a>
                </dd>
              </dl>
            </div>
          ) : (
            <p>{te("no_upcoming")}</p>
          )}

          <Link href="/events" className={styles.textLink}>
            {t("view_all_events")}
            <DiagonalArrow />
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <nav className={styles.footerLinks} aria-label={t("nav_label")}>
            <Link href="/parts">{t("nav_parts")}</Link>
            <Link href="/events">{t("nav_events")}</Link>
          </nav>
          <LocaleSwitcher />
        </div>

        <p className={styles.footerSources}>
          {t("footer_sources_label")}
          {": "}
          {DATA_SOURCES.map((source, i) => (
            <span key={source.href}>
              {i > 0 ? "、" : ""}
              <a href={source.href}>{source.label}</a>
            </span>
          ))}
        </p>

        <p className={styles.footerColophon}>{t("footer_colophon")}</p>

        <p className={styles.footerWordmark} aria-hidden="true">
          OldBabyInfo
        </p>
      </footer>
    </main>
  );
}

function PartHighlight({
  part,
  label,
  value,
  locale,
}: {
  part: Part;
  label: string;
  value: number;
  locale: Locale;
}) {
  return (
    <div className={styles.partCard}>
      <span className={styles.partCardLabel}>{label}</span>
      <span className={styles.partCardValue}>
        {(part.type === "blade" || part.type === "bit") && part.playstyle ? (
          <PlaystyleSymbol playstyle={part.playstyle} locale={locale} />
        ) : null}
        {value}
      </span>
      <span className={styles.partCardName}>{localizedNameOf(part, locale)}</span>
    </div>
  );
}
