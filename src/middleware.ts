import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { clientKeyFrom, denialMessage, evaluateRequest } from "./lib/security/guard.ts";
import { applySecurityHeaders } from "./lib/security/headers.ts";
import { createRateLimiter } from "./lib/security/rate-limit.ts";
import { shouldLocalizePath } from "./lib/security/request-scope.ts";

// Keep the device-language redirect for the unprefixed entry point. Explicit
// /ja and /en URLs remain stable and crawlable, so language detection never
// hides a locale variant from search engines.
const intlMiddleware = createMiddleware(routing);

/**
 * Per-instance and therefore best-effort — see the note in rate-limit.ts.
 * Module scope is what gives it any life at all: it survives between
 * invocations on a warm instance and vanishes on a cold one.
 */
const limiter = createRateLimiter();

const isProduction = process.env.NODE_ENV === "production";

export default function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const decision = evaluateRequest(
    {
      pathname,
      userAgent: request.headers.get("user-agent"),
      clientKey: clientKeyFrom(request.headers),
      now: Date.now(),
    },
    limiter,
  );

  if (decision.action === "deny") {
    const response = new NextResponse(denialMessage(decision), {
      status: decision.status,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        // Nothing refused here should ever be indexed or cached as content.
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow",
      },
    });
    if (decision.retryAfterSeconds > 0) {
      response.headers.set("retry-after", String(decision.retryAfterSeconds));
    }
    applySecurityHeaders(response.headers, { isProduction });
    return response;
  }

  const response = shouldLocalizePath(pathname) ? intlMiddleware(request) : NextResponse.next();
  applySecurityHeaders(response.headers, { isProduction });
  return response;
}

export const config = {
  // Wider than the locale matcher used to be: the guard also covers the API
  // routes, the sitemaps and llms.txt, which is precisely where bulk fetching
  // starts. Static assets are left out — they cost nothing to serve and would
  // only burn middleware invocations. `shouldLocalizePath` re-narrows the set
  // that next-intl actually sees.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|apple-icon\\.png|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|ttf|otf|mp4|webm)$).*)",
  ],
};
