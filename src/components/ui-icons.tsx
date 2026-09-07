/**
 * The glyphs Material 3's component slots ask for, drawn on the same grid as
 * the navigation icons (nav-icons.tsx) and the playstyle symbols: 24×24,
 * 1.7 stroke, rounded caps, no fill, no container.
 *
 * They are drawn here rather than imported for the reason ADR-0006 gives for
 * every other mark on this site — one geometry, one weight, one family. An
 * icon pack would put a second stroke weight next to the Blade silhouettes.
 *
 * `Check` is the one M3 genuinely requires: a selected filter chip carries a
 * leading check mark, and without it selection rests entirely on a 1.34:1
 * tonal step.
 */

function Glyph({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Leading mark on a selected M3 filter chip. */
export function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M4.8 12.6 L9.6 17.4 L19.2 6.6" />
    </Glyph>
  );
}

/** Leading mark in an M3 search bar. */
export function SearchIcon({ size = 24 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <circle cx="10.8" cy="10.8" r="6.6" />
      <path d="M15.6 15.6 L20.4 20.4" />
    </Glyph>
  );
}

/**
 * The trailing mark on a "keep going in this direction" link. Diagonal, not
 * horizontal — see diagonal-arrow.tsx, which this matches; the flat right
 * arrow is the stock component everybody ships.
 */
export function ChevronIcon({ size = 20 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M9 5.4 L15.6 12 L9 18.6" />
    </Glyph>
  );
}
