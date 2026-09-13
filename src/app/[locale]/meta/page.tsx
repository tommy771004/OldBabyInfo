import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { Link } from "@/i18n/navigation.ts";
import { getComboAppearances } from "@/lib/combo-appearances-repository.ts";
import type { ComboAppearanceRecord } from "@/lib/combo-appearances.ts";
import { safeExternalUrl } from "@/lib/security/external-url.ts";
import { computeMetaStandings, parseComboKey, type ComboMetaStanding } from "@/lib/meta-standing.ts";
import { getPartById } from "@/lib/parts/repository.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { localizedSeoCopy, pageMetadata } from "@/lib/seo.ts";
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
  return pageMetadata({ locale, pathname: "/meta", ...localizedSeoCopy("meta", locale) });
}

export default async function MetaStandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await requireLocale(params);

  const appearances = getComboAppearances();
  const standings = computeMetaStandings(appearances);

  return <MetaStandingBody standings={standings} appearances={appearances} locale={locale} />;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}

function MetaStandingBody({
  standings,
  appearances,
  locale,
}: {
  standings: ComboMetaStanding[];
  appearances: ComboAppearanceRecord[];
  locale: Locale;
}) {
  const t = useTranslations("MetaStandingPage");

  return (
    <main className={styles.page}>
      <h1>{t("title")}</h1>
      <p className={styles.intro}>{t("intro")}</p>
      <p className={styles.note}>{t("no_tier_list_note")}</p>
      <p className={styles.note}>{t("sample_scope_note")}</p>

      {standings.length === 0 ? (
        <section className={styles.empty}>
          <h2>{t("empty_state_heading")}</h2>
          <p>{t("empty_state_body", { count: appearances.length })}</p>
          <ul>
            <li><Link className="m3-button m3-button--tonal m3-state" href="/combo">{t("explore_combo")}</Link></li>
            <li><Link className="m3-button m3-button--text m3-state" href="/events">{t("explore_events")}</Link></li>
          </ul>
        </section>
      ) : (
        <ul className={styles.standingList}>
          {standings.map((standing) => (
            <StandingRow key={standing.comboKey} standing={standing} locale={locale} sources={appearances.filter((row) => row.comboKey === standing.comboKey)} />
          ))}
        </ul>
      )}
    </main>
  );
}

function StandingRow({ standing, locale, sources }: { standing: ComboMetaStanding; locale: Locale; sources: ComboAppearanceRecord[] }) {
  const t = useTranslations("MetaStandingPage");
  const { bladeId, ratchetId, bitId } = parseComboKey(standing.comboKey);
  const blade = getPartById(bladeId);
  const ratchet = getPartById(ratchetId);
  const bit = getPartById(bitId);

  return (
    <li className={styles.standing}>
      <h2 className={styles.comboName}>{[blade, ratchet, bit].filter(Boolean).map((part) => localizedNameOf(part!, locale)).join(" / ")}</h2>
      <dl className={styles.stats}>
        <dt>{t("sample_size_label")}</dt>
        <dd className="stat-value">{standing.sampleSize}</dd>

        <dt>{t("period_label")}</dt>
        <dd>
          {standing.periodStart} {t("period_to")} {standing.periodEnd}
        </dd>

        <dt>{t("usage_rate_label")}</dt>
        <dd className="stat-value">{formatPercent(standing.usageRate)}</dd>

        <dt>{t("top8_rate_label")}</dt>
        <dd className="stat-value">
          {standing.top8Rate.status === "computed"
            ? formatPercent(standing.top8Rate.value)
            : t("insufficient_data")}
        </dd>

        <dt>{t("champion_count_label")}</dt>
        <dd className="stat-value">
          {standing.championCount.status === "computed"
            ? standing.championCount.value
            : t("insufficient_data")}
        </dd>
      </dl>

      <details>
        <summary>{t("sources_heading")}</summary>
        <ul>
          {sources.map((source) => {
            const href = safeExternalUrl(source.sourceUrl);
            return (
              <li key={JSON.stringify([source.eventId, source.entryId])}>
                {href ? <a href={href} rel="noopener noreferrer">{source.eventDate} · {source.entryId}</a> : <span>{source.eventDate} · {source.entryId}</span>}
                <blockquote>{source.sourceExcerpt}</blockquote>
                <p>{t("captured_at")} <time dateTime={source.capturedAt}>{source.capturedAt}</time></p>
              </li>
            );
          })}
        </ul>
      </details>
      <details>
        <summary>{t("expand_parts")}</summary>
        <ul className={styles.parts}>
          {[blade, ratchet, bit].map((part) =>
            part ? (
              <li key={part.id}>
                <Link href={`/parts/${slugify(part.nameEn)}`}>{localizedNameOf(part, locale)}</Link>
              </li>
            ) : null,
          )}
        </ul>
      </details>
    </li>
  );
}
