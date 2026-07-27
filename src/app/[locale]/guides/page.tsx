import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { Link } from "@/i18n/navigation.ts";
import { getAllGuides } from "@/lib/guides/repository.ts";
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

  return (
    <main>
      <h1>{t("title")}</h1>
      {guides.length === 0 ? (
        <p>{t("empty")}</p>
      ) : (
        <ul>
          {guides.map((guide) => (
            <li key={guide.slug}>
              <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
              <p>{guide.description}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
