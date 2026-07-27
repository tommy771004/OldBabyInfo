import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { Link } from "@/i18n/navigation.ts";
import { getAllGuides, getGuideBySlug } from "@/lib/guides/repository.ts";
import { extractHeadings } from "@/lib/guides/headings.ts";
import { pageMetadata } from "@/lib/seo.ts";
import styles from "./guide.module.css";

export function generateStaticParams() {
  // A locale with no guides yet contributes no params — nothing to
  // prerender, not an error (getAllGuides already handles that case).
  return routing.locales.flatMap((locale) =>
    getAllGuides(locale).map((guide) => ({ locale, slug: guide.slug })),
  );
}

/** Ticket 38: "每篇具備適當的頁面標題與描述，可被搜尋引擎正確索引" — the
 *  article's own frontmatter title/description become the real <title>
 *  and meta description, not the site-wide default from the root layout. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await requireLocale(params);
  const guide = getGuideBySlug(locale, slug);
  if (!guide) return {};
  return pageMetadata({
    locale,
    pathname: `/guides/${slug}`,
    title: guide.title,
    description: guide.description,
    alternateLocales: [locale],
  });
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await requireLocale(params);

  const guide = getGuideBySlug(locale, slug);
  if (!guide) notFound();

  const headings = extractHeadings(guide.content).filter((h) => h.level <= 3);

  return (
    <GuideDetailBody
      title={guide.title}
      description={guide.description}
      content={guide.content}
      headings={headings}
    />
  );
}

function GuideDetailBody({
  title,
  description,
  content,
  headings,
}: {
  title: string;
  description: string;
  content: string;
  headings: ReturnType<typeof extractHeadings>;
}) {
  const t = useTranslations("GuideDetailPage");

  return (
    <main className={styles.page}>
      <p>
        <Link href="/guides">{t("back_to_guides")}</Link>
      </p>

      <h1>{title}</h1>
      <p className={styles.description}>{description}</p>

      {headings.length > 0 ? (
        <nav aria-label={t("toc_heading")} className={styles.toc}>
          <p className={styles.tocHeading}>{t("toc_heading")}</p>
          <ul>
            {headings.map((h) => (
              <li key={h.slug} className={styles[`tocLevel${h.level}`]}>
                <a href={`#${h.slug}`}>{h.text}</a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <article className={styles.article}>
        <MDXRemote
          source={content}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }}
        />
      </article>
    </main>
  );
}
