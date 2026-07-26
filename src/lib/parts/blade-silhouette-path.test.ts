import { describe, expect, it } from "vitest";
import { bladeSilhouettePath } from "./blade-silhouette-path.ts";

describe("bladeSilhouettePath", () => {
  it("starts at the first outer tip, due right of center", () => {
    const d = bladeSilhouettePath(4, { cx: 32, cy: 32, outerRadius: 27 });
    expect(d.startsWith("M59.00,32.00")).toBe(true);
  });

  it("draws one curve segment per wing, closing the path", () => {
    const d4 = bladeSilhouettePath(4);
    const d6 = bladeSilhouettePath(6);
    expect(d4.match(/Q/g)).toHaveLength(4);
    expect(d6.match(/Q/g)).toHaveLength(6);
    expect(d4.endsWith("Z")).toBe(true);
  });

  it("never drops below 2 wings even for a nonsensical input", () => {
    const d = bladeSilhouettePath(0);
    expect(d.match(/Q/g)).toHaveLength(2);
  });

  it("keeps every point within the outer radius of the given center", () => {
    const cx = 32;
    const cy = 32;
    const outerRadius = 27;
    const d = bladeSilhouettePath(5, { cx, cy, outerRadius });
    const coords = [...d.matchAll(/(-?\d+\.\d+),(-?\d+\.\d+)/g)].map(
      (m): [number, number] => [Number(m[1]), Number(m[2])],
    );
    for (const [x, y] of coords) {
      const dist = Math.hypot(x - cx, y - cy);
      expect(dist).toBeLessThanOrEqual(outerRadius + 0.01);
    }
  });
});
