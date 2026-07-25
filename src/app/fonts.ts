import localFont from "next/font/local";

/**
 * Body face — Taipei Sans TC (JT Foundry, SIL OFL 1.1), subsetted to the
 * characters this site actually uses (UI strings + real Part/Event data —
 * see scripts/subset-taipei-sans-tc.py) rather than the official npm
 * package's per-Unicode-block split, which cost ~2.7MB on first load
 * because common characters scatter across many block boundaries. ~110KB
 * per weight instead. Re-run the script when new Chinese/Japanese text is
 * added so this keeps covering what's on the page.
 */
export const bodyFont = localFont({
  src: [
    { path: "../fonts/taipei-sans-tc-regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/taipei-sans-tc-bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

/**
 * Display face for headlines and stat numerals — see ticket 06. Combat:
 * a 2015 revival of a bold antique serif from a 1915 French anarchist
 * newspaper (Velvetyne, SIL OFL 1.1). Chosen over Terminal Grotesque,
 * Pilowlava, and BackOut after rendering all four against real headline
 * and numeral text — not picked by name. Self-hosted; not on the Google
 * Fonts rotation.
 */
export const displayFont = localFont({
  src: "../fonts/combat.woff2",
  variable: "--font-display",
  display: "swap",
});

/**
 * Accent-only face — pull quotes and source-citation notes, never UI
 * chrome or body copy (see ADR-0006). Iansui: Taiwan's first open-source
 * handwriting-derived kaishu, based on Klee One (ButTaiwan, free for any
 * use). Not subsetted — it's small-and-occasional by design, so it's only
 * fetched on the rare page that actually renders a quote, never preloaded.
 */
export const accentFont = localFont({
  src: "../fonts/iansui.woff2",
  variable: "--font-accent",
  display: "swap",
  preload: false,
});
