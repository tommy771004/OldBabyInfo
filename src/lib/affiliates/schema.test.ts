import { describe, expect, it, vi } from "vitest";
import { offerLabel, parseOffers } from "./schema.ts";

const valid = {
  projectName: "old-baby-info",
  id: "funbox-x-launcher",
  sponsored: true,
  title: "Funbox 競技場與發射器",
  url: "https://shop.funbox.com.tw/categories/XI/KB",
  partner: "Funbox",
  priority: 5,
};

describe("parseOffers", () => {
  it("accepts a row whose partner column is absent entirely", () => {
    const withoutPartner: Record<string, unknown> = { ...valid };
    delete withoutPartner.partner;
    expect(parseOffers([withoutPartner])[0]?.partner).toBeNull();
  });

  it.each([
    ["a data: URL", { url: "data:text/html,<script>alert(1)</script>" }],
    ["a blank title", { title: "   " }],
    ["a non-integer priority", { priority: 1.5 }],
    ["a missing project name", { projectName: "" }],
    // The URL carries {crop} too (spec §4.1). This placement fills nothing
    // in, so the link would survive the protocol check and then land the
    // reader on a literal `q={crop}` search — breakage after the click.
    ["a URL still carrying {crop}", { url: "https://example.com/search?q={crop}" }],
  ])("rejects %s", (_label, override) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(parseOffers([{ ...valid, ...override }])).toEqual([]);
    error.mockRestore();
  });

  it("keeps an http URL — the spec allows both http and https", () => {
    expect(parseOffers([{ ...valid, url: "http://example.com/promo" }])).toHaveLength(1);
  });
});

describe("offerLabel", () => {
  it("names the partner when one is recorded", () => {
    expect(offerLabel(parseOffers([valid])[0]!)).toBe("Funbox");
  });

  it("falls back to the offer title when no partner is recorded", () => {
    expect(offerLabel(parseOffers([{ ...valid, partner: null }])[0]!)).toBe(
      "Funbox 競技場與發射器",
    );
  });
});
