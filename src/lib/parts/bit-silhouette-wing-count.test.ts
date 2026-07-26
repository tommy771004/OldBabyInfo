import { describe, expect, it } from "vitest";
import { bitSilhouetteShape } from "./bit-silhouette-wing-count.ts";

describe("bitSilhouetteShape", () => {
  it("gives stamina a high wing count and a shallow scallop, so it reads as a near-circle", () => {
    const shape = bitSilhouetteShape("stamina");
    expect(shape.wingCount).toBeGreaterThanOrEqual(12);
    expect(shape.innerRatio).toBeGreaterThan(0.8);
  });

  it("gives each playstyle a distinct wing count", () => {
    const counts = (["attack", "defense", "balance", "stamina"] as const).map(
      (p) => bitSilhouetteShape(p).wingCount,
    );
    expect(new Set(counts).size).toBe(4);
  });
});
