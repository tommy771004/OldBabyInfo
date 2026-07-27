import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { accentFont, bodyFont, displayFont } from "../fonts.ts";
import { SiteHeader } from "@/components/site-header.tsx";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "OldBabyInfo",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await requireLocale(params);

  return (
    <html
      lang={locale}
      className={`${bodyFont.variable} ${displayFont.variable} ${accentFont.variable}`}
    >
      <body>
        <NextIntlClientProvider>
          <SiteHeader />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
