import { randomUUID } from "node:crypto";
import type { SubjectType } from "./rules.ts";

export interface CommunitySqlClient {
  query(text: string, params: readonly unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}
export interface CommunityActor { id: string; role: "member" | "moderator" | "admin"; blocked: boolean }
export interface OpenReport { id: string; threadId: string; authorId: string; body: string; reason: string; createdAt: string }
const staff = `EXISTS (SELECT 1 FROM app_users actor WHERE actor.id = $1
  AND actor.community_role IN ('moderator', 'admin') AND actor.posting_blocked_at IS NULL)`;

/** Actor IDs come from the verified session, never from public request bodies.
 * Every mutation rechecks permissions in SQL, including concurrent revocation. */
export function createDiscussionWriter(sql: CommunitySqlClient) {
  async function changed(text: string, params: readonly unknown[]) {
    return (await sql.query(text, params)).rows.length > 0;
  }
  return {
    async getActor(id: string): Promise<CommunityActor | null> {
      const { rows } = await sql.query("SELECT id, community_role, posting_blocked_at FROM app_users WHERE id = $1", [id]);
      const row = rows[0];
      if (!row || !["member", "moderator", "admin"].includes(String(row.community_role))) return null;
      return { id: String(row.id), role: row.community_role as CommunityActor["role"], blocked: row.posting_blocked_at != null };
    },
    post(actorId: string, subject: { type: SubjectType; id: string }, body: string) {
      // UPDATE locks the actor row. A competing request rechecks last_post_at
      // after that lock, so parallel posts cannot both pass the 30-second gate.
      return changed(`WITH eligible AS (
        UPDATE app_users SET last_post_at = now(), terms_accepted_at = COALESCE(terms_accepted_at, now())
        WHERE id = $1 AND posting_blocked_at IS NULL
          AND (last_post_at IS NULL OR last_post_at <= now() - interval '30 seconds')
        RETURNING id
      ) INSERT INTO threads (id, author_id, subject_type, subject_id, body)
        SELECT $2, id, $3, $4, $5 FROM eligible RETURNING id`, [actorId, randomUUID(), subject.type, subject.id, body]);
    },
    deleteOwn(actorId: string, threadId: string) {
      return changed(`UPDATE threads SET deleted_at = now(), updated_at = now()
        WHERE id = $2 AND author_id = $1 AND hidden_at IS NULL AND deleted_at IS NULL
          AND EXISTS (SELECT 1 FROM app_users WHERE id = $1) RETURNING id`, [actorId, threadId]);
    },
    report(actorId: string, threadId: string, reason: string) {
      return changed(`WITH eligible AS (
        UPDATE app_users SET last_report_at = now() WHERE id = $1
          AND posting_blocked_at IS NULL
          AND (last_report_at IS NULL OR last_report_at <= now() - interval '10 seconds')
        RETURNING id
      ) INSERT INTO thread_reports (id, thread_id, reporter_id, reason)
        SELECT $2, t.id, e.id, $4 FROM threads t CROSS JOIN eligible e
        WHERE t.id = $3 AND t.hidden_at IS NULL AND t.deleted_at IS NULL
        ON CONFLICT (thread_id, reporter_id) DO NOTHING RETURNING id`, [actorId, randomUUID(), threadId, reason || null]);
    },
    async listReports(actorId: string): Promise<OpenReport[]> {
      const { rows } = await sql.query(`SELECT r.id, r.thread_id, t.author_id, t.body, r.reason, r.created_at
        FROM thread_reports r JOIN threads t ON t.id = r.thread_id
        WHERE r.status = 'open' AND ${staff} ORDER BY r.created_at ASC LIMIT 100`, [actorId]);
      return rows.map((row) => ({
        id: String(row.id), threadId: String(row.thread_id), authorId: String(row.author_id),
        body: String(row.body), reason: typeof row.reason === "string" ? row.reason : "",
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      }));
    },
    moderateReport(actorId: string, reportId: string, action: "hide" | "dismiss") {
      return changed(`WITH selected AS (
        SELECT r.id, r.thread_id FROM thread_reports r WHERE r.id = $2 AND r.status = 'open' AND ${staff}
        FOR UPDATE
      ), hidden AS (
        UPDATE threads SET hidden_at = now(), updated_at = now()
        WHERE id IN (SELECT thread_id FROM selected) AND $3 = 'hide' RETURNING id
      ) UPDATE thread_reports SET status = CASE WHEN $3 = 'hide' THEN 'actioned' ELSE 'dismissed' END,
        resolved_at = now() WHERE id IN (SELECT id FROM selected) RETURNING id`, [actorId, reportId, action]);
    },
    async listBlocked(actorId: string): Promise<{ id: string; name: string }[]> {
      const { rows } = await sql.query(`SELECT id, display_name FROM app_users
        WHERE posting_blocked_at IS NOT NULL AND community_role = 'member' AND ${staff}
        ORDER BY posting_blocked_at DESC LIMIT 100`, [actorId]);
      return rows.map((row) => ({ id: String(row.id), name: String(row.display_name) }));
    },
    setBlocked(actorId: string, targetId: string, blocked: boolean) {
      return changed(`UPDATE app_users SET posting_blocked_at = CASE WHEN $3::boolean THEN now() ELSE NULL END,
        updated_at = now() WHERE id = $2 AND id <> $1 AND community_role = 'member' AND ${staff}
        RETURNING id`, [actorId, targetId, blocked]);
    },
  };
}
export type DiscussionWriter = ReturnType<typeof createDiscussionWriter>;
