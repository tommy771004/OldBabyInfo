import { describe, expect, it, vi } from "vitest";
import { CommunityError, communityWritesEnabled, createCommunityService, subjectExists } from "./service.ts";
import { createDiscussionWriter, type DiscussionWriter } from "./write-repository.ts";
import { getAllParts } from "../parts/repository.ts";

function setup() {
  const writer = {
    getActor: vi.fn().mockResolvedValue({ id: "app-user", role: "member", blocked: false }),
    post: vi.fn().mockResolvedValue(true), deleteOwn: vi.fn().mockResolvedValue(true),
    report: vi.fn().mockResolvedValue(true), moderateReport: vi.fn().mockResolvedValue(true),
    setBlocked: vi.fn().mockResolvedValue(true), listReports: vi.fn().mockResolvedValue([]), listBlocked: vi.fn().mockResolvedValue([]),
  } satisfies DiscussionWriter;
  const deps = { enabled: true, writer, session: vi.fn().mockResolvedValue({ id: "app-user", persisted: true }), subjectExists: vi.fn().mockReturnValue(true) };
  return { deps, writer, service: createCommunityService(deps) };
}
const post = { subject: { type: "part", id: "DRANSWORD" }, body: "  Fixture comment  ", acceptTerms: true };

describe("community mutation service", () => {
  it("requires all environment gates", () => {
    expect(communityWritesEnabled({ DATABASE_URL: "configured", AUTH_DATABASE_ENABLED: "true" })).toBe(false);
    expect(communityWritesEnabled({ DATABASE_URL: "configured", AUTH_DATABASE_ENABLED: "true", COMMUNITY_WRITES_ENABLED: "true" })).toBe(true);
  });
  it("uses the persistent session actor, never a submitted author or role", async () => {
    const { service, writer } = setup();
    await service.post(post);
    expect(writer.post).toHaveBeenCalledWith("app-user", post.subject, "Fixture comment");
    await expect(service.post({ ...post, authorId: "admin", role: "admin" })).rejects.toMatchObject({ code: "invalid" });
    expect(writer.post).toHaveBeenCalledTimes(1);
  });
  it("fails before database access when disabled or on legacy JWTs", async () => {
    const { deps, service, writer } = setup();
    deps.enabled = false;
    await expect(service.post(post)).rejects.toMatchObject({ code: "disabled" });
    expect(writer.getActor).not.toHaveBeenCalled();
    deps.enabled = true;
    deps.session.mockResolvedValue({ id: "provider-id", persisted: false });
    await expect(service.post(post)).rejects.toMatchObject({ code: "login_required" });
    expect(writer.getActor).not.toHaveBeenCalled();
  });
  it("requires current user existence, unblocked posting and fresh SQL acceptance", async () => {
    const { service, writer } = setup();
    writer.getActor.mockResolvedValueOnce(null);
    await expect(service.post(post)).rejects.toMatchObject({ code: "denied" });
    writer.getActor.mockResolvedValueOnce({ id: "app-user", role: "member", blocked: true });
    await expect(service.post(post)).rejects.toMatchObject({ code: "denied" });
    writer.post.mockResolvedValueOnce(false);
    await expect(service.post(post)).rejects.toMatchObject({ code: "denied" });
  });
  it.each([{ ...post, acceptTerms: false }, { ...post, body: " " }, { ...post, body: "x".repeat(2001) }])("rejects invalid consent/body", async (input) => {
    const { service, writer } = setup();
    await expect(service.post(input)).rejects.toBeInstanceOf(CommunityError);
    expect(writer.post).not.toHaveBeenCalled();
  });
  it("checks subject existence before insertion", async () => {
    const { deps, service, writer } = setup();
    deps.subjectExists.mockReturnValue(false);
    await expect(service.post(post)).rejects.toMatchObject({ code: "invalid" });
    expect(writer.post).not.toHaveBeenCalled();
  });
  it("binds delete/report to the signed-in actor and validates reason length", async () => {
    const { service, writer } = setup();
    await service.deleteOwn("thread");
    await service.report({ threadId: "thread", reason: " Fixture reason " });
    expect(writer.deleteOwn).toHaveBeenCalledWith("app-user", "thread");
    expect(writer.report).toHaveBeenCalledWith("app-user", "thread", "Fixture reason");
    await expect(service.report({ threadId: "thread", reason: "x".repeat(501) })).rejects.toMatchObject({ code: "invalid" });
  });
  it("denies queue, moderation and banning to nonstaff", async () => {
    const { service, writer } = setup();
    await expect(service.moderationQueue()).rejects.toMatchObject({ code: "denied" });
    await expect(service.moderate({ reportId: "report", action: "hide" })).rejects.toMatchObject({ code: "denied" });
    await expect(service.setBlocked({ userId: "other", blocked: true })).rejects.toMatchObject({ code: "denied" });
    expect(writer.listReports).not.toHaveBeenCalled();
    expect(writer.moderateReport).not.toHaveBeenCalled();
    expect(writer.setBlocked).not.toHaveBeenCalled();
  });
  it("allows reviewed staff actions but never self-banning or arbitrary actions", async () => {
    const { service, writer } = setup();
    writer.getActor.mockResolvedValue({ id: "app-user", role: "moderator", blocked: false });
    await service.moderate({ reportId: "report", action: "hide" });
    await service.setBlocked({ userId: "other", blocked: true });
    expect(writer.moderateReport).toHaveBeenCalledWith("app-user", "report", "hide");
    expect(writer.setBlocked).toHaveBeenCalledWith("app-user", "other", true);
    await expect(service.setBlocked({ userId: "app-user", blocked: true })).rejects.toMatchObject({ code: "denied" });
    await expect(service.moderate({ reportId: "report", action: "make-admin" })).rejects.toMatchObject({ code: "invalid" });
  });
  it("validates real Part/Combo/Event IDs without fuzzy lookup", () => {
    const parts = getAllParts();
    const [blade, ratchet, bit] = ["blade", "ratchet", "bit"].map((type) => parts.find((part) => part.type === type)!);
    const combo = `${blade!.id}|${ratchet!.id}|${bit!.id}`;
    expect(subjectExists({ type: "combo", id: combo }, parts, [])).toBe(true);
    expect(subjectExists({ type: "combo", id: `${combo}|extra` }, parts, [])).toBe(false);
    expect(subjectExists({ type: "event", id: "fixture" }, parts, [{ id: "fixture" }])).toBe(true);
    expect(subjectExists({ type: "part", id: "unknown" }, parts, [])).toBe(false);
  });
});

describe("SQL authorization contracts (offline, not a live migration test)", () => {
  it("atomically enforces posting cooldown and ban before inserting", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: "thread" }] });
    await createDiscussionWriter({ query }).post("actor", { type: "part", id: "part" }, "untrusted body");
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, params] = query.mock.calls[0]!;
    expect(sql).toContain("UPDATE app_users SET last_post_at = now()");
    expect(sql).toContain("posting_blocked_at IS NULL");
    expect(sql).toContain("interval '30 seconds'");
    expect(sql).toContain("FROM eligible");
    expect(sql).not.toContain("untrusted body");
    expect(params[0]).toBe("actor");
    expect(params[4]).toBe("untrusted body");
  });
  it("checks ownership for deletion, not just thread existence", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    expect(await createDiscussionWriter({ query }).deleteOwn("actor", "thread")).toBe(false);
    expect(query.mock.calls[0]![0]).toContain("author_id = $1");
    expect(query.mock.calls[0]![0]).toContain("deleted_at IS NULL");
  });
  it("limits reports to visible threads with cooldown and unique reporter/thread pairs", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    await createDiscussionWriter({ query }).report("actor", "thread", "reason");
    const sql = query.mock.calls[0]![0];
    expect(sql).toContain("interval '10 seconds'");
    expect(sql).toContain("t.hidden_at IS NULL AND t.deleted_at IS NULL");
    expect(sql).toContain("ON CONFLICT (thread_id, reporter_id) DO NOTHING");
  });
  it("rechecks staff authorization in every management query", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const writer = createDiscussionWriter({ query });
    await writer.listReports("actor");
    await writer.listBlocked("actor");
    await writer.moderateReport("actor", "report", "hide");
    await writer.setBlocked("actor", "target", true);
    for (const [sql, params] of query.mock.calls) {
      expect(sql).toContain("actor.community_role IN ('moderator', 'admin')");
      expect(sql).toContain("actor.posting_blocked_at IS NULL");
      expect(params[0]).toBe("actor");
    }
    expect(query.mock.calls[3]![0]).toContain("id <> $1 AND community_role = 'member'");
  });
});
