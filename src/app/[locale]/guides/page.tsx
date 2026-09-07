import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { Link } from "@/i18n/navigation.ts";
import { getAllGuides } from "@/lib/guides/repository.ts";
import { GuidesRidge } from "@/components/guides-ridge.tsx";
import { localizedSeoCopy, pageMetadata } from "@/lib/seo.ts";
import styles from "./guides.module.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await requireLocale(params);
  return pageMetadata({ locale, pathname: "/guides", ...localizedSeoCopy("guides", locale) });
}

export default async function GuidesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await requireLocale(params);

  const guides = getAllGuides(locale);

  return <GuidesPageBody guides={guides} />;
}

function GuidesPageBody({ guides }: { guides: ReturnType<typeof getAllGuides> }) {
  const t = useTranslations("GuidesPage");
  const [entry, ...rest] = guides;

  return (
    <main className={styles.page}>
      <header className={styles.masthead}>
        <GuidesRidge className={styles.ridge} />
        <div className={styles.mastheadText}>
          <h1 className={styles.title}>{t("title")}</h1>
          {guides.length > 0 ? (
            <p className={styles.lead}>{t("lead", { count: guides.length })}</p>
          ) : null}
        </div>
      </header>

      {entry === undefined ? (
        <div className={styles.empty}>
          <p className={styles.emptyHeadline}>{t("empty")}</p>
          <p className={styles.emptyBody}>{t("empty_body")}</p>
        </div>
      ) : (
        <>
          {/* The entry point is lifted out of the list rather than being its
              first row: a newcomer's first question is where to start, and
              only one article answers it. */}
          <div className={`${styles.entry} current-border`}>
            <p className={styles.startHere}>{t("start_here")}</p>
            <GuideEntry guide={entry} sectionsLabel={t("sections_label")} />
          </div>

          {rest.length > 0 ? (
            <ol className={styles.path}>
              {rest.map((guide) => (
                <li key={guide.slug} className={styles.item}>
                  <GuideEntry guide={guide} sectionsLabel={t("sections_label")} />
                </li>
              ))}
            </ol>
          ) : null}
        </>
      )}
    </main>
  );
}

function GuideEntry({
  guide,
  sectionsLabel,
}: {
  guide: ReturnType<typeof getAllGuides>[number];
  sectionsLabel: string;
}) {
  return (
    <>
      <h2 className={styles.itemTitle}>
        <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
      </h2>
      <p className={styles.description}>{guide.description}</p>
      {guide.sections.length > 0 ? (
        <ul className={styles.sections} aria-label={sectionsLabel}>
          {guide.sections.map((section) => (
            <li key={section} className={styles.section}>
              {section}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
