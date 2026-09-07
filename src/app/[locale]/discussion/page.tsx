import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { DiscussionFeed } from "@/components/discussion-feed.tsx";
import { routing, type Locale } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import styles from "./discussion.module.css";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { getAllParts } from "@/lib/parts/repository.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { getAllEvents } from "@/lib/events/repository.ts";
import { latestThreadsBySubject, type SubjectDescriptor } from "@/lib/discussion/feed.ts";
import { comboSubjectsForThreads } from "@/lib/discussion/combo-subjects.ts";
import { createNeonThreadReader } from "@/lib/discussion/neon-repository.ts";
import { optionalRead } from "@/lib/db/optional-read.ts";
import { localizedPath, localizedSeoCopy, pageMetadata } from "@/lib/seo.ts";

export const dynamic = "force-dynamic";

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
  const { locale } = await requireLocale(params);
  const connectionString = process.env.DATABASE_URL;
  const reader = connectionString ? createNeonThreadReader(connectionString) : undefined;
  const rows = reader
    ? await optionalRead("discussion feed", () => reader.listVisible(), [])
    : [];
  const threads = rows.map(({ thread }) => thread);
  const subjects = [
    ...subjectDescriptors(locale),
    ...comboSubjectsForThreads(threads, getAllParts(), locale),
  ];
  const items = latestThreadsBySubject(threads, subjects);
  return <DiscussionPageContent items={items} />;
}

function subjectDescriptors(locale: Locale): SubjectDescriptor[] {
  const partSubjects = getAllParts().map((part) => ({
    type: "part" as const,
    id: part.id,
    name: localizedNameOf(part, locale),
    href: localizedPath(locale, `/parts/${slugify(part.nameEn)}#discussion`),
  }));
  const eventSubjects = getAllEvents().map((event) => ({
    type: "event" as const,
    id: event.id,
    name: `${event.venueName} · ${event.date}`,
    href: localizedPath(locale, "/events"),
  }));
  return [...partSubjects, ...eventSubjects];
}

function DiscussionPageContent({ items }: { items: ReturnType<typeof latestThreadsBySubject> }) {
  const t = useTranslations("DiscussionPage");
  return (
    <main className={styles.page}>
      <h1>{t("title")}</h1>
      <DiscussionFeed
        items={items}
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
