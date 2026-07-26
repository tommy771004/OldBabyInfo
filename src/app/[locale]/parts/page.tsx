import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getAllParts } from "@/lib/parts/repository.ts";
import {
  getGenerationCatalogSnapshot,
} from "@/lib/generation-catalog/repository.ts";
import { generationIdSchema, type GenerationId } from "@/lib/generation-catalog/schema.ts";
import { GenerationCatalogBrowser } from "@/components/generation-catalog-browser.tsx";
import { filterByType, sortParts, type PartType } from "@/lib/parts/filter-sort.ts";
import { parseFilterSortParams, type FilterSortState } from "@/lib/parts/parse-filter-sort-params.ts";
import { buildQuery } from "@/lib/parts/build-query.ts";
import type { Part } from "@/lib/parts/schema.ts";
import { SearchableRows } from "./searchable-rows.tsx";
import styles from "./page.module.css";

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

  const catalogParams = await searchParams;
  const state = parseFilterSortParams(catalogParams);
  const catalogGeneration = firstParam(catalogParams.catalogGeneration);
  const selectedGeneration: GenerationId = generationIdSchema.safeParse(catalogGeneration).success
    ? catalogGeneration as GenerationId
    : "x";
  const selectedSystem = firstParam(catalogParams.catalogSystem);
  const selectedKind = firstParam(catalogParams.catalogKind);
  const catalogRecordId = firstParam(catalogParams.catalogRecordId);
  const catalog = getGenerationCatalogSnapshot();
  const filtered = filterByType(getAllParts(), state.type);
  const sorted = state.sort ? sortParts(filtered, state.sort, state.direction) : filtered;

  return (
    <PartsPageBody
      parts={sorted}
      locale={locale}
      state={state}
      catalog={catalog}
      selectedGeneration={selectedGeneration}
      selectedSystem={selectedSystem}
      selectedKind={selectedKind === "beyblade" || selectedKind === "part" ? selectedKind : undefined}
      selectedRecordId={catalogRecordId}
    />
  );
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function PartsPageBody({
  parts,
  locale,
  state,
  catalog,
  selectedGeneration,
  selectedSystem,
  selectedKind,
  selectedRecordId,
}: {
  parts: Part[];
  locale: Locale;
  state: FilterSortState;
  catalog: ReturnType<typeof getGenerationCatalogSnapshot>;
  selectedGeneration: GenerationId;
  selectedSystem?: string;
  selectedKind?: "beyblade" | "part";
  selectedRecordId?: string;
}) {
  const t = useTranslations("PartsPage");

  return (
    <main className={styles.page}>
      <h1>{t("title")}</h1>

      <GenerationCatalogBrowser
        locale={locale}
        generations={catalog.generations}
        systems={catalog.systems}
        records={catalog.records}
        selectedGeneration={selectedGeneration}
        selectedSystem={selectedSystem}
        selectedKind={selectedKind}
        selectedRecordId={selectedRecordId}
        labels={{
          heading: t("catalog_heading"),
          generationLabel: t("catalog_generation"),
          systemLabel: t("catalog_system"),
          kindLabel: t("catalog_kind"),
          allLabel: t("catalog_all"),
          beybladeLabel: t("catalog_beyblades"),
          partLabel: t("catalog_parts"),
          compositionHeading: t("catalog_composition"),
          containedByHeading: t("catalog_contained_by"),
          releasesHeading: t("catalog_releases"),
          releaseContentsHeading: t("catalog_release_contents"),
          releaseLabel: t("catalog_release"),
          equipmentLabel: t("catalog_equipment"),
        }}
      />

      <nav className={styles.filters} aria-label={t("type_all")}>
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
