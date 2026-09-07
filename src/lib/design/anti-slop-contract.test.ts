import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function collectPublicCss(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (["color-demo", "styleguide"].includes(entry.name)) return [];
      return collectPublicCss(path);
    }
    return entry.name.endsWith(".css") ? [path] : [];
  });
}

const publicCssFiles = [
  join(process.cwd(), "src", "app", "globals.css"),
  ...collectPublicCss(join(process.cwd(), "src", "styles")),
  ...collectPublicCss(join(process.cwd(), "src", "app")),
  ...collectPublicCss(join(process.cwd(), "src", "components")),
]
  .filter((path, index, paths) => paths.indexOf(path) === index && statSync(path).isFile())
  .map((path) => [path.slice(process.cwd().length + 1), readFileSync(path, "utf8")] as const);

const publicCss = publicCssFiles.map(([, css]) => css).join("\n");

/**
 * The surfaces allowed to use depth treatments, and why each one is a
 * decision rather than a default.
 *
 * The blanket ban existed because glow/lift/blur applied as an ambient
 * house style is the single clearest slop tell. It is not a ban on the
 * techniques existing anywhere: a control that floats over live, scrolling
 * content has to say so physically, or it reads as debris lying on the page.
 * Both entries are the two halves of the site navigation and nothing else:
 * the phone-only pill floating above the page, and the top app bar the page
 * is scrolled under (owner-decided). Each samples what moves behind it and
 * says so with a specular edge; neither casts a shadow on its outer face.
 *
 * Material 3 does NOT widen this any further. M3's own current guidance is
 * that a raised surface is a `surface-container-*` tone rather than a cast
 * shadow, which is how every card, menu, chip and dialog surface on this
 * site is still drawn. The single shadow value that exists
 * (`--md-sys-elevation-level2`, m3.css) is consumed by the floating pill
 * alone — the top app bar takes the specular lip and no elevation, because a
 * full-width bar with a shadow under it is the ambient-depth tell this rule
 * is really aimed at. What the bar earned is translucency, not elevation,
 * and it earned it by becoming `position: sticky`: while it still scrolled
 * away there was nothing behind it to sample.
 */
const DEPTH_ALLOWED = [
  "src/components/mobile-nav.module.css",
  "src/components/site-header.module.css",
];

/**
 * Reveal-on-scroll is the other classic slop tell, because the usual
 * implementation hides content by default and hands its visibility to a
 * script. The rule here is not "no reveals" but "nothing is ever hidden
 * unless the browser can also animate it back": `opacity: 0` and
 * `translateY()` are allowed only inside `@keyframes` that sit behind BOTH
 * `@supports (animation-timeline: view())` and
 * `prefers-reduced-motion: no-preference`. A browser missing either gets no
 * animation at all and therefore fully visible content.
 */
function scrollMotionBlocks(css: string): string {
  const blocks = css.match(/@media \(prefers-reduced-motion: no-preference\)[\s\S]*?\n}\n/g) ?? [];
  return blocks.filter((block) => block.includes("@supports (animation-timeline: view())")).join("\n");
}

/**
 * The one movement that is not a reveal.
 *
 * Material 3's text field floats its label out of the input and onto the
 * outline once the field has focus or content (`m3-components.css`). That is
 * a transform on text which is fully readable in BOTH states — the resting
 * position is the lower one, so a browser that runs no transition at all
 * still shows a labelled field. It is the opposite of the failure this rule
 * exists to catch, so its rules are removed before the check rather than the
 * whole file being exempted.
 */
function floatingLabelRules(css: string): string[] {
  return css.match(/[^{}]*\.m3-field__label[^{}]*\{[^{}]*\}/g) ?? [];
}

/** Each block is removed on its own — joining them first and splitting on
 *  the concatenation only works when there is exactly one. */
function without(css: string, blocks: string[]): string {
  return blocks.reduce((rest, block) => block ? rest.split(block).join("\n") : rest, css);
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}


/**
 * `color-mix(in srgb, A p%, B)` over two opaque colours, which is what every
 * Material 3 role in `m3.css` is built from.
 */
function mix(a: string, percent: number, b: string): string {
  const channelsOf = (hex: string) => [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  const [ar, ag, ab] = channelsOf(a) as [number, number, number];
  const [br, bg, bb] = channelsOf(b) as [number, number, number];
  return "#" + [[ar, br], [ag, bg], [ab, bb]]
    .map(([from, to]) => Math.round(from! * percent + to! * (1 - percent)).toString(16).padStart(2, "0"))
    .join("");
}

/* The palette, verbatim from colors.css. */
const S950 = "#1a120d";
const S900 = "#241a13";
const S800 = "#33241a";
const S700 = "#493323";
const S300 = "#c7a37f";
const S200 = "#ddc2a3";
const S100 = "#eeddc4";
const S50 = "#faf1e9";
const ACCENT_LIGHT = "#8c3a19";
const ACCENT_DARK = "#e08a5c";
const STRIKE_LIGHT = "#b03426";
const STRIKE_DARK = "#f4614a";

/* 場邊: `surface` plus the container ramp text is allowed to land on. */
const LIGHT_SURFACES = [
  ["surface", S100],
  ["container-lowest", S50],
  ["container-low", mix(S200, 0.16, S100)],
  ["container", mix(S200, 0.32, S100)],
  ["container-high", mix(S200, 0.5, S100)],
  ["container-highest", mix(S200, 0.68, S100)],
] as const;

/* 場上: the same ramp read from the other end. */
const DARK_SURFACES = [
  ["surface", S950],
  ["container-low", mix(S900, 0.6, S950)],
  ["container", S900],
  ["container-high", mix(S800, 0.55, S900)],
  ["container-highest", S800],
] as const;

const M3_TEXT_PAIRINGS: Array<[string, string, string]> = [
  ...LIGHT_SURFACES.flatMap(([name, surface]) => [
    [S950, surface, `light on-surface / ${name}`],
    [mix(S950, 0.68, surface), surface, `light on-surface-variant / ${name}`],
    [ACCENT_LIGHT, surface, `light primary / ${name}`],
  ] as Array<[string, string, string]>),
  ...DARK_SURFACES.flatMap(([name, surface]) => [
    [S50, surface, `dark on-surface / ${name}`],
    [mix(S50, 0.78, surface), surface, `dark on-surface-variant / ${name}`],
    [ACCENT_DARK, surface, `dark primary / ${name}`],
    [STRIKE_DARK, surface, `dark error / ${name}`],
    [S300, surface, `dark secondary / ${name}`],
  ] as Array<[string, string, string]>),

  // Text ON a filled role.
  [S50, ACCENT_LIGHT, "light on-primary / primary"],
  [S50, S700, "light on-secondary / secondary"],
  [S50, STRIKE_LIGHT, "light on-error / error"],
  [S950, ACCENT_DARK, "dark on-primary / primary"],
  [S950, STRIKE_DARK, "dark on-error / error"],
  [S950, S300, "dark on-secondary / secondary"],

  // Text on a container role.
  [ACCENT_LIGHT, mix(ACCENT_LIGHT, 0.18, S50), "light on-primary-container / primary-container"],
  [S700, mix(S700, 0.26, S50), "light on-secondary-container / secondary-container"],
  [S700, mix(STRIKE_LIGHT, 0.22, S50), "light on-tertiary-container / tertiary-container"],
  [
    mix(ACCENT_DARK, 0.6, S50),
    mix(ACCENT_DARK, 0.22, S800),
    "dark on-primary-container / primary-container",
  ],
  [S200, mix(S300, 0.18, S800), "dark on-secondary-container / secondary-container"],
  [S200, mix(STRIKE_DARK, 0.22, S800), "dark on-tertiary-container / tertiary-container"],

  // Error text is only ever allowed on the light end's two lightest steps —
  // it measures 3.98:1 on `container-highest`, which is why nothing puts it
  // there. This asserts the two placements that ARE used.
  [STRIKE_LIGHT, S100, "light error / surface"],
  [STRIKE_LIGHT, S50, "light error / container-lowest"],
];

const M3_OUTLINE_PAIRINGS: Array<[string, string, string]> = [
  ...LIGHT_SURFACES.map(([name, surface]) =>
    [mix(S950, 0.55, surface), surface, `light outline / ${name}`] as [string, string, string]),
  ...DARK_SURFACES.map(([name, surface]) =>
    [mix(S50, 0.48, surface), surface, `dark outline / ${name}`] as [string, string, string]),
];

describe("public visual contract", () => {
  it("keeps glow, lift and blur to the surfaces that earn them", () => {
    for (const [path, css] of publicCssFiles) {
      if (DEPTH_ALLOWED.includes(path)) continue;
      expect(css, path).not.toMatch(/(?:^|[;}])\s*(?:box-shadow|backdrop-filter)\s*:/m);
    }
  });

  it("never blurs the page itself", () => {
    // Backdrop sampling under a floating control is depth; blurring the
    // content is hiding it. The lookbehind is what keeps `backdrop-filter`
    // from tripping a rule aimed at `filter`.
    expect(publicCss).not.toMatch(/(?<![-\w])filter\s*:\s*[^;]*blur\s*\(/m);
  });

  it("hides content only where the browser can animate it back", () => {
    const guarded = publicCssFiles.map(([, css]) => scrollMotionBlocks(css)).join("\n");
    const unguarded = publicCssFiles
      .map(([, css]) => without(css, [scrollMotionBlocks(css), ...floatingLabelRules(css)]))
      .join("\n");

    expect(unguarded).not.toMatch(/transform\s*:\s*[^;]*translateY\s*\(/m);
    expect(unguarded).not.toMatch(/opacity\s*:\s*0(?:[;}]|\s*!important)/m);
    // And the reveal that does exist is a real scroll-driven one, not a
    // duration-based fade that a reduced-motion reader would still get.
    expect(guarded).toMatch(/animation-timeline:\s*view\(\)/);
  });

  it("keeps motion authored to the battle trajectory and visible without motion", () => {
    expect(publicCss).toMatch(/@keyframes\s+current-run/);
    expect(publicCss).toMatch(/prefers-reduced-motion:\s*reduce[\s\S]*\.trajectoryLeft::after[\s\S]*animation:\s*none/);
  });

  it("keeps the chosen warm palette readable at its text-bearing ends", () => {
    for (const background of ["#1a120d", "#241a13", "#33241a"]) {
      expect(contrastRatio("#faf1e9", background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio("#e08a5c", background)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio("#8c3a19", "#eeddc4")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#1a120d", "#eeddc4")).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * The Material 3 colour roles (m3.css) are `color-mix()` of the palette
   * above, so the browser resolves them and nothing in the source says what
   * they actually measure. These reproduce that mix and assert the pairings
   * that carry text — the numbers in m3.css's comments are these numbers,
   * and a nudge to any mix percentage that quietly drops one under AA fails
   * here instead of shipping.
   */
  it("keeps every Material 3 role pairing that carries text above AA", () => {
    for (const [foreground, background, label] of M3_TEXT_PAIRINGS) {
      expect(contrastRatio(foreground, background), label).toBeGreaterThanOrEqual(4.5);
    }
  });

  /** M3 asks a non-text outline to clear 3:1 against what it sits on. */
  it("keeps outlines distinguishable from the surface they enclose", () => {
    for (const [foreground, background, label] of M3_OUTLINE_PAIRINGS) {
      expect(contrastRatio(foreground, background), label).toBeGreaterThanOrEqual(3);
    }
  });
});
