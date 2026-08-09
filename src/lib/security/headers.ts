/**
 * Response headers applied to every request that reaches the app.
 *
 * A nonce-based CSP is the stricter option and was rejected on purpose: a
 * per-request nonce has to be injected through a request header, which opts
 * every page out of static rendering. This site is almost entirely
 * prerendered and its whole point is being fast on a phone, so it keeps the
 * static CSP below. `script-src 'self'` still blocks the payload that matters
 * most — a third-party origin loaded by an injection — while `'unsafe-inline'`
 * covers React's own inline flight payload.
 */

export interface SecurityHeaderOptions {
  /** Adds HSTS and upgrade-insecure-requests; off in development. */
  isProduction: boolean;
}

/**
 * OAuth sign-in submits a form to a server action that answers with a
 * redirect to the provider. Chrome checks redirect targets against
 * `form-action`, so both providers are listed or login breaks.
 */
const FORM_ACTION_ORIGINS = ["https://accounts.google.com", "https://access.line.me"];

function contentSecurityPolicy(isProduction: boolean): string {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    `form-action 'self' ${FORM_ACTION_ORIGINS.join(" ")}`,
    // Part photos are local; avatars come from Google/LINE CDNs over https.
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // next/font and CSS Modules both emit inline <style>.
    "style-src 'self' 'unsafe-inline'",
    isProduction
      ? "script-src 'self' 'unsafe-inline'"
      : // next dev's HMR client evals its update payloads.
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    isProduction ? "connect-src 'self'" : "connect-src 'self' ws: wss:",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ];
  if (isProduction) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

export function securityHeaders({ isProduction }: SecurityHeaderOptions): Record<string, string> {
  const headers: Record<string, string> = {
    "content-security-policy": contentSecurityPolicy(isProduction),
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy":
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=(), interest-cohort=()",
    "cross-origin-opener-policy": "same-origin",
    // Also the cheapest anti-hotlink measure for part photos: another site
    // can link to them, but not embed them as a subresource.
    "cross-origin-resource-policy": "same-origin",
    "x-permitted-cross-domain-policies": "none",
  };
  if (isProduction) {
    // No `preload`: this deployment lives on a shared vercel.app host, and
    // preloading is effectively irreversible.
    headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
  }
  return headers;
}

export function applySecurityHeaders(headers: Headers, options: SecurityHeaderOptions): Headers {
  for (const [name, value] of Object.entries(securityHeaders(options))) {
    headers.set(name, value);
  }
  return headers;
}
