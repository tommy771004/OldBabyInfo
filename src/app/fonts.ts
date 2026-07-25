import localFont from "next/font/local";

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
