import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { DiscussionFeed } from "@/components/discussion-feed.tsx";
import { routing, type Locale } from "@/i18n/routing";
import styles from "./discussion.module.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function DiscussionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  return <DiscussionPageContent />;
}

function DiscussionPageContent() {
  const t = useTranslations("DiscussionPage");
  return (
    <main className={styles.page}>
      <h1>{t("title")}</h1>
      <p className={styles.intro}>{t("intro")}</p>
      <DiscussionFeed
        items={[]}
        labels={{
          heading: t("feedHeading"),
          filterLabel: t("filterLabel"),
          all: t("all"),
          part: t("part"),
          combo: t("combo"),
          event: t("event"),
          emptyHeading: t("emptyHeading"),
          emptyBody: t("emptyBody"),
        }}
      />
    </main>
  );
}
