/**
 * Navigation glyphs for the icon-only mobile bar. Same family as the
 * playstyle symbols (type-symbols.tsx) and the diagonal arrow: one 24×24
 * grid, one stroke weight, rounded caps, no fill and no container — the
 * container is the nav button itself.
 *
 * The Parts glyph reuses the site's own geometry (the stadium's concentric
 * rings, read here as a Blade from above) rather than a generic cog, so the
 * bar stays inside the one visual language ADR-0006 asks for.
 */
export type NavIconName = "home" | "parts" | "events" | "discussion" | "login" | "terms";

const PATHS: Record<NavIconName, React.ReactNode> = {
  home: (
    <>
      <path d="M3.6 10.4 L12 3.6 L20.4 10.4 V19.2 a1.2 1.2 0 0 1 -1.2 1.2 H4.8 a1.2 1.2 0 0 1 -1.2 -1.2 Z" />
      <path d="M9.6 20.4 V14.4 h4.8 v6" />
    </>
  ),
  parts: (
    <>
      <path d="M12 3.4 L19.6 8 V16 L12 20.6 L4.4 16 V8 Z" />
      <circle cx="12" cy="12" r="3.1" />
    </>
  ),
  events: (
    <>
      <rect x="3.6" y="5.4" width="16.8" height="15" rx="2.4" />
      <path d="M3.6 10.2 H20.4" />
      <path d="M8.4 3.4 V7" />
      <path d="M15.6 3.4 V7" />
      <path d="M8.2 14.6 H12" />
    </>
  ),
  discussion: (
    <>
      <path d="M20.4 13.2 a8.4 7.2 0 1 1 -3.6 -5.9" />
      <path d="M20.4 13.2 a8.4 7.2 0 0 1 -8.4 7.2 a9.6 9.6 0 0 1 -2.6 -0.35 L4.8 21.4 L6 17.4" />
      <path d="M9 12.6 h6" />
    </>
  ),
  login: (
    <>
      <path d="M13.8 3.6 H18 a2.4 2.4 0 0 1 2.4 2.4 V18 a2.4 2.4 0 0 1 -2.4 2.4 h-4.2" />
      <path d="M9.6 16.2 L13.8 12 L9.6 7.8" />
      <path d="M13.8 12 H3.6" />
    </>
  ),
  terms: (
    <>
      <path d="M6 3.6 H14.4 L19.2 8.4 V20.4 H6 Z" />
      <path d="M14.4 3.6 V8.4 H19.2" />
      <path d="M9 13.2 H16.2" />
      <path d="M9 16.8 H13.8" />
    </>
  ),
};

export function NavIcon({ name, size = 24 }: { name: NavIconName; size?: number }) {
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
      {PATHS[name]}
    </svg>
  );
}
