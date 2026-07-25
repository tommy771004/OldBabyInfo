import { describe, expect, it } from "vitest";
import { arcPath, polarPoint } from "./svg-arc";

describe("polarPoint", () => {
  it("places 0° due right of center", () => {
    const p = polarPoint(0, 0, 10, 0);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(0);
  });

  it("places 90° straight up (negative y in SVG's down-positive space)", () => {
    const p = polarPoint(0, 0, 10, 90);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(-10);
  });

  it("places 180° due left", () => {
    const p = polarPoint(0, 0, 10, 180);
    expect(p.x).toBeCloseTo(-10);
    expect(p.y).toBeCloseTo(0);
  });
});

describe("arcPath", () => {
  it("produces a path string starting with M and containing an A command", () => {
    const d = arcPath(0, 0, 10, 0, 90);
    expect(d.startsWith("M")).toBe(true);
    expect(d).toContain("A");
  });

  it("starts at the start angle's point and ends at the end angle's point", () => {
    const d = arcPath(0, 0, 10, 0, 90);
    const start = polarPoint(0, 0, 10, 0);
    const end = polarPoint(0, 0, 10, 90);
    expect(d).toContain(`${start.x.toFixed(2)},${start.y.toFixed(2)}`);
    expect(d).toContain(`${end.x.toFixed(2)},${end.y.toFixed(2)}`);
  });
});
