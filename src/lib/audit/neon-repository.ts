/**
 * Wires the audit writer to this site's own database.
 *
 * Note the direction, because the two connection strings in this feature run
 * opposite ways: promotion content is *read* from the shared affiliate
 * database (`SUP_DATABASE_URL`), while behaviour is *written* to this site's
 * own Neon (`DATABASE_URL`). Crossing them would publish this site's traffic
 * into a database other projects can read.
 */
import { neon } from "@neondatabase/serverless";
import { createSqlAuditWriter, type AuditWriter } from "./sql-repository.ts";

export function createNeonAuditWriter(connectionString: string): AuditWriter {
  const neonSql = neon(connectionString);
  return createSqlAuditWriter({
    async query(text, params = []) {
      return neonSql.query(text, [...params]);
    },
  });
}
