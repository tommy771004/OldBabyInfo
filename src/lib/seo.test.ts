import { describe, expect, it } from "vitest";
import { SITE_URL, localizedAlternates, localizedPath, pageMetadata, serializeJsonLd } from "./seo.ts";

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

describe("serializeJsonLd", () => {
  it("stays valid JSON for the structured data consumers", () => {
    const data = { "@type": "WebPage", name: "Dran Sword" };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it("cannot be broken out of with a closing script tag", () => {
    // Part names and Aliases are ingested data, so a hostile string reaching
    // the JSON-LD block is a live path, not a hypothetical one.
    const payload = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(payload).not.toContain("</script>");
    expect(payload).not.toContain("<");
    expect(JSON.parse(payload).name).toBe("</script><script>alert(1)</script>");
  });

  it("escapes the line terminators that are legal in JSON but not in a script", () => {
    const payload = serializeJsonLd({ name: "a\u2028b\u2029c" });
    expect(payload).not.toContain("\u2028");
    expect(payload).not.toContain("\u2029");
    expect(JSON.parse(payload).name).toBe("a\u2028b\u2029c");
  });
});
