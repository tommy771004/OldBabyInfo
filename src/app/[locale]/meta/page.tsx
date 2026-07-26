import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation.ts";
import { getComboAppearances } from "@/lib/combo-appearances-repository.ts";
import { computeMetaStandings, parseComboKey, type ComboMetaStanding } from "@/lib/meta-standing.ts";
import { getPartById } from "@/lib/parts/repository.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { slugify } from "@/lib/parts/slug.ts";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function MetaStandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Safe: the root layout already 404s on any locale outside `routing.locales`.
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);

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
    <main>
      <h1>{t("title")}</h1>
      <p>{t("intro")}</p>
      <p>{t("no_tier_list_note")}</p>

      {standings.length === 0 ? (
        <p>{t("empty_state_heading")} — {t("empty_state_body", { count: totalAppearances })}</p>
      ) : (
        <ul>
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
    <li>
      <dl>
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
        <ul>
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
