import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Part } from "../parts/schema.ts";
import { parseComboSlugs } from "../parts/combo-query.ts";
import { slugify } from "../parts/slug.ts";
import { comboSubjectsForThreads } from "./combo-subjects.ts";
import { latestThreadsBySubject } from "./feed.ts";
import type { Thread } from "./rules.ts";

const common = {
  aliases: [], moldBatches: [], generation: "X" as const, releaseAt: "2023-07-15",
  stats: { attack: 1, defense: 1, stamina: 1 }, statEditions: [],
};
const parts: Part[] = [
  { ...common, id: "BLADE", type: "blade", nameEn: "Test Blade", nameJa: "テストブレード", nameZhTw: "測試 Blade", playstyle: "attack", modes: [] },
  { ...common, id: "3-60", type: "ratchet", nameEn: "3-60", height: 60 },
  { ...common, id: "F", type: "bit", nameEn: "Flat", nameJa: "フラット", nameZhTw: "平坦", stats: { ...common.stats, xDash: 1, burstResistance: 1 }, playstyle: "attack", modes: [] },
];
function thread(overrides: Partial<Thread> = {}): Thread {
  return {
    id: "thread-1", subjectType: "combo", subjectId: "BLADE|3-60|F",
    authorId: "user-1", body: "Fixture observation", createdAt: "2026-08-01T00:00:00.000Z", hiddenAt: null,
    ...overrides,
  };
}

describe("Combo discussion subjects", () => {
  it.each([
    ["zh-TW", "/combo", "測試 Blade / 3-60 / 平坦"],
    ["ja", "/ja/combo", "テストブレード / 3-60 / フラット"],
    ["en", "/en/combo", "Test Blade / 3-60 / Flat"],
  ] as const)("resolves %s labels and a URL that restores every slot", (locale, pathname, name) => {
    const subjects = comboSubjectsForThreads([thread()], parts, locale);
    expect(subjects).toHaveLength(1);
    expect(subjects[0]).toMatchObject({ type: "combo", id: "BLADE|3-60|F", name });
    const url = new URL(subjects[0]!.href, "https://example.com");
    expect(url.pathname).toBe(pathname);
    const slugs = parseComboSlugs(Object.fromEntries(url.searchParams));
    expect([slugs.blade, slugs.ratchet, slugs.bit]).toEqual(parts.map((part) => slugify(part.nameEn)));
  });

  it("keeps a real Combo thread in the feed instead of silently dropping it", () => {
    const threads = [thread(), thread({ id: "newer", createdAt: "2026-08-02T00:00:00.000Z" })];
    const subjects = comboSubjectsForThreads(threads, parts, "en");
    expect(subjects).toHaveLength(1);
    expect(latestThreadsBySubject(threads, subjects, "combo").map((item) => item.thread.id)).toEqual(["newer"]);
  });

  it.each(["", "BLADE|3-60", "BLADE|3-60|F|EXTRA", "BLADE||F", "UNKNOWN|3-60|F", "test-blade|3-60|flat", "F|3-60|BLADE"])(
    "rejects malformed, unknown or wrong-slot IDs: %s",
    (subjectId) => expect(comboSubjectsForThreads([thread({ subjectId })], parts, "en")).toEqual([]),
  );

  it("does not create descriptors for hidden or non-Combo threads", () => {
    expect(comboSubjectsForThreads([
      thread({ hiddenAt: "2026-08-02T00:00:00.000Z" }),
      thread({ subjectType: "part", subjectId: "BLADE" }),
    ], parts, "en")).toEqual([]);
  });

  it("is wired into the public discussion page after reading threads", () => {
    const page = readFileSync("src/app/[locale]/discussion/page.tsx", "utf8");
    expect(page).toContain("...comboSubjectsForThreads(threads, getAllParts(), locale)");
    expect(page).toContain("latestThreadsBySubject(threads, subjects)");
  });
});
