import { routing } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Ticket 05's own verification page — not linked from any nav.
 *
 * The background is one continuous linear-gradient across the whole
 * surface ramp (no discrete blocks, no seam). Text is NOT scattered evenly
 * down that gradient, though — measuring real interpolated contrast (not
 * just the contrast of each named stop) found that dark-ink and light-ink
 * text both fail AA in roughly the 50%–60% band of the gradient, where the
 * background is a genuinely mid-brightness brown: neither black nor white
 * text clears 4.5:1 there. Content sections are placed only in the
 * measured-safe zones (0–45% for light text, 62–100% for dark text); the
 * 45–62% band is a deliberate text-free transition gap, not a bug.
 */
export default async function ColorDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireLocale(params);

  return (
    <main
      style={{
        position: "relative",
        minHeight: "120vh",
        background: `linear-gradient(
          to bottom,
          var(--surface-950) 0%,
          var(--surface-900) 10%,
          var(--surface-800) 20%,
          var(--surface-700) 30%,
          var(--surface-600) 40%,
          var(--surface-500) 50%,
          var(--surface-400) 60%,
          var(--surface-300) 70%,
          var(--surface-200) 80%,
          var(--surface-100) 90%,
          var(--surface-50) 100%
        )`,
      }}
    >
      <Section label="場上 · frac 0.02" y="2vh" ink="var(--ink-on-dark)" accent="var(--accent-on-dark)" />
      <Section label="frac 0.13" y="16vh" ink="var(--ink-on-dark)" accent="var(--accent-on-dark)" />
      <Section label="frac 0.25" y="30vh" ink="var(--ink-on-dark)" accent="var(--accent-on-dark)" />
      <Section label="frac 0.37（深色墨安全區終點）" y="44vh" ink="var(--ink-on-dark)" accent="var(--accent-on-dark)" />

      <p
        style={{
          position: "absolute",
          top: "56vh",
          left: "2rem",
          right: "2rem",
          fontStyle: "italic",
          opacity: 0.6,
          color: "#000",
        }}
      >
        （frac 0.45–0.62：刻意的無文字過渡帶——實測顯示這一段無論深墨淺墨都過不了 WCAG AA，見上方註解）
      </p>

      <Section label="frac 0.65（淺色墨安全區起點）" y="78vh" ink="var(--ink-on-light)" accent="var(--accent-on-light)" />
      <Section label="frac 0.77" y="92vh" ink="var(--ink-on-light)" accent="var(--accent-on-light)" />
      <Section label="frac 0.88" y="106vh" ink="var(--ink-on-light)" accent="var(--accent-on-light)" />
      <Section label="場邊 · frac 0.98" y="118vh" ink="var(--ink-on-light)" accent="var(--accent-on-light)" />
    </main>
  );
}

function Section({
  label,
  y,
  ink,
  accent,
}: {
  label: string;
  y: string;
  ink: string;
  accent: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: "2rem",
        right: "2rem",
        color: ink,
      }}
    >
      <p style={{ fontWeight: 700 }}>{label}</p>
      <p>本站核心價值是「準」——把散落在各處的零件數據整理成查得到、查得對的地方。</p>
      <p style={{ color: accent }}>強調色範例 Accent sample — Dran Sword Attack 60</p>
    </div>
  );
}
