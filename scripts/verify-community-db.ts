/** Opt-in live PostgreSQL verification. All fixtures live in connection-local
 * temporary tables; public tables are never written. Always rolls back. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { createDatabaseAuthAdapter } from "../src/lib/auth/database-adapter.ts";
import { createDiscussionWriter } from "../src/lib/discussion/write-repository.ts";

async function main() {
  if (process.argv[2] !== "--temporary-tables") throw new Error("Pass --temporary-tables to acknowledge live database verification");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  neonConfig.webSocketConstructor = WebSocket;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL statement_timeout = '10s'");
      await client.query("CREATE TEMP TABLE verification_anchor (id integer) ON COMMIT DROP");
      // No public fallback: missing test tables must fail instead of touching live data.
      await client.query("SET LOCAL search_path = pg_temp");
      for (const file of ["discussion.sql", "auth-community.sql"]) {
        const sql = readFileSync(new URL(`./sql/${file}`, import.meta.url), "utf8")
          .replace(/^BEGIN;|^COMMIT;/gm, "")
          .replaceAll("CREATE TABLE IF NOT EXISTS", "CREATE TEMP TABLE IF NOT EXISTS");
        await client.query(sql);
      }
      const tables = ["app_users", "auth_accounts", "threads", "thread_reports", "blocked_users"];
      for (const table of tables) {
        const { rows } = await client.query("SELECT relpersistence FROM pg_class WHERE oid = to_regclass($1)", [table]);
        assert.equal(rows[0]?.relpersistence, "t", `${table} must be temporary`);
      }
      const sql = { query: async (text: string, params: readonly unknown[]) => client.query(text, [...params]) };
      const adapter = createDatabaseAuthAdapter(sql);
      const writer = createDiscussionWriter(sql);
      const member = await adapter.createUser!({ id: "ignored-provider-id", name: "DB verification member", email: "fixture@example.invalid", emailVerified: null });
      const reporter = await adapter.createUser!({ id: "ignored-reporter-id", name: "DB verification reporter", email: "", emailVerified: null });
      const moderator = await adapter.createUser!({ id: "ignored-moderator-id", name: "DB verification moderator", email: "moderator@example.invalid", emailVerified: null });
      assert.notEqual(member.id, "ignored-provider-id");
      assert.equal((await adapter.getUserByEmail!("FIXTURE@example.invalid"))?.id, member.id);
      await adapter.linkAccount!({ provider: "google", providerAccountId: "fixture-google", userId: member.id, type: "oidc" });
      assert.equal((await adapter.getUserByAccount!({ provider: "google", providerAccountId: "fixture-google" }))?.id, member.id);
      await assert.rejects(async () => adapter.linkAccount!({ provider: "google", providerAccountId: "fixture-google", userId: reporter.id, type: "oidc" }), /already linked/);
      await adapter.updateUser!({ id: member.id, name: "Updated fixture" });
      assert.equal((await adapter.getUser!(member.id))?.name, "Updated fixture");
      console.log("PASS: account persistence, email lookup, profile update, OAuth ownership");

      const subject = { type: "part" as const, id: "fixture-part" };
      assert.equal(await writer.post(member.id, subject, "Temporary verification thread"), true);
      assert.equal(await writer.post(member.id, subject, "Cooldown must reject"), false);
      const threadId = String((await client.query("SELECT id FROM threads")).rows[0].id);
      assert.equal(await writer.deleteOwn(reporter.id, threadId), false);
      assert.equal(await writer.report(reporter.id, threadId, "Temporary report"), true);
      assert.equal(await writer.report(reporter.id, threadId, "Repeated report"), false);
      assert.deepEqual(await writer.listReports(member.id), []);
      await client.query("UPDATE app_users SET community_role = 'moderator' WHERE id = $1", [moderator.id]);
      const reports = await writer.listReports(moderator.id);
      assert.equal(reports.length, 1);
      assert.equal(await writer.moderateReport(member.id, reports[0]!.id, "hide"), false);
      assert.equal(await writer.moderateReport(moderator.id, reports[0]!.id, "hide"), true);
      assert.ok((await client.query("SELECT hidden_at FROM threads WHERE id = $1", [threadId])).rows[0].hidden_at);
      assert.deepEqual(await writer.listReports(moderator.id), []);
      console.log("PASS: posting cooldown, ownership, reporting, staff-only hiding");

      assert.equal(await writer.setBlocked(moderator.id, member.id, true), true);
      await client.query("UPDATE app_users SET last_post_at = NULL WHERE id = $1", [member.id]);
      assert.equal(await writer.post(member.id, subject, "Blocked post"), false);
      assert.equal((await writer.listBlocked(moderator.id))[0]?.id, member.id);
      assert.equal(await writer.setBlocked(moderator.id, member.id, false), true);
      assert.equal(await writer.post(member.id, subject, "Deletion verification"), true);
      const ownId = String((await client.query("SELECT id FROM threads WHERE hidden_at IS NULL")).rows[0].id);
      assert.equal(await writer.deleteOwn(member.id, ownId), true);
      assert.ok((await client.query("SELECT deleted_at FROM threads WHERE id = $1", [ownId])).rows[0].deleted_at);
      assert.equal(await writer.setBlocked(moderator.id, moderator.id, true), false);
      await client.query("UPDATE app_users SET community_role = 'member' WHERE id = $1", [moderator.id]);
      assert.equal(await writer.setBlocked(moderator.id, member.id, true), false);
      console.log("PASS: ban/unban, own deletion, role revocation");
    } finally {
      try { await client.query("ROLLBACK"); } finally { client.release(); }
    }
    console.log("Verification complete; temporary fixtures rolled back. Public data unchanged.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  // Driver errors may include connection details. Print only a sanitized code/name.
  const name = error instanceof Error ? error.name : "UnknownError";
  console.error(`Community database verification failed (${name}); public fixtures were not used.`);
  process.exitCode = 1;
});
