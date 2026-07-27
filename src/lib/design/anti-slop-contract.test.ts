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
  join(process.cwd(), "src", "styles", "colors.css"),
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
 * Both entries here are that case and nothing else — the phone-only floating
 * navigation and the corner sign-in that pairs with it.
 */
const DEPTH_ALLOWED = ["src/components/mobile-nav.module.css"];

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
      .map(([, css]) => css.split(scrollMotionBlocks(css) || "\u0000").join("\n"))
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
});
