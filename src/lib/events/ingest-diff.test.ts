import { describe, expect, it } from "vitest";
import { diffAgainstExisting, exceedsFailureRate, isPlausibleEventDate } from "./ingest-diff.ts";
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
    const existing = event({ id: "e1" });
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
  });

  it("keeps the raw source row alongside each added/changed entry (ticket 32's Source Excerpt)", () => {
    const report = diffAgainstExisting([parsedRow(event({ id: "e1" }), "1,測試店,...")], []);
    expect(report.added[0]!.rawRow).toBe("1,測試店,...");
  });
});
