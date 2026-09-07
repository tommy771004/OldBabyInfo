import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

export function databaseAuthEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.AUTH_DATABASE_ENABLED === "true" && Boolean(env.DATABASE_URL?.trim());
}

/** A legacy provider subject is never sufficient authorization for writes. */
export function projectDatabaseSession(session: Session, token: JWT, enabled: boolean): Session {
  if (session.user) {
    session.user.persisted = enabled && typeof token.appUserId === "string" && token.appUserId.length > 0;
    session.user.id = session.user.persisted ? token.appUserId as string : token.sub ?? "";
  }
  return session;
}
