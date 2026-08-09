import { describe, expect, it } from "vitest";
import { classifyUserAgent, isRefusedClass } from "./user-agent.ts";

const CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const LINE_IN_APP =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Line/14.10.0";

describe("classifyUserAgent", () => {
  it("treats real browsers as browsers", () => {
    expect(classifyUserAgent(CHROME)).toBe("browser");
  });

  it("does not mistake the LINE in-app browser for a bot", () => {
    // Players share this site inside LINE groups; the in-app browser is the
    // single most common way a Taiwanese visitor arrives.
    expect(classifyUserAgent(LINE_IN_APP)).toBe("browser");
  });

  it("recognises the crawlers robots.txt welcomes", () => {
    expect(classifyUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(
      "search-crawler",
    );
    expect(classifyUserAgent("Mozilla/5.0 (compatible; ClaudeBot/1.0)")).toBe("search-crawler");
    expect(classifyUserAgent("facebookexternalhit/1.1")).toBe("search-crawler");
  });

  it("refuses commercial harvesters and scripted clients", () => {
    expect(classifyUserAgent("Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)")).toBe("harvester");
    expect(classifyUserAgent("python-requests/2.32.3")).toBe("scripted");
    expect(classifyUserAgent("Scrapy/2.11 (+https://scrapy.org)")).toBe("scripted");
    expect(classifyUserAgent("curl/8.7.1")).toBe("scripted");
    expect(classifyUserAgent("sqlmap/1.8.2#stable (https://sqlmap.org)")).toBe("scripted");
  });

  it("lets a hostile name inside a browser-shaped string win", () => {
    expect(classifyUserAgent(`${CHROME} nikto/2.5.0`)).toBe("scripted");
  });

  it("classifies missing or stub agents as unidentified", () => {
    expect(classifyUserAgent(null)).toBe("unidentified");
    expect(classifyUserAgent("")).toBe("unidentified");
    expect(classifyUserAgent("bot")).toBe("unidentified");
  });

  it("does not refuse headless Chrome, which the repo's own smoke run uses", () => {
    expect(isRefusedClass(classifyUserAgent(CHROME.replace("Chrome/", "HeadlessChrome/")))).toBe(false);
  });

  it("refuses exactly the two hostile classes", () => {
    expect(isRefusedClass("scripted")).toBe(true);
    expect(isRefusedClass("harvester")).toBe(true);
    expect(isRefusedClass("browser")).toBe(false);
    expect(isRefusedClass("search-crawler")).toBe(false);
    expect(isRefusedClass("unidentified")).toBe(false);
  });
});
