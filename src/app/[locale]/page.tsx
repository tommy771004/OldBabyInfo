import { hasLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation.ts";
import { BattleSearch } from "@/components/battle-search.tsx";
import { PlaystyleSymbol } from "@/components/type-symbols.tsx";
import { DiagonalArrow } from "@/components/diagonal-arrow.tsx";
import { LocaleSwitcher } from "@/components/locale-switcher.tsx";
import { getAllParts, getPartById, getPartImage } from "@/lib/parts/repository.ts";
import { defaultBattleCombos } from "@/lib/parts/battle-subjects.ts";
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
  // The layout's own `notFound()` can't be relied on here: layout and page
  // render concurrently, so a request like `/favicon.png` (a single segment
  // with a dot — the middleware matcher skips those) reaches this page with
  // `locale === "favicon.png"` and crashes on locale-keyed lookups such as
  // PlaystyleSymbol's LABEL[locale] before the layout's 404 lands.
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const parts = getAllParts();
  const topAttackBlade = sortParts(filterByType(parts, "blade"), "attack", "desc")[0];
  const topStaminaBit = sortParts(filterByType(parts, "bit"), "stamina", "desc")[0];
  const defaultLeft = getPartById("DRANSWORD") ?? topAttackBlade;
  const defaultRight = getPartById("COBALTDRAGOON") ?? topStaminaBit;
  const { upcoming } = splitByDate(getAllEvents(), todayIsoDate());
  const nextEvent = upcoming[0];

  return (
    <HomeContent
      locale={locale}
      allParts={parts}
      combos={defaultBattleCombos(parts)}
      partImages={Object.fromEntries(
        parts.flatMap((part) => {
          const image = getPartImage(part.id);
          return image ? [[part.id, image]] : [];
        }),
      )}
      topAttackBlade={defaultLeft}
      topStaminaBit={defaultRight}
      nextEvent={nextEvent}
    />
  );
}

function HomeContent({
  locale,
  allParts,
  combos,
  partImages,
  topAttackBlade,
  topStaminaBit,
  nextEvent,
}: {
  locale: Locale;
  allParts: Part[];
  combos: ReturnType<typeof defaultBattleCombos>;
  partImages: Record<string, { url: string; width: number; height: number }>;
  topAttackBlade: Part | undefined;
  topStaminaBit: Part | undefined;
  nextEvent: Event | undefined;
}) {
  const t = useTranslations("HomePage");
  const te = useTranslations("EventsPage");

  return (
    <main>
      <section className={styles.hero}>
        <BattleSearch
          allParts={allParts}
          combos={combos}
          initialLeft={topAttackBlade}
          initialRight={topStaminaBit}
          locale={locale}
          images={partImages}
          labels={{
            searchLabel: t("battle_search_label"),
            searchPlaceholder: t("battle_search_placeholder"),
            leftLabel: t("battle_left_label"),
            rightLabel: t("battle_right_label"),
            empty: t("battle_empty"),
            analysisLabel: t("battle_analysis_label"),
            versus: t("battle_versus"),
            statAttack: t("battle_stat_attack"),
            statDefense: t("battle_stat_defense"),
            statStamina: t("battle_stat_stamina"),
          }}
        />
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

      <div className={styles.transitionBand} aria-hidden="true" />

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <nav className={styles.footerLinks} aria-label={t("nav_label")}>
            <Link href="/parts">{t("nav_parts")}</Link>
            <Link href="/events">{t("nav_events")}</Link>
            <Link href="/discussion">{t("nav_discussion")}</Link>
            <Link href="/login">{t("nav_login")}</Link>
            <Link href="/terms">{t("nav_terms")}</Link>
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
