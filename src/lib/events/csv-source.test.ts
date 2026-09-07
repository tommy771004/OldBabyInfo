import { describe, expect, it } from "vitest";
import {
  REGISTRATION_METHOD,
  parseSheetCapacity,
  parseSheetDate,
  parseSheetRow,
  parseSheetTime,
  slugifySheetVenue,
} from "./csv-source.ts";

describe("parseSheetDate", () => {
  it("parses a date that already has a year", () => {
    expect(parseSheetDate("2026/7/12", 2025)).toBe("2026-07-12");
  });

  it("uses the fallback year when the date has no year of its own", () => {
    expect(parseSheetDate("7/11", 2026)).toBe("2026-07-11");
  });

  it("tolerates a real trailing-slash typo without dropping the date", () => {
    expect(parseSheetDate("2026/8/9/", 2025)).toBe("2026-08-09");
  });

  it("throws on genuinely unparseable input", () => {
    expect(() => parseSheetDate("not-a-date", 2026)).toThrow("Unparseable date");
  });
});

describe("parseSheetCapacity", () => {
  it("parses a plain number", () => {
    expect(parseSheetCapacity("32")).toBe(32);
  });

  it("takes the lower bound of a real range like '32-48'", () => {
    expect(parseSheetCapacity("32-48")).toBe(32);
  });

  it("throws when there's no number at all", () => {
    expect(() => parseSheetCapacity("none")).toThrow("Unparseable capacity");
  });
});

describe("parseSheetTime", () => {
  it("zero-pads a single-digit hour", () => {
    expect(parseSheetTime("9:00")).toBe("09:00");
  });

  it("leaves an already-padded time alone", () => {
    expect(parseSheetTime("14:00")).toBe("14:00");
  });

  it("throws on a malformed time", () => {
    expect(() => parseSheetTime("2pm")).toThrow("Unparseable time");
  });
});

describe("slugifySheetVenue", () => {
  it("lowercases and hyphenates a real venue name", () => {
    expect(slugifySheetVenue("潤泰南港車站店")).toBe("潤泰南港車站店");
  });
});

describe("parseSheetRow", () => {
  const HEADER = "編號,店名,,地址,日期,時間,人數,報名方式,年齡";
  function dataRow(overrides: Partial<Record<string, string>> = {}): string {
    const fields = {
      no: "1",
      venue: "測試店",
      blank: "",
      address: "台北市測試路1號",
      date: "7/11",
      time: "14:00",
      capacity: "32",
      method: "現場",
      age: "公開 (6歲以上)",
      ...overrides,
    };
    return [fields.no, fields.venue, fields.blank, fields.address, fields.date, fields.time, fields.capacity, fields.method, fields.age].join(",");
  }

  it("skips the header row without treating it as a failure", () => {
    const result = parseSheetRow(HEADER, "test", "sheet1", 2026);
    expect(result.status).toBe("skipped_header");
  });

  it("parses a well-formed real data row into a valid Event", () => {
    const result = parseSheetRow(dataRow(), "test", "sheet1", 2026);
    expect(result.status).toBe("parsed");
    expect(result.event).toMatchObject({
      venueName: "測試店",
      date: "2026-07-11",
      time: "14:00",
      capacity: 32,
      registrationMethod: "onsite",
    });
  });

  it("keeps the raw row text alongside a parsed Event as its excerpt", () => {
    const row = dataRow();
    const result = parseSheetRow(row, "test", "sheet1", 2026);
    expect(result.rawRow).toBe(row);
  });

  it("reports a genuinely unknown registration method as a failure, not a silent skip", () => {
    const result = parseSheetRow(dataRow({ method: "不明方式" }), "test", "sheet1", 2026);
    expect(result.status).toBe("failed");
    expect(result.reason).toContain("unknown registration method");
    // The excerpt survives even on failure — a reviewer needs to see what
    // the bad row actually said, not just that something went wrong.
    expect(result.rawRow).toBeTruthy();
  });

  it("reports an unparseable date as a failure with the raw row preserved", () => {
    const result = parseSheetRow(dataRow({ date: "not-a-date" }), "test", "sheet1", 2026);
    expect(result.status).toBe("failed");
    expect(result.reason).toContain("Unparseable date");
  });

describe("registration methods added by the 2026-9、10月 sheet", () => {
  it("maps the two channels that first appeared there", () => {
    // Unmapped, these took every row of 漢謚玩具社 and 雄大書局-鼎山店 with
    // them — the whole of two Kaohsiung venues, invisible on the calendar.
    expect(REGISTRATION_METHOD["FB報名"]).toBe("store_community");
    expect(REGISTRATION_METHOD["線上(抽選)"]).toBe("online");
  });

  it("still refuses a channel it has never seen", () => {
    expect(REGISTRATION_METHOD["臨櫃抽籤"]).toBeUndefined();
  });
});
});
