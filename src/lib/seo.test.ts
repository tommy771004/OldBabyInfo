import { describe, expect, it } from "vitest";
import { SITE_URL, localizedAlternates, localizedPath, pageMetadata } from "./seo.ts";

describe("localized SEO URLs", () => {
  it("keeps the default locale unprefixed and prefixes Japanese and English", () => {
    expect(localizedPath("zh-TW", "/parts")).toBe("/parts");
    expect(localizedPath("ja", "/parts")).toBe("/ja/parts");
    expect(localizedPath("en", "/parts")).toBe("/en/parts");
  });

  it("emits reciprocal locale alternates with x-default", () => {
    expect(localizedAlternates("/parts").languages).toMatchObject({
      "zh-TW": `${SITE_URL}/parts`,
      ja: `${SITE_URL}/ja/parts`,
      en: `${SITE_URL}/en/parts`,
      "x-default": `${SITE_URL}/parts`,
    });
  });

  it("uses the current locale for the canonical URL", () => {
    const metadata = pageMetadata({
      locale: "ja",
      pathname: "/parts",
      title: "パーツ一覧",
      description: "ベイブレードXのパーツ一覧",
    });
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/ja/parts`);
  });

  it("includes the Google Search Console verification token", () => {
    expect(pageMetadata({
      locale: "zh-TW",
      title: "首頁",
      description: "OldBabyInfo",
    }).verification?.google).toBe("6KE8Qp5p0dXMp1etepmmhRmw7fG_SRwVuBampfeCL5M");
  });
});
