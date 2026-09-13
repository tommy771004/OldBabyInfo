import { describe, expect, it } from "vitest";
import type { Part, ThreeStat } from "./schema.ts";
import { battlePath, BATTLE_RADIUS, compareBattle, compareStat, tugOfWar } from "./compare-battle.ts";
import { STADIUM_GEOMETRY } from "../stadium-geometry.ts";

const part = (stats: Partial<ThreeStat>) => ({ type: "blade", stats } as Part);
const left = part({ attack: 60, defense: 30, stamina: 40 });
const right = part({ attack: 45, defense: 55, stamina: 60 });

describe("compare tug-of-war geometry", () => {
  it("keeps both sides on one scale, including zero, decimals and values above 100", () => {
    expect(tugOfWar(8.5, 9.5)).toEqual({ left: 4.25, right: 4.75, axis: 100, lead: "right" });
    expect(tugOfWar(0, 0)).toEqual({ left: 0, right: 0, axis: 100, lead: "none" });
    expect(tugOfWar(120, 60)).toEqual({ left: 50, right: 25, axis: 120, lead: "left" });
    expect(tugOfWar(50, 50)?.lead).toBe("none");
  });

  it("does not turn absent/invalid Stats into zero or a winning side", () => {
    for (const value of [undefined, NaN, Infinity, -1]) {
      expect(compareStat(part({ attack: value }), "attack")).toBeUndefined();
    }
    expect(compareStat(left, "xDash")).toBeUndefined();
    expect(tugOfWar(60, undefined)).toBeUndefined();
  });
});

describe("Stat-driven comparison battle", () => {
  it("is deterministic and changes trajectories for each of Attack, Defense and Stamina", () => {
    const frames = compareBattle(left, right)!;
    expect(compareBattle(left, right)).toEqual(frames);
    expect(frames.some((frame) => frame.contact)).toBe(true);
    for (const field of ["attack", "defense", "stamina"] as const) {
      const changed = part({ ...left.stats, [field]: left.stats[field] + 20 });
      expect(battlePath(compareBattle(changed, right)!, 0)).not.toEqual(battlePath(frames, 0));
    }
  });

  it("only marks contact when the actual bodies meet and both eventually spin down", () => {
    const frames = compareBattle(left, right)!;
    for (const frame of frames) {
      for (const pose of frame.poses) {
        expect(Math.hypot(pose.x - 500, pose.y - 500)).toBeLessThanOrEqual(STADIUM_GEOMETRY.bowlRadius * 440 - BATTLE_RADIUS + 0.001);
        expect(Number.isFinite(pose.angle)).toBe(true);
      }
      if (frame.contact) {
        const [a, b] = frame.poses;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThanOrEqual(BATTLE_RADIUS * 2);
        expect(frame.contact.strength).toBeGreaterThan(0);
      }
    }
    expect(frames.at(-1)?.poses.map((pose) => pose.energy)).toEqual([0, 0]);
    expect(frames.at(-1)?.poses[0].angle).toBeLessThan(frames.at(-1)!.poses[1].angle);
  });

  it("leaves real zero attack stationary and refuses missing data", () => {
    const zero = part({ attack: 0, defense: 0, stamina: 40 });
    const frames = compareBattle(zero, zero)!;
    expect(frames.every((frame) => !frame.contact && frame.poses.every((pose) => pose.angle === 0))).toBe(true);
    expect(frames.at(-1)?.poses).toEqual(frames[0]?.poses);
    expect(compareBattle(part({ attack: 20, stamina: 30 }), right)).toBeUndefined();
    expect(compareBattle(part({ attack: NaN, defense: 20, stamina: 30 }), right)).toBeUndefined();
    expect(compareBattle(part({ attack: 50, defense: 20, stamina: 10000 }), right)).toBeUndefined();
  });
});
