/**
 * Records one promotion impression or click.
 *
 * Deliberately thin: the shape check lives in lib/audit/affiliate-event.ts
 * and the write in lib/audit/sql-repository.ts, both tested without HTTP.
 * What is decided here is only what the caller is told.
 *
 * A tracking failure is never the reader's problem. An unconfigured database
 * or a missing `audit_log` table returns 204 exactly like a successful write
 * — the beacon is fire-and-forget and the page must not change because
 * analytics is down. A malformed body still returns 400, because that can
 * only be a bug in our own client and silence would hide it.
 */
import { createNeonAuditWriter } from "@/lib/audit/neon-repository.ts";
import { parseAffiliateEvent } from "@/lib/audit/affiliate-event.ts";

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const parsed = parseAffiliateEvent(body);

  if (!parsed.ok || !parsed.event) {
    return new Response(null, { status: 400 });
  }

  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    try {
      await createNeonAuditWriter(connectionString).record(parsed.event);
    } catch (error) {
      // Logged rather than swallowed: a slot that silently records nothing
      // is indistinguishable from a slot nobody clicks.
      console.error("[affiliate-track] event not recorded:", error);
    }
  }

  return new Response(null, { status: 204 });
}
