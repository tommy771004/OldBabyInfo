/** A bare up-right arrow glyph — the default rightward CTA arrow is a slop
 * tell; this one is drawn on purpose and carries no container. */
export function DiagonalArrow({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12 L12 4" />
      <path d="M5.5 4 H12 V10.5" />
    </svg>
  );
}
