import { z } from "zod";
import type { Part } from "../parts/schema.ts";
import { parseComboKey } from "../meta-standing.ts";
import { MAX_THREAD_BODY_LENGTH, type SubjectType } from "./rules.ts";
import type { CommunityActor, DiscussionWriter } from "./write-repository.ts";

const id = z.string().trim().min(1).max(512);
const subjectSchema = z.strictObject({ type: z.enum(["part", "combo", "event"]), id });
const postSchema = z.strictObject({ subject: subjectSchema, body: z.string().trim().min(1).max(MAX_THREAD_BODY_LENGTH), acceptTerms: z.literal(true) });
export class CommunityError extends Error {
  constructor(public code: "disabled" | "login_required" | "invalid" | "denied") { super(code); }
}

export function communityWritesEnabled(env: Record<string, string | undefined> = process.env) {
  return env.COMMUNITY_WRITES_ENABLED === "true" && env.AUTH_DATABASE_ENABLED === "true" && Boolean(env.DATABASE_URL?.trim());
}

export function subjectExists(subject: { type: SubjectType; id: string }, parts: readonly Part[], events: readonly { id: string }[]): boolean {
  if (subject.type === "event") return events.some((event) => event.id === subject.id);
  if (subject.type === "part") return parts.some((part) => part.id === subject.id);
  try {
    const key = parseComboKey(subject.id);
    return parts.some((part) => part.id === key.bladeId && part.type === "blade") &&
      parts.some((part) => part.id === key.ratchetId && part.type === "ratchet") &&
      parts.some((part) => part.id === key.bitId && part.type === "bit");
  } catch { return false; }
}

export interface CommunityDependencies {
  enabled: boolean;
  session: () => Promise<{ id: string; persisted?: boolean } | null>;
  writer: DiscussionWriter;
  subjectExists: (subject: { type: SubjectType; id: string }) => boolean;
}

/** Public input never includes actor IDs, roles or a destination URL. */
export function createCommunityService(deps: CommunityDependencies) {
  async function actor(staff = false): Promise<CommunityActor> {
    if (!deps.enabled) throw new CommunityError("disabled");
    const session = await deps.session();
    if (!session?.persisted || !session.id) throw new CommunityError("login_required");
    const current = await deps.writer.getActor(session.id);
    if (!current || (staff && (current.blocked || current.role === "member"))) throw new CommunityError("denied");
    return current;
  }
  function parse<T>(schema: z.ZodType<T>, input: unknown): T {
    const result = schema.safeParse(input);
    if (!result.success) throw new CommunityError("invalid");
    return result.data;
  }
  async function requireChange(result: Promise<boolean>) {
    if (!await result) throw new CommunityError("denied");
  }
  return {
    async post(input: unknown) {
      const user = await actor();
      if (user.blocked) throw new CommunityError("denied");
      const post = parse(postSchema, input);
      if (!deps.subjectExists(post.subject)) throw new CommunityError("invalid");
      await requireChange(deps.writer.post(user.id, post.subject, post.body));
    },
    async deleteOwn(threadId: unknown) {
      const user = await actor();
      await requireChange(deps.writer.deleteOwn(user.id, parse(id, threadId)));
    },
    async report(input: unknown) {
      const user = await actor();
      if (user.blocked) throw new CommunityError("denied");
      const report = parse(z.strictObject({ threadId: id, reason: z.string().trim().max(500) }), input);
      await requireChange(deps.writer.report(user.id, report.threadId, report.reason));
    },
    async moderate(input: unknown) {
      const user = await actor(true);
      const report = parse(z.strictObject({ reportId: id, action: z.enum(["hide", "dismiss"]) }), input);
      await requireChange(deps.writer.moderateReport(user.id, report.reportId, report.action));
    },
    async setBlocked(input: unknown) {
      const user = await actor(true);
      const target = parse(z.strictObject({ userId: id, blocked: z.boolean() }), input);
      if (target.userId === user.id) throw new CommunityError("denied");
      await requireChange(deps.writer.setBlocked(user.id, target.userId, target.blocked));
    },
    async moderationQueue() {
      const user = await actor(true);
      return { reports: await deps.writer.listReports(user.id), blocked: await deps.writer.listBlocked(user.id) };
    },
  };
}
