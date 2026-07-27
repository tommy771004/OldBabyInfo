import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { JsonLd, localizedSeoCopy, pageMetadata, siteJsonLd } from "@/lib/seo.ts";
import { accentFont, bodyFont, displayFont } from "../fonts.ts";
import { SiteHeader } from "@/components/site-header.tsx";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await requireLocale(params);
  const copy = localizedSeoCopy("home", locale);
  return pageMetadata({ locale, pathname: "/", ...copy });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await requireLocale(params);
  const typedLocale: Locale = locale;

  return (
    <html
      lang={locale}
      className={`${bodyFont.variable} ${displayFont.variable} ${accentFont.variable}`}
    >
      <body>
        <JsonLd data={siteJsonLd(typedLocale)} />
        <NextIntlClientProvider>
          <SiteHeader />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
