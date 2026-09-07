import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { StadiumSignature } from "@/components/stadium-signature.tsx";
import { ColorSwatches } from "./color-swatches.tsx";
import { CheckIcon, SearchIcon } from "@/components/ui-icons.tsx";

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

/**
 * One render of the whole component kit. It is a function rather than markup
 * inlined twice so the light and dark passes cannot drift apart — the only
 * difference between them is the `.m3-dark` wrapper.
 */
function M3Kit() {
  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="m3-button m3-button--filled m3-state">Filled</button>
        <button type="button" className="m3-button m3-button--tonal m3-state">Tonal</button>
        <button type="button" className="m3-button m3-button--elevated m3-state">Elevated</button>
        <button type="button" className="m3-button m3-button--outlined m3-state">Outlined</button>
        <button type="button" className="m3-button m3-button--text m3-state">Text</button>
        <button type="button" className="m3-button m3-button--filled" disabled>Disabled</button>
        <span className="m3-icon-button m3-icon-button--tonal m3-state"><SearchIcon /></span>
      </div>

      <div className="m3-chip-set">
        <button type="button" className="m3-chip m3-chip--selected m3-state"><CheckIcon />Selected</button>
        <button type="button" className="m3-chip m3-state">Unselected</button>
        <button type="button" className="m3-chip m3-state">Bit<span className="m3-chip__count">52</span></button>
        <span className="m3-chip m3-chip--marked"><CheckIcon />Marked</span>
      </div>

      <nav className="m3-tabs" aria-label="Styleguide tabs">
        <span className="m3-tab m3-state" aria-current="page">陀螺<span className="m3-tab__count">185</span></span>
        <span className="m3-tab m3-state">零件<span className="m3-tab__count">295</span></span>
        <span className="m3-tab m3-state">發售版本<span className="m3-tab__count">235</span></span>
      </nav>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))", gap: "0.75rem" }}>
        <div className="m3-card">Filled card</div>
        <div className="m3-card m3-card--outlined">Outlined card</div>
        <div className="m3-card m3-card--elevated">Elevated card（tonal，不投影）</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))", gap: "0.75rem", alignItems: "start" }}>
        <label className="m3-field">
          <input className="m3-field__input" id="sg-field" placeholder="輸入零件名稱" />
          <span className="m3-field__label">搜尋零件庫</span>
        </label>
        <label className="m3-field m3-field--select">
          <select className="m3-field__input" id="sg-select" defaultValue="x">
            <option value="x">BEYBLADE X</option>
            <option value="burst">Beyblade Burst</option>
          </select>
          <span className="m3-field__label">世代</span>
        </label>
        <div className="m3-search-bar">
          <SearchIcon />
          <input placeholder="輸入中文、日文、英文或玩家俗稱" aria-label="Search bar sample" />
        </div>
      </div>

      <hr className="m3-divider" />

      <ul className="m3-list">
        <li className="m3-list-item m3-state">
          <span className="m3-list-item__headline">蒼龍神劍</span>
          <span className="m3-list-item__supporting">Dran Sword · Blade</span>
          <span className="m3-list-item__trailing">60</span>
        </li>
      </ul>
    </div>
  );
}

export default async function StyleguidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireLocale(params);

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
        <h2>Material 3 — 元件</h2>
        <p>
          設計語言是 Material 3（ADR-0014），配色仍是 ADR-0008 那一組暖色階：這裡的每個元件都不自帶顏色，
          全部從 <code>m3.css</code> 的 role 取值。下面同一組元件各渲染一次「場邊」與「場上」，
          <code>.m3-dark</code> 是唯一的差別——若某個元件在其中一端讀不出來，就是 role 對應錯了，不是元件錯了。
        </p>
        <M3Kit />
        <div className="m3-dark" style={{ padding: "1.5rem", borderRadius: 28, marginTop: "1.5rem" }}>
          <M3Kit />
        </div>
      </section>

      <section>
        <h2>Material 3 — 字級</h2>
        <p>M3 的 type scale，字體仍是 ADR-0006 指定的三套（Combat／Taipei Sans TC／Iansui）。</p>
        {([
          ["display-large", "m3-display-large"],
          ["display-small", "m3-display-small"],
          ["headline-large", "m3-headline-large"],
          ["headline-small", "m3-headline-small"],
          ["title-large", "m3-title-large"],
          ["title-medium", "m3-title-medium"],
          ["body-large", "m3-body-large"],
          ["body-medium", "m3-body-medium"],
          ["label-large", "m3-label-large"],
          ["label-medium", "m3-label-medium"],
        ] as const).map(([role, className]) => (
          <div key={role} style={{ display: "grid", gridTemplateColumns: "10rem 1fr", gap: "1rem", alignItems: "baseline", marginBottom: 6 }}>
            <code className="m3-label-medium m3-on-surface-variant">{role}</code>
            <span className={className}>零件庫 Dran Sword 60</span>
          </div>
        ))}
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
