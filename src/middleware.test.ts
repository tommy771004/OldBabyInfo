// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import middleware from "./middleware.ts";

const VERIFIER = "Mozilla/5.0 (compatible; Google-Site-Verification/1.0)";
const CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function homeRequest(userAgent: string, acceptLanguage: string): NextRequest {
  return new NextRequest("https://old-baby-info.vercel.app/", {
    headers: { "user-agent": userAgent, "accept-language": acceptLanguage },
  });
}

describe("middleware locale redirect", () => {
  it("still sends an English-speaking browser from / to /en", () => {
    const response = middleware(homeRequest(CHROME, "en-US,en;q=0.9"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://old-baby-info.vercel.app/en");
  });

  it("serves / itself to Search Console's verifier whatever language it sends", () => {
    for (const acceptLanguage of ["en-US,en;q=0.9", "ja"]) {
      const response = middleware(homeRequest(VERIFIER, acceptLanguage));
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-middleware-rewrite")).toBe("https://old-baby-info.vercel.app/zh-TW");
    }
  });
});
