/**
 * Wires the offer reader to the affiliate database.
 *
 * That database is deliberately not this site's own: it is the shared one
 * behind `SUP_DATABASE_URL`, written by several maintenance systems. The
 * spec forbids falling back to `DATABASE_URL` when it is unset (§2.1) —
 * this site's Neon holds discussion and stock data and has no `affiliates`
 * table, so a fallback would turn a missing configuration into a query
 * error. Callers construct no reader at all in that case and render nothing.
 */
import { neon } from "@neondatabase/serverless";
import { createSqlOfferReader, type OfferReader } from "./sql-repository.ts";

/** The spec's default for an unset `AFFILIATE_PROJECT_NAME`: this project's
 * own deployment name. A value that disagrees with what the maintenance
 * system writes yields an empty slot, not another project's rows. */
export const DEFAULT_PROJECT_NAME = "old-baby-info";

export function affiliateProjectName(): string {
  return process.env.AFFILIATE_PROJECT_NAME?.trim() || DEFAULT_PROJECT_NAME;
}

export function createNeonOfferReader(connectionString: string): OfferReader {
  const neonSql = neon(connectionString);
  return createSqlOfferReader({
    async query(text, params = []) {
      const rows = await neonSql.query(text, [...params]);
      return { rows: rows as unknown[] };
    },
  });
}
