import type { Locale } from "@/i18n/routing.ts";

type Playstyle = "attack" | "defense" | "stamina" | "balance";

const LABEL: Record<Locale, Record<Playstyle, string>> = {
  "zh-TW": { attack: "攻擊型", defense: "防禦型", stamina: "持久型", balance: "平衡型" },
  ja: { attack: "アタックタイプ", defense: "ディフェンスタイプ", stamina: "スタミナタイプ", balance: "バランスタイプ" },
  en: { attack: "Attack type", defense: "Defense type", stamina: "Stamina type", balance: "Balance type" },
};

const STROKE = 6;
const SIZE = 32;

/**
 * The official four-way playstyle glyph set (ticket 13) — bare marks, no
 * tile/pill/box behind them. One shared grid (32×32), one stroke weight,
 * rounded caps throughout, so the four read as one family:
 *
 *   - Attack: a chevron breaking outward through the frame — piercing motion.
 *   - Defense: a closed hexagon — armor plating, nothing gets through.
 *   - Stamina: an open ring with a gap — continuous rotation, never fully closes.
 *   - Balance: a horizontal bar on a center pivot — literal equilibrium.
 *
 * Applies equally to a Blade's playstyle and a Bit's ground-contact
 * character — both carry the same four-value classification in the source
 * data (see schema.ts's playstyleSchema), not a separate taxonomy per part
 * type.
 */
export function PlaystyleSymbol({
  playstyle,
  locale,
}: {
  playstyle: Playstyle;
  locale: Locale;
}) {
  const label = LABEL[locale][playstyle];

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox="0 0 32 32"
      role="img"
      aria-label={label}
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {playstyle === "attack" && <path d="M8 6 L22 16 L8 26" />}
      {playstyle === "defense" && (
        <path d="M16 4 L27 10 V22 L16 28 L5 22 V10 Z" strokeLinejoin="round" />
      )}
      {playstyle === "stamina" && (
        <path d="M16 5 A11 11 0 1 1 6.5 21.5" strokeLinecap="round" />
      )}
      {playstyle === "balance" && (
        <>
          <line x1="16" y1="6" x2="16" y2="26" />
          <line x1="6" y1="10" x2="26" y2="10" />
        </>
      )}
    </svg>
  );
}

const HEIGHT_MIN = 50;
const HEIGHT_MAX = 85;

/**
 * Ratchet height, encoded as a bar-gauge glyph — the fill height scales
 * continuously with the real value (see schema.ts's height field, parsed
 * straight from the ratchet's own name) rather than snapping to arbitrary
 * short/medium/tall tiers.
 */
export function RatchetHeightSymbol({ height, locale }: { height: number; locale: Locale }) {
  const label =
    locale === "zh-TW"
      ? `固定高度 ${height}`
      : locale === "ja"
        ? `高さ ${height}`
        : `Height ${height}`;
  const clamped = Math.max(HEIGHT_MIN, Math.min(HEIGHT_MAX, height));
  const fillRatio = (clamped - HEIGHT_MIN) / (HEIGHT_MAX - HEIGHT_MIN);
  const barMaxHeight = 22;
  const barHeight = 4 + fillRatio * barMaxHeight;

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox="0 0 32 32"
      role="img"
      aria-label={label}
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
    >
      {/* Baseline the gauge sits on. */}
      <line x1="6" y1="27" x2="26" y2="27" />
      <line x1="16" y1={27 - barHeight} x2="16" y2="27" />
    </svg>
  );
}
