import { describe, expect, it } from "vitest";
import { getAllGuides, getGuideBySlug } from "./repository.ts";

/** Reads the real content/guides tree — these are the published articles, not
 *  fixtures, so the assertions stay about shape and ordering rules rather
 *  than about any one article's wording. */
describe("getAllGuides", () => {
  it("walks the curated newcomer path, not the alphabetical file listing", () => {
    const slugs = getAllGuides("zh-TW").map((guide) => guide.slug);

    expect(slugs).toEqual([
      "what-to-buy",
      "getting-started",
      "basic-rules",
      "choosing-a-launcher",
      "stadium-differences",
      "joining-events",
    ]);
    // Alphabetical would open on basic-rules and bury getting-started third.
    expect(slugs).not.toEqual([...slugs].sort());
  });

  it("carries each article's own headings so the index can show real structure", () => {
    const gettingStarted = getAllGuides("zh-TW").find((g) => g.slug === "getting-started");

    expect(gettingStarted?.sections).toEqual(["三個部位各自負責什麼", "Combo 的數值怎麼合成"]);
    // Every published guide has real sections to show; an index row that fell
    // back to an empty list would be a silently broken one.
    for (const guide of getAllGuides("zh-TW")) {
      expect(guide.sections.length).toBeGreaterThan(0);
    }
  });

  it("only lists h2 sections, so a deeper subheading cannot bloat the index", () => {
    for (const guide of getAllGuides("zh-TW")) {
      const body = getGuideBySlug("zh-TW", guide.slug)?.content ?? "";
      const h2Count = body.split("\n").filter((line) => /^##\s/.test(line)).length;
      expect(guide.sections).toHaveLength(h2Count);
    }
  });

  it("returns an empty list for a locale whose guides are not translated yet", () => {
    // An honest editorial state the page renders as its own panel, not an error.
    expect(getAllGuides("en")).toEqual([]);
    expect(getAllGuides("ja")).toEqual([]);
  });
});

describe("reading order", () => {
  it("keeps every published article reachable exactly once", () => {
    const guides = getAllGuides("zh-TW");
    const slugs = guides.map((guide) => guide.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(getGuideBySlug("zh-TW", slug)).toBeDefined();
    }
  });

  it("gives the curated path a contiguous order starting at 1", () => {
    // A gap or a duplicate would still render, but it would mean an author
    // edited one file and forgot its neighbour.
    const orders = getAllGuides("zh-TW").map((guide) => guide.order);

    expect(orders).toEqual(orders.map((_, index) => index + 1));
  });
});
