import { describe, expect, it } from "vitest";
import {
  applyFilters,
  filterOptions,
  groupEvents,
  OTHER_CITY,
  paginateDateGroups,
  splitScope,
} from "./calendar.ts";
import type { Event } from "./schema.ts";

function event(overrides: Partial<Event> = {}): Event {
  return {
    id: Math.random().toString(36).slice(2),
    tier: "G3",
    venueName: "測試店",
    venueAddress: "高雄市鳳山區文德路138號2樓",
    date: "2026-07-26",
    time: "14:00",
    capacity: 32,
    registrationMethod: "onsite",
    ageCategory: "公開 (6歲以上)",
    sourceUrl: "https://example.com",
    results: null,
    ...overrides,
  };
}

describe("splitScope", () => {
  it("splits on today, counting an event happening today as upcoming", () => {
    const events = [event({ date: "2026-07-25" }), event({ date: "2026-07-26" }), event({ date: "2026-07-27" })];
    const { upcoming, past } = splitScope(events, "2026-07-26");
    expect(upcoming).toHaveLength(2);
    expect(past).toHaveLength(1);
  });
});

describe("groupEvents", () => {
  it("nests date → city → venue → sessions", () => {
    const groups = groupEvents(
      [
        event({ date: "2026-07-26", venueName: "甲店", venueAddress: "高雄市A路1號", time: "14:00" }),
        event({ date: "2026-07-26", venueName: "甲店", venueAddress: "高雄市A路1號", time: "15:00" }),
        event({ date: "2026-07-26", venueName: "乙店", venueAddress: "台北市B路2號", time: "13:00" }),
      ],
      "upcoming",
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]!.eventCount).toBe(3);
    const cities = groups[0]!.cities.map((c) => c.city);
    // 台北市 ranks north of 高雄市, so it comes first regardless of input order.
    expect(cities).toEqual(["台北市", "高雄市"]);
    const kaohsiung = groups[0]!.cities.find((c) => c.city === "高雄市")!;
    expect(kaohsiung.venues).toHaveLength(1);
    expect(kaohsiung.venues[0]!.sessions.map((s) => s.time)).toEqual(["14:00", "15:00"]);
  });

  it("orders upcoming dates nearest-first and past dates most-recent-first", () => {
    const events = [event({ date: "2026-07-28" }), event({ date: "2026-07-26" }), event({ date: "2026-07-27" })];
    expect(groupEvents(events, "upcoming").map((g) => g.date)).toEqual([
      "2026-07-26",
      "2026-07-27",
      "2026-07-28",
    ]);
    expect(groupEvents(events, "past").map((g) => g.date)).toEqual([
      "2026-07-28",
      "2026-07-27",
      "2026-07-26",
    ]);
  });

  it("puts addresses with no parseable 縣市 in a null bucket, sorted last, never dropped", () => {
    const groups = groupEvents(
      [event({ venueAddress: "中山路一段100號" }), event({ venueAddress: "台北市B路2號" })],
      "upcoming",
    );
    const cities = groups[0]!.cities.map((c) => c.city);
    expect(cities).toEqual(["台北市", null]);
    expect(groups[0]!.eventCount).toBe(2);
  });

  it("sorts venues within a city by their earliest session time", () => {
    const groups = groupEvents(
      [
        event({ venueName: "晚店", time: "20:00" }),
        event({ venueName: "早店", time: "09:00" }),
      ],
      "upcoming",
    );
    expect(groups[0]!.cities[0]!.venues.map((v) => v.venueName)).toEqual(["早店", "晚店"]);
  });
});

describe("applyFilters", () => {
  const events = [
    event({ venueAddress: "高雄市A路1號", registrationMethod: "onsite", ageCategory: "公開 (6歲以上)" }),
    event({ venueAddress: "臺北市B路2號", registrationMethod: "online", ageCategory: "兒童 (6歲~12歲)" }),
    event({ venueAddress: "台北市C路3號", registrationMethod: "online", ageCategory: "通常 (6~12歲)" }),
  ];

  it("matches a city across 台/臺 spelling, because the filter value is normalised", () => {
    expect(applyFilters(events, { city: "台北市", registration: null, age: null })).toHaveLength(2);
  });

  it("matches an age bracket across its duplicate wording", () => {
    expect(applyFilters(events, { city: null, registration: null, age: "通常 (6~12歲)" })).toHaveLength(2);
  });

  it("combines filters as AND", () => {
    expect(
      applyFilters(events, { city: "台北市", registration: "online", age: "通常 (6~12歲)" }),
    ).toHaveLength(2);
    expect(
      applyFilters(events, { city: "高雄市", registration: "online", age: null }),
    ).toHaveLength(0);
  });

  it("returns everything when no filter is set", () => {
    expect(applyFilters(events, { city: null, registration: null, age: null })).toHaveLength(3);
  });

  it("filters to exactly the addresses with no parseable 縣市 via the other sentinel", () => {
    const withUnparseable = [...events, event({ venueAddress: "中山路一段100號" })];
    const result = applyFilters(withUnparseable, {
      city: OTHER_CITY,
      registration: null,
      age: null,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.venueAddress).toBe("中山路一段100號");
  });
});

describe("paginateDateGroups", () => {
  const groups = Array.from({ length: 32 }, (_, i) =>
    groupEvents([event({ date: `2026-07-${String(i + 1).padStart(2, "0")}` })], "upcoming")[0]!,
  );

  it("pages by date group, 5 per page", () => {
    const paged = paginateDateGroups(groups, 1);
    expect(paged.groups).toHaveLength(5);
    expect(paged.totalPages).toBe(7); // 32 dates / 5
    expect(paged.totalDates).toBe(32);
  });

  it("returns the remainder on the last page", () => {
    expect(paginateDateGroups(groups, 7).groups).toHaveLength(2);
  });

  it("clamps an out-of-range page instead of showing an empty list", () => {
    expect(paginateDateGroups(groups, 999).page).toBe(7);
    expect(paginateDateGroups(groups, 0).page).toBe(1);
    expect(paginateDateGroups(groups, -3).page).toBe(1);
  });

  it("reports at least one page even with no results, so the UI never divides by zero", () => {
    const empty = paginateDateGroups([], 1);
    expect(empty.totalPages).toBe(1);
    expect(empty.groups).toHaveLength(0);
    expect(empty.totalEvents).toBe(0);
  });
});

describe("filterOptions", () => {
  it("counts each option and orders cities geographically, other last", () => {
    const { cities } = filterOptions([
      event({ venueAddress: "高雄市A路1號" }),
      event({ venueAddress: "高雄市B路2號" }),
      event({ venueAddress: "臺北市C路3號" }),
      event({ venueAddress: "無法解析的地址" }),
    ]);
    expect(cities.map((c) => c.value)).toEqual(["台北市", "高雄市", OTHER_CITY]);
    expect(cities.find((c) => c.value === "高雄市")!.count).toBe(2);
  });

  it("never gives an option the empty-string value, which would collide with the 全部 option", () => {
    // Two <option>s sharing value="" makes a browser select the wrong one —
    // this shipped once as "其他" appearing pre-selected on an unfiltered page.
    const { cities, registrations, ages } = filterOptions([
      event({ venueAddress: "無法解析的地址" }),
      event({ venueAddress: "高雄市A路1號" }),
    ]);
    for (const option of [...cities, ...registrations, ...ages]) {
      expect(option.value).not.toBe("");
    }
  });

  it("ranks registration and age options by how common they really are", () => {
    const { registrations } = filterOptions([
      event({ registrationMethod: "online" }),
      event({ registrationMethod: "online" }),
      event({ registrationMethod: "phone" }),
    ]);
    expect(registrations[0]!.value).toBe("online");
    expect(registrations[0]!.count).toBe(2);
  });
});
