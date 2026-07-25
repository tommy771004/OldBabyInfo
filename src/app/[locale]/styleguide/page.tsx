import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { StadiumSignature } from "@/components/stadium-signature.tsx";
import { ColorSwatches } from "./color-swatches.tsx";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Internal design-system checkpoint (ticket 08) — never indexed, never linked from nav.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const SAMPLE = {
  "zh-TW": "台灣戰鬥陀螺 X 查詢工具",
  ja: "台湾のベイブレードX情報サイト",
  en: "Taiwan's Beyblade X reference site",
};

export default async function StyleguidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);

  return (
    <main style={{ padding: "3rem", display: "flex", flexDirection: "column", gap: "3rem" }}>
      <h1>Styleguide</h1>
      <p>
        內部驗收頁，不對外開放（noindex）。彙整 05／06／07 號票的產出——色彩、字體、signature——讓設計系統可以一次檢視，
        任何 token 變更都會直接反映在這裡，不需要另外維護一份靜態截圖。
      </p>

      <section>
        <h2>色彩 Color</h2>
        <p>
          連續色階與對比度驗證見獨立的 <code>/color-demo</code>（實測漸層中段文字禁區，詳見 ADR-0008）；這裡只列出色票本身。
        </p>
        <ColorSwatches />
      </section>

      <section>
        <h2>字體 Typography</h2>

        <h3>Display — Combat</h3>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 64, margin: 0 }}>OldBabyInfo</p>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 40, margin: 0 }}>Attack 60 · 23% · 312</p>

        <h3>Body — Taipei Sans TC</h3>
        {(["zh-TW", "ja", "en"] as const).map((loc) => (
          <div key={loc} style={{ marginBottom: 8 }}>
            <p style={{ fontFamily: "var(--font-body)", fontWeight: 400, fontSize: 18, margin: 0 }}>
              {SAMPLE[loc]}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 18, margin: 0 }}>
              {SAMPLE[loc]}
            </p>
          </div>
        ))}

        <h3>Accent — Iansui（僅點綴用途，例如引言）</h3>
        <p style={{ fontFamily: "var(--font-accent)", fontSize: 24, margin: 0 }}>
          「準」——把散落在各處的零件數據整理成查得到、查得對的地方。
        </p>
      </section>

      <section>
        <h2>Signature — 競技場俯視</h2>
        <p>不同尺寸下的完整縮放驗證見獨立的 <code>/stadium-demo</code>；這裡展示三種常見尺寸。</p>
        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ width: 480 }}>
            <StadiumSignature />
          </div>
          <div style={{ width: 240 }}>
            <StadiumSignature />
          </div>
          <div style={{ width: 96 }}>
            <StadiumSignature />
          </div>
        </div>
      </section>
    </main>
  );
}
