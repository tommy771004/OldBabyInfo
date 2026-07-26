import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation.ts";
import { getAllGuides } from "@/lib/guides/repository.ts";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function GuidesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Safe: the root layout already 404s on any locale outside `routing.locales`.
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);

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
