import { describe, expect, it } from "vitest";
import { localizedAlternates, localizedPath, pageMetadata } from "./seo.ts";

describe("localized SEO URLs", () => {
  it("keeps the default locale unprefixed and prefixes Japanese and English", () => {
    expect(localizedPath("zh-TW", "/parts")).toBe("/parts");
    expect(localizedPath("ja", "/parts")).toBe("/ja/parts");
    expect(localizedPath("en", "/parts")).toBe("/en/parts");
  });

  it("emits reciprocal locale alternates with x-default", () => {
    expect(localizedAlternates("/parts").languages).toMatchObject({
      "zh-TW": "https://oldbabyinfo.dev/parts",
      ja: "https://oldbabyinfo.dev/ja/parts",
      en: "https://oldbabyinfo.dev/en/parts",
      "x-default": "https://oldbabyinfo.dev/parts",
    });
  });

  it("uses the current locale for the canonical URL", () => {
    const metadata = pageMetadata({
      locale: "ja",
      pathname: "/parts",
      title: "パーツ一覧",
      description: "ベイブレードXのパーツ一覧",
    });
    expect(metadata.alternates?.canonical).toBe("https://oldbabyinfo.dev/ja/parts");
  });

  it("includes the Google Search Console verification token", () => {
    expect(pageMetadata({
      locale: "zh-TW",
      title: "首頁",
      description: "OldBabyInfo",
    }).verification?.google).toBe("6KE8Qp5p0dXMp1etepmmhRmw7fG_SRwVuBampfeCL5M");
  });
});
