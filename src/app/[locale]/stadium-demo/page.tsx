import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { StadiumSignature } from "@/components/stadium-signature.tsx";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Ticket 07's own verification page — not linked from any nav. */
export default async function StadiumDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);

  return (
    <main style={{ padding: "4rem", display: "flex", gap: "3rem", flexWrap: "wrap" }}>
      <div style={{ width: 640 }}>
        <StadiumSignature />
      </div>
      <div style={{ width: 220 }}>
        <StadiumSignature />
      </div>
    </main>
  );
}
