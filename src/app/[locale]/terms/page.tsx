import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import styles from "./terms.module.css";
import { localizedSeoCopy, pageMetadata } from "@/lib/seo.ts";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await requireLocale(params);
  return pageMetadata({ locale, pathname: "/terms", ...localizedSeoCopy("terms", locale) });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireLocale(params);
  const t = await getTranslations("TermsPage");

  return (
    <main className={styles.page}>
      <h1>{t("title")}</h1>
      <p className={styles.lede}>{t("lede")}</p>
      <section>
        <h2>{t("communityHeading")}</h2>
        <p>{t("communityBody")}</p>
      </section>
      <section>
        <h2>{t("dataHeading")}</h2>
        <p>{t("dataBody")}</p>
      </section>
      <section>
        <h2>{t("purchaseHeading")}</h2>
        <p>{t("purchaseBody")}</p>
      </section>
      <section>
        <h2>{t("reportHeading")}</h2>
        <p>{t("reportBody")}</p>
      </section>
    </main>
  );
}
