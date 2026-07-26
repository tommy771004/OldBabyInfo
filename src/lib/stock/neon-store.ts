import { neon } from "@neondatabase/serverless";
import { createSqlStockListingStore, type StockListingReader, type StockListingRow } from "./sql-store.ts";

/** Creates the server-only reader used by dynamic Stock Listing pages. */
export function createNeonStockListingReader(connectionString: string): StockListingReader {
  const neonSql = neon(connectionString);
  return createSqlStockListingStore({
    async query(text, params = []) {
      const rows = await neonSql.query(text, [...params]);
      return { rows: rows as StockListingRow[] };
    },
  });
}
