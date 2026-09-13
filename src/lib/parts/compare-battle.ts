import type { Part, ThreeStat } from "./schema.ts";
import { windDurationSeconds } from "./wind-speed.ts";
import { STADIUM_GEOMETRY } from "../stadium-geometry.ts";

export const COMPARE_STATS = ["attack", "defense", "stamina", "xDash", "burstResistance"] as const;
export type CompareStat = (typeof COMPARE_STATS)[number];

export function compareStat(part: Part, field: CompareStat): number | undefined {
  const value = field in part.stats ? (part.stats as Partial<Record<CompareStat, number>>)[field] : undefined;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function tugOfWar(left: number | undefined, right: number | undefined) {
  if (left === undefined || right === undefined) return undefined;
  // A common 100-point axis, expanded for values above 100 without clipping.
  const axis = Math.max(100, left, right);
  return { left: left / axis * 50, right: right / axis * 50, axis,
    lead: left === right ? "none" : left > right ? "left" : "right" };
}

export const BATTLE_STEP = 1 / 60;
export const BATTLE_RADIUS = 32;
const WALL = STADIUM_GEOMETRY.bowlRadius * 440 - BATTLE_RADIUS;
const LAUNCH = STADIUM_GEOMETRY.tornadoRidgeRadius * 440;
export interface BattlePose { x: number; y: number; angle: number; energy: number }
export interface BattleFrame {
  time: number;
  poses: [BattlePose, BattlePose];
  contact?: { x: number; y: number; strength: number };
}

/** A deterministic visual mapping of Stats, NOT measured physics or a match
 * predictor. Geometry and Attack rotation reuse the homepage primitives.
 * Attack supplies launch/centrifugal motion, Defense resists impact losses,
 * and Stamina sets the spin-down horizon. No randomness or missing-stat speed.
 * Coefficients below are drawing/time scales, never substitute Part Stats.
 */
export function compareBattle(left: Part, right: Part): BattleFrame[] | undefined {
  const parts = [left, right];
  if (parts.some((part) => ["attack", "defense", "stamina"].some(
    (field) => compareStat(part, field as CompareStat) === undefined,
  ))) return undefined;
  const bodies = parts.map((part, index) => {
    const stats: ThreeStat = part.stats;
    const side = index === 0 ? -1 : 1;
    return {
      stats, x: side * LAUNCH, y: 0, angle: 0, damage: 1,
      vx: -side * stats.attack * 3,
      vy: side * stats.attack * 0.4,
      // A real zero stays stationary; windDurationSeconds alone has a
      // nonzero minimum speed and must not be used as a zero-stat fallback.
      spin: stats.attack === 0 ? 0 : 360 / windDurationSeconds(stats.attack),
      direction: part.type === "blade" && part.spinDirection === "left" ? -1 : 1,
      lifetime: stats.stamina / 8,
    };
  });
  const duration = Math.max(...bodies.map((body) => body.lifetime));
  // Very large/invalid runtime data should be unavailable, not freeze the UI.
  if (duration > 60) return undefined;
  const energy = (body: typeof bodies[number], time: number) =>
    body.stats.attack === 0 || body.lifetime === 0 ? 0 : Math.max(0, 1 - time / body.lifetime) * body.damage;
  const frames: BattleFrame[] = [];
  let touching = false;
  for (let step = 0; step <= Math.ceil(duration / BATTLE_STEP); step++) {
    const time = step * BATTLE_STEP;
    if (step > 0) for (const body of bodies) {
      const remaining = energy(body, time);
      body.vx -= body.x * body.stats.attack / 100 * BATTLE_STEP;
      body.vy -= body.y * body.stats.attack / 100 * BATTLE_STEP;
      body.x += body.vx * remaining * BATTLE_STEP;
      body.y += body.vy * remaining * BATTLE_STEP;
      body.angle += body.spin * body.direction * remaining * BATTLE_STEP;
      const distance = Math.hypot(body.x, body.y);
      if (distance > WALL) {
        const nx = body.x / distance, ny = body.y / distance;
        const outward = body.vx * nx + body.vy * ny;
        body.x = nx * WALL; body.y = ny * WALL;
        if (outward > 0) { body.vx -= 2 * outward * nx; body.vy -= 2 * outward * ny; }
      }
    }
    const [a, b] = bodies as [typeof bodies[number], typeof bodies[number]];
    const dx = b.x - a.x, dy = b.y - a.y;
    const distance = Math.hypot(dx, dy);
    const overlap = distance <= BATTLE_RADIUS * 2;
    let contact: BattleFrame["contact"];
    if (overlap && !touching && distance > 0 && (energy(a, time) > 0 || energy(b, time) > 0)) {
      const nx = dx / distance, ny = dy / distance;
      const approach = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (approach > 0) {
        contact = { x: 500 + (a.x + b.x) / 2, y: 500 + (a.y + b.y) / 2,
          strength: (a.stats.attack + b.stats.attack) / (a.stats.attack + b.stats.attack + a.stats.defense + b.stats.defense) };
        a.vx -= approach * nx; a.vy -= approach * ny;
        b.vx += approach * nx; b.vy += approach * ny;
        a.damage *= (a.stats.defense + 100) / (a.stats.defense + 100 + b.stats.attack);
        b.damage *= (b.stats.defense + 100) / (b.stats.defense + 100 + a.stats.attack);
      }
    }
    touching = overlap;
    frames.push({ time, contact, poses: bodies.map((body) => ({
      x: 500 + body.x, y: 500 + body.y, angle: body.angle, energy: energy(body, time),
    })) as [BattlePose, BattlePose] });
  }
  return frames;
}

export function battlePath(frames: BattleFrame[], side: 0 | 1): string {
  return frames.map((frame, index) => `${index ? "L" : "M"}${frame.poses[side].x.toFixed(2)},${frame.poses[side].y.toFixed(2)}`).join(" ");
}
