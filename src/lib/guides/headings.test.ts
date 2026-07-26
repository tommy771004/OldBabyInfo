import { describe, expect, it } from "vitest";
import { extractHeadings } from "./headings.ts";

describe("extractHeadings", () => {
  it("extracts level and text from markdown ATX headings", () => {
    const md = "# 標題一\n\n內文。\n\n## 小節\n\n更多內文。";
    expect(extractHeadings(md)).toEqual([
      { level: 1, text: "標題一", slug: "標題一" },
      { level: 2, text: "小節", slug: "小節" },
    ]);
  });

  it("ignores non-heading lines, including lines starting with # inside a sentence", () => {
    const md = "一般段落文字。\n\n## 真正的標題";
    expect(extractHeadings(md)).toEqual([{ level: 2, text: "真正的標題", slug: "真正的標題" }]);
  });

  it("disambiguates repeated heading text the same way GithubSlugger/rehype-slug does", () => {
    const md = "## 零件\n\n內文。\n\n## 零件";
    const headings = extractHeadings(md);
    expect(headings[0]!.slug).toBe("零件");
    expect(headings[1]!.slug).toBe("零件-1");
  });

  it("returns an empty list for content with no headings", () => {
    expect(extractHeadings("只是一段普通文字，沒有標題。")).toEqual([]);
  });
});
