import { describe, expect, it } from "vitest";
import {
  diffAgainstExisting,
  exceedsFailureRate,
  formatIngestSummary,
  isPlausibleEventDate,
  type IngestReport,
} from "./ingest-diff.ts";
import type { Event } from "./schema.ts";
import type { SheetRowResult } from "./csv-source.ts";

describe("exceedsFailureRate", () => {
  it("does not trip on routine typo-level noise (2 bad rows in ~700)", () => {
    expect(exceedsFailureRate(2, 700)).toBe(false);
  });

  it("trips when a large fraction of rows fail — likely a format break", () => {
    expect(exceedsFailureRate(150, 700)).toBe(true);
  });

  it("respects a custom threshold", () => {
    expect(exceedsFailureRate(5, 100, 0.03)).toBe(true);
    expect(exceedsFailureRate(2, 100, 0.03)).toBe(false);
  });

  it("never divides by zero when there are no data rows", () => {
    expect(exceedsFailureRate(0, 0)).toBe(false);
  });
});

describe("isPlausibleEventDate", () => {
  const now = new Date("2026-07-25T00:00:00Z");

  it("accepts a date within the next year", () => {
    expect(isPlausibleEventDate("2026-08-15", now)).toBe(true);
  });

  it("accepts a date within the past year", () => {
    expect(isPlausibleEventDate("2026-01-01", now)).toBe(true);
  });

  it("rejects a date more than a year in the future — likely a parsing mistake", () => {
    expect(isPlausibleEventDate("2028-01-01", now)).toBe(false);
  });

  it("rejects a date more than a year in the past", () => {
    expect(isPlausibleEventDate("2020-01-01", now)).toBe(false);
  });
});

function event(overrides: Partial<Event> = {}): Event {
  return {
    id: "e1",
    tier: "G3",
    venueName: "測試店",
    venueAddress: "測試地址",
    date: "2026-07-11",
    time: "14:00",
    capacity: 32,
    registrationMethod: "onsite",
    ageCategory: "公開 (6歲以上)",
    sourceUrl: "https://example.com",
    results: null,
    ...overrides,
  };
}

function parsedRow(ev: Event, rawRow = "raw"): SheetRowResult {
  return { status: "parsed", event: ev, rawRow };
}

describe("diffAgainstExisting", () => {
  it("classifies a new id as added", () => {
    const report = diffAgainstExisting([parsedRow(event({ id: "new" }))], []);
    expect(report.added).toHaveLength(1);
    expect(report.changed).toHaveLength(0);
    expect(report.unchanged).toBe(0);
  });

  it("classifies a byte-identical existing record as unchanged, not added or changed", () => {
    const existing = event({ id: "e1", sourceExcerpt: "raw" });
    const report = diffAgainstExisting([parsedRow(event({ id: "e1" }))], [existing]);
    expect(report.unchanged).toBe(1);
    expect(report.added).toHaveLength(0);
    expect(report.changed).toHaveLength(0);
  });

  it("classifies a same-id record with different content as changed", () => {
    const existing = event({ id: "e1", capacity: 32 });
    const updated = event({ id: "e1", capacity: 48 });
    const report = diffAgainstExisting([parsedRow(updated)], [existing]);
    expect(report.changed).toHaveLength(1);
    expect(report.changed[0]!.before.capacity).toBe(32);
    expect(report.changed[0]!.after.capacity).toBe(48);
  });

  it("ignores failed and header rows — only 'parsed' rows enter the diff", () => {
    const rows: SheetRowResult[] = [
      { status: "failed", rawRow: "bad row", reason: "nope" },
      { status: "skipped_header" },
      parsedRow(event({ id: "e1" })),
    ];
    const report = diffAgainstExisting(rows, []);
    expect(report.added).toHaveLength(1);
    expect(report.failed).toEqual([{ rawRow: "bad row", reason: "nope" }]);
  });

  it("keeps the raw source row alongside each added/changed entry (ticket 32's Source Excerpt)", () => {
    const report = diffAgainstExisting([parsedRow(event({ id: "e1" }), "1,測試店,...")], []);
    expect(report.added[0]!.rawRow).toBe("1,測試店,...");
    expect(report.added[0]!.event.sourceExcerpt).toBe("1,測試店,...");
  });

  it("does not classify the same source row as changed after its excerpt was persisted", () => {
    const existing = event({ id: "e1", sourceExcerpt: "1,測試店,..." });
    const report = diffAgainstExisting([parsedRow(event({ id: "e1" }), "1,測試店,...")], [existing]);

    expect(report.unchanged).toBe(1);
    expect(report.changed).toHaveLength(0);
  });

  it("classifies an existing id missing from the sheet as removed", () => {
    const existing = [event({ id: "kept", sourceExcerpt: "raw" }), event({ id: "cancelled" })];
    const report = diffAgainstExisting([parsedRow(event({ id: "kept" }))], existing);

    expect(report.removed.map(({ event }) => event.id)).toEqual(["cancelled"]);
    expect(report.added).toHaveLength(0);
    expect(report.changed).toHaveLength(0);
  });

  it("reports no removals when every sheet row failed to parse — that is a fetch problem, not a cancellation", () => {
    const rows: SheetRowResult[] = [
      { status: "failed", rawRow: "bad row", reason: "nope" },
      { status: "skipped_header" },
    ];
    const report = diffAgainstExisting(rows, [event({ id: "e1" }), event({ id: "e2" })]);

    expect(report.removed).toHaveLength(0);
  });
});

describe("formatIngestSummary", () => {
  /** The shape of the 2026-08-08 scheduled run, which is what broke the PR step. */
  function realisticReport(): IngestReport {
    return {
      added: Array.from({ length: 14 }, (_, i) => ({
        event: event({ id: `b4-g3-2026-09-0${i % 9}-1500-陳媽媽玩具-竹北店-${700 + i}` }),
        rawRow: `${700 + i},陳媽媽玩具 竹北店,03-668-3738,新竹縣竹北市莊敬北路276號,2026/9/5,15:00,32,線上,公開 (6歲以上)`,
      })),
      changed: Array.from({ length: 691 }, (_, i) => ({
        before: event({ id: `e${i}` }),
        after: event({ id: `b4-g3-2026-08-16-1600-陳媽媽玩具-中和店-${i}` }),
        rawRow: `${i},陳媽媽玩具 中和店,02-2221-7688,新北市中和區建一路251號,2026/8/16,16:00,24,線上,公開 (6歲以上)`,
      })),
      removed: [
        {
          event: event({ id: "funbox-g3-2026-09-12-1400-創勝玩具-北屯店-402" }),
          reason: "missing from source sheet",
        },
      ],
      unchanged: 74,
      failed: [
        {
          rawRow: "395,創勝玩具批發,04-22991727,台中市北區陜西路35號,2026/726,13:30,16,門市社群,公開 (6歲以上)",
          reason: "Invalid ISO date",
        },
        {
          rawRow: "634,TTC小車工作室,933928761,台北市士林區承德路四段80巷45號,2026/7/25,15.:00,16,線上,公開 (6歲以上)",
          reason: 'Unparseable time: "15.:00"',
        },
      ],
    };
  }

  it("stays small enough to survive being passed as an environment variable", () => {
    // The bug this exists for: the same report renders as ~134 KB of Chinese
    // in the old full-diff body, past Linux's 128 KB limit for a single
    // environment variable, so create-pull-request died with E2BIG before
    // opening any PR — 12 nights in a row after a successful fetch.
    const summary = formatIngestSummary(realisticReport());
    expect(new TextEncoder().encode(summary).byteLength).toBeLessThanOrEqual(8_000);
  });

  it("leads with the counts so a reviewer sees the shape of the change first", () => {
    expect(formatIngestSummary(realisticReport()).split("\n")[0]).toBe(
      "14 added, 691 changed, 1 removed, 74 unchanged, 2 failed.",
    );
  });

  it("lists every dropped row in full — that is the part asking for action", () => {
    const summary = formatIngestSummary(realisticReport());
    expect(summary).toContain("2026/726");
    expect(summary).toContain("Invalid ISO date");
    expect(summary).toContain('Unparseable time: "15.:00"');
  });

  it("names each removed event so a reviewer can confirm the cancellation is real", () => {
    const summary = formatIngestSummary(realisticReport());
    expect(summary).toContain("移除");
    expect(summary).toContain("funbox-g3-2026-09-12-1400-創勝玩具-北屯店-402");
    expect(summary).toContain("missing from source sheet");
  });

  it("caps long sections and says how many were left out", () => {
    const summary = formatIngestSummary(realisticReport(), { maxRowsPerSection: 5 });
    expect(summary).toContain("…另有 686 筆，見 job log。");
  });

  it("truncates without leaving a half-decoded character", () => {
    const summary = formatIngestSummary(realisticReport(), { maxBytes: 400 });
    expect(new TextEncoder().encode(summary).byteLength).toBeLessThanOrEqual(400);
    expect(summary).not.toContain("\uFFFD");
    expect(summary).toContain("摘要已截斷");
  });

  it("still produces a usable line when nothing changed", () => {
    const summary = formatIngestSummary({ added: [], changed: [], removed: [], unchanged: 767, failed: [] });
    expect(summary).toBe("0 added, 0 changed, 0 removed, 767 unchanged, 0 failed.");
  });
});
