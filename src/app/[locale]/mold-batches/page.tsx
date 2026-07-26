import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation.ts";
import { routing, type Locale } from "@/i18n/routing";
import { MoldBatchLookup } from "@/components/mold-batch-lookup.tsx";
import { getMoldBatchCoverage } from "@/lib/mold-batch/lookup.ts";
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
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);

  const parts = getAllParts();
  const coverage = getMoldBatchCoverage(parts);
  const partNames = Object.fromEntries(
    parts.map((part) => [part.id, localizedNameOf(part, locale)]),
  );

  return <MoldBatchesContent parts={parts} partNames={partNames} coverage={coverage} />;
}

function MoldBatchesContent({
  parts,
  partNames,
  coverage,
}: {
  parts: ReturnType<typeof getAllParts>;
  partNames: Record<string, string>;
  coverage: ReturnType<typeof getMoldBatchCoverage>;
}) {
  const t = useTranslations("MoldBatchPage");

  return (
    <main className={styles.page}>
      <p className={styles.backLink}>
        <Link href="/parts">{t("backToParts")}</Link>
      </p>
      <h1>{t("title")}</h1>
      <p className={styles.intro}>{t("intro")}</p>

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
    </main>
  );
}
