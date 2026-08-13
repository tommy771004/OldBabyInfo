import { describe, expect, it } from "vitest";
import { createSqlAuditWriter, type AuditSqlClient } from "./sql-repository.ts";
import type { AffiliateEvent } from "./affiliate-event.ts";

const event: AffiliateEvent = {
  action: "affiliate_impression",
  target: "funbox-x-launcher",
  metadata: {
    project_name: "old-baby-info",
    sponsored: false,
    partner: "Funbox",
    placement: "home-promos",
  },
};

function capture() {
  const calls: { text: string; params: readonly unknown[] }[] = [];
  const sql: AuditSqlClient = {
    async query(text, params = []) {
      calls.push({ text, params });
      return { rows: [] };
    },
  };
  return { calls, sql };
}

describe("createSqlAuditWriter", () => {
  it("appends the event, binding every value as a parameter", async () => {
    const { calls, sql } = capture();

    await createSqlAuditWriter(sql).record(event);

    expect(calls).toHaveLength(1);
    expect(calls[0]!.text).toContain("INSERT INTO audit_log");
    expect(calls[0]!.params).toEqual([
      "affiliate_impression",
      "funbox-x-launcher",
      JSON.stringify(event.metadata),
    ]);
  });

  it("casts the metadata parameter to jsonb in the statement", async () => {
    const { calls, sql } = capture();
    await createSqlAuditWriter(sql).record(event);
    expect(calls[0]!.text).toContain("$3::jsonb");
  });

  it("never updates or deletes — the log is append-only", async () => {
    const { calls, sql } = capture();
    await createSqlAuditWriter(sql).record(event);
    expect(calls[0]!.text).not.toMatch(/UPDATE|DELETE|ON CONFLICT/i);
  });

  it("lets a database failure reach the caller, which decides what to do", async () => {
    const sql: AuditSqlClient = {
      async query() {
        throw new Error("relation \"audit_log\" does not exist");
      },
    };

    await expect(createSqlAuditWriter(sql).record(event)).rejects.toThrow("audit_log");
  });
});
