import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Keep the device-language redirect for the unprefixed entry point. Explicit
// /ja and /en URLs remain stable and crawlable, so language detection never
// hides a locale variant from search engines.
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
