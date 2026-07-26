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

const publicCss = [
  join(process.cwd(), "src", "app", "globals.css"),
  join(process.cwd(), "src", "styles", "colors.css"),
  ...collectPublicCss(join(process.cwd(), "src", "app")),
  ...collectPublicCss(join(process.cwd(), "src", "components")),
]
  .filter((path, index, paths) => paths.indexOf(path) === index && statSync(path).isFile())
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

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
  it("does not ship the banned global glow, lift, blur or hidden-content treatments", () => {
    expect(publicCss).not.toMatch(/(?:^|[;}])\s*(?:box-shadow|backdrop-filter)\s*:/m);
    expect(publicCss).not.toMatch(/filter\s*:\s*[^;]*blur\s*\(/m);
    expect(publicCss).not.toMatch(/transform\s*:\s*[^;]*translateY\s*\(/m);
    expect(publicCss).not.toMatch(/opacity\s*:\s*0(?:[;}]|\s*!important)/m);
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
