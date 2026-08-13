import { describe, expect, it, vi } from "vitest";
import { createSqlOfferReader, type AffiliateSqlClient } from "./sql-repository.ts";

function row(overrides: Record<string, unknown> = {}) {
  return {
    projectName: "old-baby-info",
    id: "funbox-x-launcher",
    sponsored: false,
    title: "Funbox 競技場與發射器",
    url: "https://shop.funbox.com.tw/categories/XI/KB",
    partner: "Funbox",
    priority: 5,
    ...overrides,
  };
}

function clientReturning(rows: unknown[], assert?: AffiliateSqlClient["query"]): AffiliateSqlClient {
  return {
    async query(text, params) {
      await assert?.(text, params);
      return { rows };
    },
  };
}

describe("createSqlOfferReader", () => {
  it("scopes the query to the requested project and only enabled rows", async () => {
    const sql = clientReturning([row()], async (text, params) => {
      expect(text).toContain("project_name = $1");
      expect(text).toContain("enabled = TRUE");
      expect(params).toEqual(["old-baby-info"]);
      return { rows: [] };
    });

    await expect(createSqlOfferReader(sql).listEnabled("old-baby-info")).resolves.toEqual([
      {
        projectName: "old-baby-info",
        id: "funbox-x-launcher",
        sponsored: false,
        title: "Funbox 競技場與發射器",
        url: "https://shop.funbox.com.tw/categories/XI/KB",
        partner: "Funbox",
        priority: 5,
      },
    ]);
  });

  it("orders by priority then id, so the order is stable across equal priorities", async () => {
    const sql = clientReturning([], async (text) => {
      expect(text).toContain("ORDER BY priority DESC, id ASC");
      return { rows: [] };
    });

    await expect(createSqlOfferReader(sql).listEnabled("old-baby-info")).resolves.toEqual([]);
  });

  it("keeps a partner without a recorded name — the title carries the label", async () => {
    const sql = clientReturning([row({ partner: null })]);
    const offers = await createSqlOfferReader(sql).listEnabled("old-baby-info");
    expect(offers).toHaveLength(1);
    expect(offers[0]?.partner).toBeNull();
  });

  it("skips a row whose URL carries a script payload and keeps the rest", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const sql = clientReturning([
      row({ id: "poisoned", url: "javascript:alert(1)" }),
      row({ id: "clean" }),
    ]);

    const offers = await createSqlOfferReader(sql).listEnabled("old-baby-info");

    expect(offers.map((offer) => offer.id)).toEqual(["clean"]);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it("skips a row still carrying the produce site's {crop} placeholder", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const sql = clientReturning([
      row({ id: "templated", partner: "{crop}直送" }),
      row({ id: "clean" }),
    ]);

    const offers = await createSqlOfferReader(sql).listEnabled("old-baby-info");

    expect(offers.map((offer) => offer.id)).toEqual(["clean"]);
    error.mockRestore();
  });

  it("skips a row missing a required column rather than failing the whole read", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const sql = clientReturning([{ id: "half-written" }, row({ id: "clean" })]);

    const offers = await createSqlOfferReader(sql).listEnabled("old-baby-info");

    expect(offers.map((offer) => offer.id)).toEqual(["clean"]);
    error.mockRestore();
  });
});
