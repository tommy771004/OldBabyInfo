import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Ticket 05's own verification page — not linked from any nav. Confirms two
 * things by construction, not by eye alone: (1) the field→sideline
 * transition is a single continuous CSS gradient (no discrete color blocks
 * that could show a seam), and (2) every text sample uses the ink/accent
 * variant appropriate to its position on the ramp.
 */
export default async function ColorDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);

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
      <Section label="場上 · surface-950" y="2vh" ink="var(--ink-on-dark)" accent="var(--accent-on-dark)" />
      <Section label="surface-800" y="20vh" ink="var(--ink-on-dark)" accent="var(--accent-on-dark)" />
      <Section label="surface-650（過渡帶起點）" y="38vh" ink="var(--ink-on-dark)" accent="var(--accent-on-dark)" />
      <Section label="surface-500（過渡帶中點）" y="50vh" ink="var(--ink-on-light)" accent="var(--accent-on-light)" />
      <Section label="surface-350（過渡帶終點）" y="63vh" ink="var(--ink-on-light)" accent="var(--accent-on-light)" />
      <Section label="surface-200" y="80vh" ink="var(--ink-on-light)" accent="var(--accent-on-light)" />
      <Section label="場邊 · surface-50" y="97vh" ink="var(--ink-on-light)" accent="var(--accent-on-light)" />
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
