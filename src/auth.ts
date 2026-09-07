import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { Line } from "@/lib/auth/line-provider.ts";
import { createNeonAuthAdapter } from "@/lib/auth/neon-adapter.ts";
import { databaseAuthEnabled, projectDatabaseSession } from "@/lib/auth/database-session.ts";

/**
 * Auth.js v5 entry point. Provider credentials are read from AUTH_GOOGLE_ID,
 * AUTH_GOOGLE_SECRET, and AUTH_SECRET by the runtime; none belong in source.
 * Enable the database adapter only after manually applying auth-community.sql.
 * JWT sessions remain signed; write authorization requires a new DB-backed
 * login and a current database user/role check, not a legacy provider subject.
 */
const persisted = databaseAuthEnabled();
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google, Line()],
  ...(persisted ? { adapter: createNeonAuthAdapter(process.env.DATABASE_URL!) } : {}),
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.appUserId = persisted ? user.id : undefined;
      return token;
    },
    async session({ session, token }) {
      return projectDatabaseSession(session, token, persisted);
    },
  },
});
