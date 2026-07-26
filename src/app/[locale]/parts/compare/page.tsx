import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { getAllParts, getPartBySlug } from "@/lib/parts/repository.ts";
import { parseCompareSlugs } from "@/lib/parts/compare-query.ts";
import { CompareTable } from "./compare-table.tsx";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Safe: the root layout already 404s on any locale outside `routing.locales`.
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);

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

  return (
    <main>
      <h1>{t("title")}</h1>
      <CompareTable parts={parts} allParts={allParts} locale={locale} />
    </main>
  );
}
