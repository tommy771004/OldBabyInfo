import type { routing } from "@/i18n/routing";
import type messages from "@/messages/zh-TW.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
import type { DefaultSession } from "next-auth";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** Set only by a post-migration, adapter-backed login. Roles stay in DB. */
      persisted?: boolean;
    } & DefaultSession["user"];
  }
}
