import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getAllParts } from "@/lib/parts/repository.ts";
import { filterByType, sortParts, type PartType } from "@/lib/parts/filter-sort.ts";
import { parseFilterSortParams, type FilterSortState } from "@/lib/parts/parse-filter-sort-params.ts";
import { buildQuery } from "@/lib/parts/build-query.ts";
import type { Part } from "@/lib/parts/schema.ts";
import { SearchableRows } from "./searchable-rows.tsx";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const TYPES: PartType[] = ["blade", "ratchet", "bit"];

export default async function PartsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Safe: the root layout already 404s on any locale outside `routing.locales`.
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);

  const state = parseFilterSortParams(await searchParams);
  const filtered = filterByType(getAllParts(), state.type);
  const sorted = state.sort ? sortParts(filtered, state.sort, state.direction) : filtered;

  return <PartsPageBody parts={sorted} locale={locale} state={state} />;
}

function PartsPageBody({
  parts,
  locale,
  state,
}: {
  parts: Part[];
  locale: Locale;
  state: FilterSortState;
}) {
  const t = useTranslations("PartsPage");

  return (
    <main>
      <h1>{t("title")}</h1>

      <nav aria-label={t("type_all")}>
        <Link
          href={{ pathname: "/parts", query: buildQuery({ sort: state.sort, direction: state.direction }) }}
          aria-current={state.type === undefined ? "true" : undefined}
        >
          {t("type_all")}
        </Link>
        {TYPES.map((type) => (
          <Link
            key={type}
            href={{
              pathname: "/parts",
              query: buildQuery({ type, sort: state.sort, direction: state.direction }),
            }}
            aria-current={state.type === type ? "true" : undefined}
          >
            {t(`type_${type}`)}
          </Link>
        ))}
      </nav>

      <SearchableRows parts={parts} locale={locale} state={state} />
    </main>
  );
}
