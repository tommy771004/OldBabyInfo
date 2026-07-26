import { describe, expect, it } from "vitest";
import { eventLeadsFileSchema, mergeEventLeads } from "./leads.ts";

describe("event leads", () => {
  it("accepts a short HackMD lead that points back to the original Event sheet", () => {
    const result = eventLeadsFileSchema.safeParse([{
      eventId: "event-1",
      sourceUrl: "https://docs.google.com/spreadsheets/d/example",
      sourceExcerpt: "8/1 潤泰南港車站店",
    }]);
    expect(result.success).toBe(true);
  });

  it("rejects duplicate leads for the same Event", () => {
    const result = eventLeadsFileSchema.safeParse([
      { eventId: "event-1", sourceUrl: "https://example.com/a", sourceExcerpt: "a" },
      { eventId: "event-1", sourceUrl: "https://example.com/b", sourceExcerpt: "b" },
    ]);
    expect(result.success).toBe(false);
  });

  it("retains previous leads and replaces only the Event IDs present in a new source run", () => {
    expect(mergeEventLeads(
      [{ eventId: "event-2", sourceUrl: "https://example.com/old", sourceExcerpt: "old" }],
      [{ eventId: "event-1", sourceUrl: "https://example.com/new", sourceExcerpt: "new" }],
    )).toEqual([
      { eventId: "event-1", sourceUrl: "https://example.com/new", sourceExcerpt: "new" },
      { eventId: "event-2", sourceUrl: "https://example.com/old", sourceExcerpt: "old" },
    ]);
  });
});
