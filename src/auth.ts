import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { Line } from "@/lib/auth/line-provider.ts";

/**
 * Auth.js v5 entry point. Provider credentials are read from AUTH_GOOGLE_ID,
 * AUTH_GOOGLE_SECRET, and AUTH_SECRET by the runtime; none belong in source.
 * A database adapter will be added when the Neon account/session migration is
 * provisioned. Until then Auth.js uses its signed session strategy.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google, Line()],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
