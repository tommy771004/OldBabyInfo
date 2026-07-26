import { describe, expect, it } from "vitest";
import { createSqlStockListingStore, type SqlClient } from "./sql-store.ts";

describe("createSqlStockListingStore", () => {
  it("reads a nullable Part id and timestamp fields from the SQL boundary", async () => {
    const sql: SqlClient = {
      async query() {
        return {
          rows: [
            {
              id: "funbox-dran-sword",
              part_id: null,
              product_name: "Dran Sword",
              retailer: "Funbox",
              product_url: "https://example.com/dran-sword",
              price: 1299,
              stock_status: "out_of_stock",
              captured_at: "2026-07-25T12:00:00.000Z",
              last_attempt_at: "2026-07-26T12:00:00.000Z",
              scrape_status: "failed",
              error_message: "timeout",
            },
          ],
        };
      },
    };

    await expect(createSqlStockListingStore(sql).get("funbox-dran-sword")).resolves.toEqual({
      id: "funbox-dran-sword",
      partId: undefined,
      productName: "Dran Sword",
      retailer: "Funbox",
      productUrl: "https://example.com/dran-sword",
      price: 1299,
      stockStatus: "out_of_stock",
      capturedAt: "2026-07-25T12:00:00.000Z",
      lastAttemptAt: "2026-07-26T12:00:00.000Z",
      scrapeStatus: "failed",
      errorMessage: "timeout",
    });
  });

  it("upserts a complete snapshot through one parameterized query", async () => {
    const calls: { text: string; params: unknown[] }[] = [];
    const sql: SqlClient = {
      async query(text, params = []) {
        calls.push({ text, params });
        return { rows: [] };
      },
    };
    const store = createSqlStockListingStore(sql);

    await store.save({
      id: "funbox-dran-sword",
      partId: "dran-sword",
      productName: "Dran Sword",
      retailer: "Funbox",
      productUrl: "https://example.com/dran-sword",
      price: 1299,
      stockStatus: "in_stock",
      capturedAt: "2026-07-26T12:00:00.000Z",
      lastAttemptAt: "2026-07-26T12:00:00.000Z",
      scrapeStatus: "ok",
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.text).toContain("ON CONFLICT (id) DO UPDATE");
    expect(calls[0]?.params).toEqual([
      "funbox-dran-sword",
      "dran-sword",
      "Dran Sword",
      "Funbox",
      "https://example.com/dran-sword",
      1299,
      "in_stock",
      "2026-07-26T12:00:00.000Z",
      "2026-07-26T12:00:00.000Z",
      "ok",
      null,
    ]);
  });

  it("lists the current snapshots for one Part", async () => {
    const sql: SqlClient = {
      async query() {
        return {
          rows: [
            {
              id: "funbox-dran-sword",
              part_id: "dran-sword",
              product_name: "Dran Sword",
              retailer: "Funbox",
              product_url: "https://example.com/dran-sword",
              price: 1299,
              stock_status: "in_stock" as const,
              captured_at: "2026-07-26T12:00:00.000Z",
              last_attempt_at: "2026-07-26T12:00:00.000Z",
              scrape_status: "ok" as const,
              error_message: null,
            },
          ],
        };
      },
    };

    const rows = await createSqlStockListingStore(sql).listByPartId("dran-sword");

    expect(rows).toHaveLength(1);
    expect(rows[0]?.partId).toBe("dran-sword");
  });
});
