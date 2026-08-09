import { describe, expect, it } from "vitest";
import robots from "./robots.ts";
import { SCRAPE_TRAP_PATHS } from "@/lib/security/traffic-policy.ts";

const rules = () => {
  const result = robots().rules;
  return Array.isArray(result) ? result : [result];
};

describe("robots.txt", () => {
  it("keeps search and answer engines welcome", () => {
    const general = rules()[0]!;
    expect(general.userAgent).toContain("Googlebot");
    expect(general.userAgent).toContain("GPTBot");
    expect(general.allow).toBe("/");
  });

  it("disallows the whole site for commercial harvesters", () => {
    const harvesterRule = rules().find((rule) => rule.disallow === "/");
    expect(harvesterRule?.userAgent).toContain("AhrefsBot");
    expect(harvesterRule?.userAgent).toContain("Bytespider");
  });

  it("names the trap paths so a robots-reading scraper has to choose", () => {
    const disallow = rules()[0]!.disallow;
    for (const trap of SCRAPE_TRAP_PATHS) {
      expect(disallow).toContain(trap);
    }
  });

  it("keeps perishable Stock Listing pages out of the index", () => {
    expect(rules()[0]!.disallow).toContain("/parts/*/where-to-buy");
  });
});
