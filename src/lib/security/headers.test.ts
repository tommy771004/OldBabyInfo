import { describe, expect, it } from "vitest";
import { applySecurityHeaders, securityHeaders } from "./headers.ts";

function csp(isProduction: boolean): string {
  return securityHeaders({ isProduction })["content-security-policy"] ?? "";
}

describe("securityHeaders", () => {
  it("blocks third-party script origins, framing and plugin content", () => {
    const policy = csp(true);
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toMatch(/script-src 'self' 'unsafe-inline'(?!.*https:)/);
  });

  it("keeps OAuth sign-in working through form-action", () => {
    // Chrome checks a form POST's redirect target against form-action; drop
    // these origins and both sign-in buttons fail with a CSP violation.
    expect(csp(true)).toContain("form-action 'self' https://accounts.google.com https://access.line.me");
  });

  it("does not allow eval in production, and does in development", () => {
    expect(csp(true)).not.toContain("unsafe-eval");
    expect(csp(false)).toContain("unsafe-eval");
  });

  it("sends HSTS only in production", () => {
    expect(securityHeaders({ isProduction: true })["strict-transport-security"]).toContain("max-age=31536000");
    expect(securityHeaders({ isProduction: false })["strict-transport-security"]).toBeUndefined();
  });

  it("does not preload HSTS from a shared vercel.app host", () => {
    expect(securityHeaders({ isProduction: true })["strict-transport-security"]).not.toContain("preload");
  });

  it("sets the rest of the baseline", () => {
    const headers = securityHeaders({ isProduction: true });
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("geolocation=()");
    expect(headers["cross-origin-resource-policy"]).toBe("same-origin");
  });
});

describe("applySecurityHeaders", () => {
  it("writes onto an existing response's headers without dropping them", () => {
    const headers = new Headers({ "content-type": "text/html" });
    applySecurityHeaders(headers, { isProduction: true });
    expect(headers.get("content-type")).toBe("text/html");
    expect(headers.get("x-content-type-options")).toBe("nosniff");
  });
});
