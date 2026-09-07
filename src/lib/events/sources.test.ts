import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  eventSourcesFileSchema,
  everySourceExpired,
  expiredSources,
  type EventSource,
} from "./sources.ts";

function source(overrides: Partial<EventSource> = {}): EventSource {
  return {
    id: "s1",
    label: "測試時間表 2026 7~8月",
    sheetId: "sheet",
    gid: "0",
    year: 2026,
    coversFrom: "2026-07-01",
    coversUntil: "2026-08-31",
    ...overrides,
  };
}

describe("event source registry", () => {
  it("accepts the real data/event-sources.json", () => {
    const parsed = eventSourcesFileSchema.parse(
      JSON.parse(readFileSync("data/event-sources.json", "utf-8")),
    );
    expect(parsed.length).toBeGreaterThan(0);
    for (const entry of parsed) {
      expect(entry.coversFrom <= entry.coversUntil).toBe(true);
    }
  });

  it("rejects a file with no sources at all", () => {
    // An empty registry would make the ingest a silent no-op.
    expect(() => eventSourcesFileSchema.parse([])).toThrow();
  });

  it("rejects a guessed publisher URL that is not a URL", () => {
    expect(() => eventSourcesFileSchema.parse([{ ...source(), publisherUrl: "facebook" }])).toThrow();
  });
});

describe("expiry", () => {
  it("names a source whose period has already ended", () => {
    const spent = source({ id: "old", coversUntil: "2026-08-31" });
    const live = source({ id: "current", coversUntil: "2026-10-31" });

    expect(expiredSources([spent, live], "2026-09-07").map((s) => s.id)).toEqual(["old"]);
    expect(everySourceExpired([spent, live], "2026-09-07")).toBe(false);
  });

  it("flags the case that actually happened: every source spent at once", () => {
    // The organisers publish a new spreadsheet per period rather than
    // extending the old one, so both configured sheets died on the same day
    // and the pipeline kept running green with nothing new to find.
    const sources = [source({ id: "a" }), source({ id: "b" })];
    expect(everySourceExpired(sources, "2026-09-07")).toBe(true);
  });

  it("treats the final covered day as still live", () => {
    expect(expiredSources([source()], "2026-08-31")).toEqual([]);
    expect(expiredSources([source()], "2026-09-01")).toHaveLength(1);
  });

  it("reports nothing for an empty list rather than claiming everything expired", () => {
    expect(everySourceExpired([], "2026-09-07")).toBe(false);
  });
});
