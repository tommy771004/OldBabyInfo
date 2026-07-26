import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { getAllParts, getPartBySlug } from "@/lib/parts/repository.ts";
import { parseComboSlugs } from "@/lib/parts/combo-query.ts";
import type { Part } from "@/lib/parts/schema.ts";
import { ComboBuilder } from "./combo-builder.tsx";
import styles from "./page.module.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** A slug resolving to the wrong Part type (a hand-edited or stale URL)
 *  is treated the same as that slot being empty, never shown as a broken
 *  selection. */
function resolveSlot<T extends Part["type"]>(
  slug: string | undefined,
  type: T,
): Extract<Part, { type: T }> | undefined {
  if (!slug) return undefined;
  const part = getPartBySlug(slug);
  return part?.type === type ? (part as Extract<Part, { type: T }>) : undefined;
}

export default async function ComboPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Safe: the root layout already 404s on any locale outside `routing.locales`.
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);

  const slugs = parseComboSlugs(await searchParams);
  const blade = resolveSlot(slugs.blade, "blade");
  const ratchet = resolveSlot(slugs.ratchet, "ratchet");
  const bit = resolveSlot(slugs.bit, "bit");

  return (
    <ComboPageBody blade={blade} ratchet={ratchet} bit={bit} allParts={getAllParts()} locale={locale} />
  );
}

function ComboPageBody({
  blade,
  ratchet,
  bit,
  allParts,
  locale,
}: {
  blade: Part | undefined;
  ratchet: Part | undefined;
  bit: Part | undefined;
  allParts: Part[];
  locale: Locale;
}) {
  const t = useTranslations("ComboBuilderPage");

  return (
    <main className={styles.page}>
      <h1>{t("title")}</h1>
      <ComboBuilder blade={blade} ratchet={ratchet} bit={bit} allParts={allParts} locale={locale} />
    </main>
  );
}
