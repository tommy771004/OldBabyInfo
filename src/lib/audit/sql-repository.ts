/**
 * Appends one behaviour event to `audit_log`.
 *
 * Append-only on purpose: this table is never updated and never deleted from
 * by the site, so the reporting query in scripts/sql/audit-log.sql always
 * sees the whole history of an offer.
 *
 * `metadata` is serialised here rather than handed to the driver as an
 * object — the column is `jsonb` and the cast is explicit in the statement,
 * so what lands in the row does not depend on how a particular driver
 * chooses to encode a JavaScript object.
 */
import type { AffiliateEvent } from "./affiliate-event.ts";

export interface AuditSqlClient {
  query(text: string, params?: readonly unknown[]): Promise<unknown>;
}

const INSERT_SQL = `
  INSERT INTO audit_log (action, target, metadata)
  VALUES ($1, $2, $3::jsonb)
`;

export interface AuditWriter {
  record(event: AffiliateEvent): Promise<void>;
}

export function createSqlAuditWriter(sql: AuditSqlClient): AuditWriter {
  return {
    async record(event: AffiliateEvent): Promise<void> {
      await sql.query(INSERT_SQL, [
        event.action,
        event.target,
        JSON.stringify(event.metadata),
      ]);
    },
  };
}
