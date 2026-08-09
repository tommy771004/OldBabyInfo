import { describe, expect, it } from "vitest";
import { isSafeExternalUrl, safeExternalUrl } from "./external-url.ts";

describe("safeExternalUrl", () => {
  it("passes the retailer and source URLs the site actually renders", () => {
    expect(safeExternalUrl("https://www.funbox.com.tw/products/bx-01")).toBe(
      "https://www.funbox.com.tw/products/bx-01",
    );
    expect(safeExternalUrl("http://example.com/thread/1")).toBe("http://example.com/thread/1");
    expect(safeExternalUrl("/parts/dran-sword")).toBe("/parts/dran-sword");
  });

  it("rejects script-bearing protocols that zod's url() accepts", () => {
    expect(safeExternalUrl("javascript:alert(document.cookie)")).toBeUndefined();
    expect(safeExternalUrl("JavaScript:alert(1)")).toBeUndefined();
    expect(safeExternalUrl("  javascript:alert(1)  ")).toBeUndefined();
    expect(safeExternalUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBeUndefined();
    expect(safeExternalUrl("vbscript:msgbox(1)")).toBeUndefined();
  });

  it("rejects unparseable and empty values", () => {
    expect(safeExternalUrl("not a url")).toBeUndefined();
    expect(safeExternalUrl("")).toBeUndefined();
    expect(safeExternalUrl(null)).toBeUndefined();
    expect(safeExternalUrl(undefined)).toBeUndefined();
  });

  it("exposes the same rule as a predicate for the ingest side", () => {
    expect(isSafeExternalUrl("https://hackmd.io/@player/note")).toBe(true);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
  });
});
