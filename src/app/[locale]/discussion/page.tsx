import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { DiscussionFeed } from "@/components/discussion-feed.tsx";
import { routing } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import styles from "./discussion.module.css";
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
  return pageMetadata({ locale, pathname: "/discussion", ...localizedSeoCopy("discussion", locale) });
}

export default async function DiscussionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireLocale(params);
  return <DiscussionPageContent />;
}

function DiscussionPageContent() {
  const t = useTranslations("DiscussionPage");
  return (
    <main className={styles.page}>
      <h1>{t("title")}</h1>
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
