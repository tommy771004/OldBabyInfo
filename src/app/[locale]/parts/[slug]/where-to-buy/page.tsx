import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation.ts";
import { WhereToBuyList } from "@/components/where-to-buy-list.tsx";
import { createNeonStockListingReader } from "@/lib/stock/neon-store.ts";
import { getAllParts, getPartBySlug } from "@/lib/parts/repository.ts";
import { routing } from "@/i18n/routing";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { requireLocale } from "@/i18n/require-locale.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { pageMetadata } from "@/lib/seo.ts";
import { PageMasthead } from "@/components/page-masthead.tsx";
import styles from "./where-to-buy.module.css";
import { optionalRead } from "@/lib/db/optional-read.ts";

/* Shop listings may lag by up to five minutes, the same window as the Part
   page it belongs to (owner-decided, 2026-11-02). */
export const revalidate = 300;

/* Every page is built ahead of time, like the Part page above it. Building
   on first visit instead (an empty list here) cached `/en` and `/ja` but
   never the unprefixed zh-TW address, which reaches this route through the
   locale rewrite in middleware — measured on `next start`, 2026-11-02. The
   cost is one listings read per page at build when `DATABASE_URL` is set. */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllParts().map((part) => ({ locale, slug: slugify(part.nameEn) })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await requireLocale(params);
  const part = getPartBySlug(slug);
  if (!part) return {};
  const partName = localizedNameOf(part, locale);
  return pageMetadata({
    locale,
    pathname: `/parts/${slug}/where-to-buy`,
    title: `${partName} · Where to buy`,
    description: `Current retailer availability and price listings for ${partName}.`,
    noIndex: true,
  });
}

export default async function WhereToBuyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await requireLocale(params);
  const part = getPartBySlug(slug);
  if (!part) notFound();

  const connectionString = process.env.DATABASE_URL;
  const reader = connectionString ? createNeonStockListingReader(connectionString) : undefined;
  const listings = reader
    ? await optionalRead("where-to-buy listings", () => reader.listByPartId(part.id), [])
    : [];

  return (
    <WhereToBuyContent
      partName={localizedNameOf(part, locale)}
      partSlug={slugify(part.nameEn)}
      listings={listings}
      databaseConfigured={Boolean(connectionString)}
    />
  );
}

function WhereToBuyContent({
  partName,
  partSlug,
  listings,
  databaseConfigured,
}: {
  partName: string;
  partSlug: string;
  listings: Awaited<ReturnType<ReturnType<typeof createNeonStockListingReader>["listByPartId"]>>;
  databaseConfigured: boolean;
}) {
  const t = useTranslations("WhereToBuyPage");
  return (
    <main className={styles.page}>
      <p>
        <Link href={`/parts/${partSlug}`}>{t("backToPart")}</Link>
      </p>
      <PageMasthead title={t("title", { partName })} />
      {!databaseConfigured ? <p className={styles.notice}>{t("databaseUnavailable")}</p> : null}
      <WhereToBuyList
        listings={listings}
        labels={{
          price: t("price"),
          availability: t("availability"),
          inStock: t("inStock"),
          outOfStock: t("outOfStock"),
          unknownStock: t("unknownStock"),
          capturedAt: t("capturedAt"),
          visitRetailer: t("visitRetailer"),
          emptyHeading: t("emptyHeading"),
          emptyBody: t("emptyBody"),
        }}
      />
      <p className={styles.disclaimer}>{t("disclaimer")}</p>
    </main>
  );
}
