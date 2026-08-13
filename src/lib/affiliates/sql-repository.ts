/**
 * Reads this project's enabled promotion slots out of the shared
 * `affiliates` table. Split from the Neon wiring the same way the discussion
 * reader is, so the query, the row mapping and the malformed-row policy are
 * testable without a database.
 *
 * The query is the spec's §6.2 verbatim, narrowed to the columns this
 * placement renders: `project_name` is always bound, never interpolated, and
 * never omitted — a query without it would show another site's partners on
 * this one.
 */
import { parseOffers, type AffiliateOffer } from "./schema.ts";

export interface AffiliateRow {
  projectName: string;
  id: string;
  sponsored: boolean;
  title: string;
  url: string;
  partner: string | null;
  priority: number;
}

export interface AffiliateSqlClient {
  query(text: string, params?: readonly unknown[]): Promise<{ rows: unknown[] }>;
}

const LIST_ENABLED_SQL = `
  SELECT
    project_name AS "projectName",
    id,
    sponsored,
    title,
    url,
    partner,
    priority
  FROM affiliates
  WHERE project_name = $1
    AND enabled = TRUE
  ORDER BY priority DESC, id ASC
`;

export interface OfferReader {
  listEnabled(projectName: string): Promise<AffiliateOffer[]>;
}

export function createSqlOfferReader(sql: AffiliateSqlClient): OfferReader {
  return {
    async listEnabled(projectName: string): Promise<AffiliateOffer[]> {
      const result = await sql.query(LIST_ENABLED_SQL, [projectName]);
      return parseOffers(result.rows);
    },
  };
}
