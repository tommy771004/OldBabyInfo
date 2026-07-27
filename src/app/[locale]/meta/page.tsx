import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { Link } from "@/i18n/navigation.ts";
import { getComboAppearances } from "@/lib/combo-appearances-repository.ts";
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

  return <MetaStandingBody standings={standings} totalAppearances={appearances.length} locale={locale} />;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}

function MetaStandingBody({
  standings,
  totalAppearances,
  locale,
}: {
  standings: ComboMetaStanding[];
  totalAppearances: number;
  locale: Locale;
}) {
  const t = useTranslations("MetaStandingPage");

  return (
    <main className={styles.page}>
      <h1>{t("title")}</h1>
      <p className={styles.note}>{t("no_tier_list_note")}</p>

      {standings.length === 0 ? (
        <p className={styles.empty}>{t("empty_state_heading")} : {t("empty_state_body", { count: totalAppearances })}</p>
      ) : (
        <ul className={styles.standingList}>
          {standings.map((standing) => (
            <StandingRow key={standing.comboKey} standing={standing} locale={locale} />
          ))}
        </ul>
      )}
    </main>
  );
}

function StandingRow({ standing, locale }: { standing: ComboMetaStanding; locale: Locale }) {
  const t = useTranslations("MetaStandingPage");
  const { bladeId, ratchetId, bitId } = parseComboKey(standing.comboKey);
  const blade = getPartById(bladeId);
  const ratchet = getPartById(ratchetId);
  const bit = getPartById(bitId);

  return (
    <li className={styles.standing}>
      <h2 className={styles.comboName}>{[blade, ratchet, bit].filter(Boolean).map((part) => part!.nameEn).join(" / ")}</h2>
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
