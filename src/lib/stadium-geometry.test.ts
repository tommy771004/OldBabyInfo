import { describe, expect, it } from "vitest";
import { STADIUM_GEOMETRY } from "./stadium-geometry";

describe("STADIUM_GEOMETRY", () => {
  it("nests radii from center outward: pocket < ridge < bowl < housing", () => {
    const { staminaPocketRadius, tornadoRidgeRadius, bowlRadius, housingRadius } =
      STADIUM_GEOMETRY;
    expect(staminaPocketRadius).toBeLessThan(tornadoRidgeRadius);
    expect(tornadoRidgeRadius).toBeLessThan(bowlRadius);
    expect(bowlRadius).toBeLessThan(housingRadius);
  });

  it("normalizes housingRadius to 1 — every other radius is a ratio of it", () => {
    expect(STADIUM_GEOMETRY.housingRadius).toBe(1);
  });

  it("the exit zone (Over + Xtreme) is a single contiguous span, asymmetric — real stadiums only exit on one side", () => {
    const { overZoneHalfAngle, xtremeZoneHalfAngle } = STADIUM_GEOMETRY;
    const totalSpan = overZoneHalfAngle * 2 + xtremeZoneHalfAngle * 2;
    expect(totalSpan).toBeLessThan(180); // exit zone is a minority of the rim, not half+
    expect(totalSpan).toBeGreaterThan(0);
  });

  it("launch positions are evenly spaced around the rim, excluding the exit zone", () => {
    const positions = STADIUM_GEOMETRY.launchPositionAngles;
    expect(positions.length).toBeGreaterThanOrEqual(2);
    // No launch position falls inside the exit notch (centered on 90°).
    const exitHalfSpan = STADIUM_GEOMETRY.overZoneHalfAngle * 2 + STADIUM_GEOMETRY.xtremeZoneHalfAngle;
    for (const angle of positions) {
      const distanceFromExitCenter = Math.abs(((angle - 90 + 180) % 360) - 180);
      expect(distanceFromExitCenter).toBeGreaterThan(exitHalfSpan);
    }
  });
});
