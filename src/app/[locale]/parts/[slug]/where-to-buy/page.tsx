import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation.ts";
import { WhereToBuyList } from "@/components/where-to-buy-list.tsx";
import { createNeonStockListingReader } from "@/lib/stock/neon-store.ts";
import { getPartBySlug } from "@/lib/parts/repository.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { requireLocale } from "@/i18n/require-locale.ts";
import { slugify } from "@/lib/parts/slug.ts";
import styles from "./where-to-buy.module.css";

export const dynamic = "force-dynamic";

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
  const listings = reader ? await reader.listByPartId(part.id) : [];

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
      <h1>{t("title", { partName })}</h1>
      <p className={styles.intro}>{t("intro")}</p>
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
