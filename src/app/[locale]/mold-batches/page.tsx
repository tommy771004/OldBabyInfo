import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation.ts";
import { routing, type Locale } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { MoldBatchLookup } from "@/components/mold-batch-lookup.tsx";
import { MoldBatchSourceGuidance } from "@/components/mold-batch-source-guidance.tsx";
import { getMoldBatchCoverage } from "@/lib/mold-batch/lookup.ts";
import { getMoldBatchGuidance } from "@/lib/mold-batch/guidance.ts";
import { getAllParts } from "@/lib/parts/repository.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import styles from "./mold-batches.module.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function MoldBatchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await requireLocale(params);

  const parts = getAllParts();
  const coverage = getMoldBatchCoverage(parts);
  const guidance = getMoldBatchGuidance()[0];
  if (!guidance) throw new Error("Mold Batch source guidance is missing");
  const partNames = Object.fromEntries(
    parts.map((part) => [part.id, localizedNameOf(part, locale)]),
  );

  return <MoldBatchesContent locale={locale} parts={parts} partNames={partNames} coverage={coverage} guidance={guidance} />;
}

function MoldBatchesContent({
  locale,
  parts,
  partNames,
  coverage,
  guidance,
}: {
  locale: Locale;
  parts: ReturnType<typeof getAllParts>;
  partNames: Record<string, string>;
  coverage: ReturnType<typeof getMoldBatchCoverage>;
  guidance: ReturnType<typeof getMoldBatchGuidance>[number];
}) {
  const t = useTranslations("MoldBatchPage");

  return (
    <main className={styles.page}>
      <p className={styles.backLink}>
        <Link href="/parts">{t("backToParts")}</Link>
      </p>
      <h1>{t("title")}</h1>

      <MoldBatchLookup
        parts={parts}
        partNames={partNames}
        labels={{
          searchLabel: t("searchLabel"),
          searchButton: t("searchButton"),
          emptyQuery: t("emptyQuery"),
          noMatches: t("noMatches"),
          coverage: t("coverage", coverage),
          source: t("source"),
        }}
      />

      <section className={styles.instructions} aria-labelledby="mold-batch-instructions">
        <h2 id="mold-batch-instructions">{t("instructionsHeading")}</h2>
        <p>{t("instructionsBody")}</p>
      </section>

      <div className={styles.sourceGuidance}>
        <MoldBatchSourceGuidance
          guidance={guidance}
          locale={locale}
          labels={{
            heading: t("sourceGuidanceHeading"),
            scope: t("sourceGuidanceScope"),
            excerpt: t("sourceGuidanceExcerpt"),
            discoverySource: t("sourceGuidanceDiscoverySource"),
            attribution: t("sourceGuidanceAttribution"),
            unattributed: t("sourceGuidanceUnattributed"),
            capturedAt: t("sourceGuidanceCapturedAt"),
          }}
        />
      </div>
    </main>
  );
}
