import { describe, expect, it } from "vitest";
import { ratchetInnerRadius } from "./ratchet-silhouette-path.ts";

describe("ratchetInnerRadius", () => {
  it("gives the shortest ratchet (height 50) the thinnest wall, biggest hole", () => {
    const r = ratchetInnerRadius(50, 27);
    expect(r).toBeCloseTo(27 - 4, 5);
  });

  it("gives the tallest ratchet (height 85) the thickest wall, smallest hole", () => {
    const r = ratchetInnerRadius(85, 27);
    expect(r).toBeCloseTo(27 - 15, 5);
  });

  it("scales monotonically between the two", () => {
    const short = ratchetInnerRadius(55, 27);
    const mid = ratchetInnerRadius(67.5, 27);
    const tall = ratchetInnerRadius(80, 27);
    expect(short).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(tall);
  });

  it("clamps a height outside the known real-world range instead of inverting the wall", () => {
    expect(ratchetInnerRadius(999, 27)).toBeCloseTo(27 - 15, 5);
    expect(ratchetInnerRadius(0, 27)).toBeCloseTo(27 - 4, 5);
  });
});
