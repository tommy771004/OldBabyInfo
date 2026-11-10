import type { z } from "zod";

/** The two variables the decision reads; `process.env` in production. */
type StaticDataEnv = { readonly NODE_ENV?: string; readonly NEXT_PHASE?: string };

/**
 * Where the committed JSON (ADR-0001) gets its schema check.
 *
 * The check exists so that an invalid seed file fails the build. It used to
 * run at module load everywhere, which also meant once per cold start of
 * every production function — and the site's traffic is sparse enough that
 * almost every invocation is cold. Measured on the three large files, that
 * was ~140 ms of CPU per cold start (events 56, catalog 55, parts 28)
 * spent re-proving what the build had already proved about the same bytes.
 *
 * So the check runs everywhere *except* a production server answering
 * requests: `next build` (which prerenders every page and therefore loads
 * every repository), `next dev`, vitest and the node scripts all still
 * validate. The build is the gate; a deployed function is serving the exact
 * file the gate passed.
 *
 * Skipping is only sound while `parse` is the identity on these files — no
 * `.default()`, `.transform()` or stripped keys. `static-data.test.ts` holds
 * every repository file to that, so a schema that starts reshaping its
 * input fails the suite instead of silently diverging in production.
 */
export function shouldValidateStaticData(env: StaticDataEnv = process.env): boolean {
  if (env.NODE_ENV !== "production") return true;
  return env.NEXT_PHASE === "phase-production-build";
}

export function loadStaticData<Schema extends z.ZodType>(
  schema: Schema,
  json: unknown,
  env: StaticDataEnv = process.env,
): z.output<Schema> {
  return shouldValidateStaticData(env) ? schema.parse(json) : (json as z.output<Schema>);
}
