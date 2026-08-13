import { describe, expect, it } from "vitest";
import { parseAffiliateEvent } from "./affiliate-event.ts";

const valid = {
  action: "affiliate_click",
  target: "funbox-x-launcher",
  metadata: {
    project_name: "old-baby-info",
    sponsored: true,
    partner: "Funbox",
    placement: "home-footer",
  },
};

describe("parseAffiliateEvent", () => {
  it("accepts the two actions the spec defines", () => {
    expect(parseAffiliateEvent(valid).ok).toBe(true);
    expect(parseAffiliateEvent({ ...valid, action: "affiliate_impression" }).ok).toBe(true);
  });

  it("refuses an action outside those two", () => {
    expect(parseAffiliateEvent({ ...valid, action: "page_view" }).ok).toBe(false);
    expect(parseAffiliateEvent({ ...valid, action: "affiliate_purchase" }).ok).toBe(false);
  });

  it("drops metadata the caller was not invited to send", () => {
    const parsed = parseAffiliateEvent({
      ...valid,
      metadata: {
        ...valid.metadata,
        // What a forged caller would try to attach to a person.
        ip: "203.0.113.7",
        user_id: "user-1",
        user_agent: "Mozilla/5.0",
      },
    });

    expect(parsed.ok).toBe(true);
    expect(Object.keys(parsed.event!.metadata).sort()).toEqual([
      "partner",
      "placement",
      "project_name",
      "sponsored",
    ]);
  });

  it("keeps an offer with no partner recorded", () => {
    const parsed = parseAffiliateEvent({
      ...valid,
      metadata: { ...valid.metadata, partner: null },
    });
    expect(parsed.event?.metadata.partner).toBeNull();
  });

  it("refuses an oversized target rather than writing it to the log", () => {
    expect(parseAffiliateEvent({ ...valid, target: "x".repeat(201) }).ok).toBe(false);
  });

  it("refuses a body that is not an event at all", () => {
    for (const body of [null, "affiliate_click", [], {}, { action: "affiliate_click" }]) {
      expect(parseAffiliateEvent(body).ok).toBe(false);
    }
  });

  it("requires the placement, so clicks stay separable by slot", () => {
    const withoutPlacement: Record<string, unknown> = { ...valid.metadata };
    delete withoutPlacement.placement;
    expect(parseAffiliateEvent({ ...valid, metadata: withoutPlacement }).ok).toBe(false);
  });
});
