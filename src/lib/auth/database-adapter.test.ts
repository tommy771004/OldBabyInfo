import { describe, expect, it, vi } from "vitest";
import { createDatabaseAuthAdapter } from "./database-adapter.ts";
import type { AdapterAccount, AdapterUser } from "next-auth/adapters";
import { databaseAuthEnabled, projectDatabaseSession } from "./database-session.ts";
import type { Session } from "next-auth";

const row = { id: "app-user", display_name: "Player", email: null, image_url: null, email_verified_at: null };
const user: AdapterUser = { id: "provider-id", name: " Player ", email: "User@Example.com", image: null, emailVerified: null };

describe("database OAuth adapter", () => {
  it("creates a separate application UUID, canonicalizes email and stores only necessary profile data", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [row] });
    const result = await createDatabaseAuthAdapter({ query }).createUser!(user);
    expect(result.id).toBe("app-user");
    const params = query.mock.calls[0]![1];
    expect(params[0]).toMatch(/^[a-f0-9-]{36}$/);
    expect(params[0]).not.toBe(user.id);
    expect(params.slice(1)).toEqual(["Player", "user@example.com", null, null]);
  });
  it("does not invent an email for LINE or look up a blank identity", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [row] });
    const adapter = createDatabaseAuthAdapter({ query });
    await adapter.createUser!({ ...user, email: "" });
    expect(query.mock.calls[0]![1][2]).toBeNull();
    query.mockClear();
    expect(await adapter.getUserByEmail!(" ")).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });
  it("looks up OAuth accounts by BOTH provider and provider subject", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [row] });
    await createDatabaseAuthAdapter({ query }).getUserByAccount!({ provider: "line", providerAccountId: "same-id-as-google" });
    expect(query.mock.calls[0]![0]).toContain("a.provider = $1 AND a.provider_account_id = $2");
    expect(query.mock.calls[0]![1]).toEqual(["line", "same-id-as-google"]);
  });
  it("never reassigns account ownership or saves OAuth secrets", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ user_id: "app-user" }] });
    const account: AdapterAccount = { userId: "app-user", provider: "google", providerAccountId: "provider-id", type: "oidc", access_token: "not-to-store", refresh_token: "not-to-store", id_token: "not-to-store" };
    const adapter = createDatabaseAuthAdapter({ query });
    await adapter.linkAccount!(account);
    expect(query.mock.calls[0]![0]).toContain("WHERE auth_accounts.user_id = EXCLUDED.user_id");
    expect(query.mock.calls[0]![1]).toEqual(["google", "provider-id", "app-user", "oidc"]);
    query.mockResolvedValueOnce({ rows: [] });
    await expect(adapter.linkAccount!(account)).rejects.toThrow("already linked");
  });
  it("updates only supplied fields and uses bound values rather than SQL fragments", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [row] });
    await createDatabaseAuthAdapter({ query }).updateUser!({ id: "app-user", name: "O'Reilly", image: null });
    expect(query.mock.calls[0]![0]).not.toContain("O'Reilly");
    expect(query.mock.calls[0]![0]).not.toContain("email =");
    expect(query.mock.calls[0]![1]).toEqual(["app-user", "O'Reilly", null]);
  });
  it("fails closed on database errors instead of returning a fake local user", async () => {
    const query = vi.fn().mockRejectedValue(new Error("Unavailable"));
    await expect(createDatabaseAuthAdapter({ query }).getUser!("app-user")).rejects.toThrow("Unavailable");
  });
});

describe("database-backed session marker", () => {
  const session = (): Session => ({ expires: "2026-08-01T00:00:00.000Z", user: { id: "", name: "Player" } });
  it("requires explicit opt-in and a database URL", () => {
    expect(databaseAuthEnabled({ DATABASE_URL: "configured" })).toBe(false);
    expect(databaseAuthEnabled({ AUTH_DATABASE_ENABLED: "true" })).toBe(false);
    expect(databaseAuthEnabled({ AUTH_DATABASE_ENABLED: "true", DATABASE_URL: "configured" })).toBe(true);
  });
  it("does not promote legacy provider subjects to persistent application identities", () => {
    expect(projectDatabaseSession(session(), { sub: "provider-id" }, true).user.persisted).toBe(false);
    expect(projectDatabaseSession(session(), { sub: "provider-id", appUserId: "app-user" }, true).user).toMatchObject({ id: "app-user", persisted: true });
    expect(projectDatabaseSession(session(), { sub: "provider-id", appUserId: "app-user" }, false).user.persisted).toBe(false);
  });
});
