/**
 * The middleware now does two unrelated jobs — locale routing and request
 * guarding — over two different sets of paths, and mixing them up is how a
 * next-intl rewrite ends up applied to `/api/auth/callback/google`.
 *
 * Guarding is the wider set (it wants the sitemaps and the auth endpoints);
 * localizing keeps exactly the reach the matcher had before this split:
 * everything except API routes, framework internals and anything with a file
 * extension.
 */

const NON_LOCALIZED_PREFIXES = ["/api", "/trpc", "/_next", "/_vercel"];

export function shouldLocalizePath(pathname: string): boolean {
  if (NON_LOCALIZED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false;
  }
  const lastSegment = pathname.split("/").pop() ?? "";
  return !lastSegment.includes(".");
}
