import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import styles from "./terms.module.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
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
