import { describe, expect, it } from "vitest";
import { highestIndices } from "./compare-highlight.ts";

describe("highestIndices", () => {
  it("marks the single highest value", () => {
    expect(highestIndices([25, 65, 50])).toEqual(new Set([1]));
  });

  it("marks every tied column, not just the first", () => {
    expect(highestIndices([65, 30, 65])).toEqual(new Set([0, 2]));
  });

  it("never marks an inapplicable (undefined) stat as the winner", () => {
    // A Blade (no X-Dash) compared against a Bit that does have it —
    // the Blade's `undefined` must not somehow "win" as the max.
    expect(highestIndices([undefined, 35])).toEqual(new Set([1]));
  });

  it("returns an empty set when every value is inapplicable", () => {
    expect(highestIndices([undefined, undefined])).toEqual(new Set());
  });
});
