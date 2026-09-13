import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { getAllParts, getPartBySlug } from "@/lib/parts/repository.ts";
import { parseCompareSlugs } from "@/lib/parts/compare-query.ts";
import { localizedSeoCopy, pageMetadata } from "@/lib/seo.ts";
import { CompareTable } from "./compare-table.tsx";
import { CompareDuel } from "./compare-duel.tsx";
import type { Part } from "@/lib/parts/schema.ts";
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
  return pageMetadata({ locale, pathname: "/parts/compare", ...localizedSeoCopy("compare", locale) });
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await requireLocale(params);

  const slugs = parseCompareSlugs((await searchParams).with);
  const parts = slugs
    .map((slug) => getPartBySlug(slug))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  return <ComparePageBody parts={parts} allParts={getAllParts()} locale={locale} />;
}

function ComparePageBody({
  parts,
  allParts,
  locale,
}: {
  parts: ReturnType<typeof getAllParts>;
  allParts: ReturnType<typeof getAllParts>;
  locale: Locale;
}) {
  const t = useTranslations("ComparePage");
  const duelParts = parts.length === 2 ? [parts[0]!, parts[1]!] as [Part, Part] : undefined;
  return (
    <main className={styles.page}>
      <h1>{t("title")}</h1>
      {duelParts ? (
        <CompareDuel parts={duelParts} allParts={allParts} locale={locale} />
      ) : (
        <CompareTable parts={parts} allParts={allParts} locale={locale} />
      )}
    </main>
  );
}
