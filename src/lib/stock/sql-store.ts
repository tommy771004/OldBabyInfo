import type { StockListing, StockListingStore } from "./repository.ts";
import type { StockStatus } from "./parse-listing.ts";

export interface SqlClient {
  query(text: string, params?: readonly unknown[]): Promise<{ rows: StockListingRow[] }>;
}

export interface StockListingRow {
  id: string;
  part_id: string | null;
  release_id?: string | null;
  product_name: string;
  retailer: string;
  product_url: string;
  /** `numeric` comes back from node-postgres and the Neon driver as a
   *  *string*, not a number — the column is `numeric(10, 2)`. Typed as it
   *  really arrives so the conversion below cannot be forgotten. */
  price: string | number;
  stock_status: StockStatus;
  captured_at: string | Date;
  last_attempt_at: string | Date;
  scrape_status: "ok" | "failed";
  error_message: string | null;
}

export interface StockListingReader {
  listByPartId(partId: string): Promise<StockListing[]>;
  listByReleaseId(releaseId: string): Promise<StockListing[]>;
}

const SELECT_SQL = `
  SELECT id, part_id, release_id, product_name, retailer, product_url, price,
         stock_status, captured_at, last_attempt_at, scrape_status, error_message
  FROM stock_listings
  WHERE id = $1
`;

const SELECT_BY_PART_SQL = `
  SELECT id, part_id, release_id, product_name, retailer, product_url, price,
         stock_status, captured_at, last_attempt_at, scrape_status, error_message
  FROM stock_listings
  WHERE part_id = $1
  ORDER BY captured_at DESC, retailer ASC
`;

const SELECT_BY_RELEASE_SQL = `
  SELECT id, part_id, release_id, product_name, retailer, product_url, price,
         stock_status, captured_at, last_attempt_at, scrape_status, error_message
  FROM stock_listings
  WHERE release_id = $1
  ORDER BY captured_at DESC, retailer ASC
`;

const UPSERT_SQL = `
  INSERT INTO stock_listings
    (id, part_id, release_id, product_name, retailer, product_url, price, stock_status,
     captured_at, last_attempt_at, scrape_status, error_message)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  ON CONFLICT (id) DO UPDATE SET
    part_id = EXCLUDED.part_id,
    release_id = EXCLUDED.release_id,
    product_name = EXCLUDED.product_name,
    retailer = EXCLUDED.retailer,
    product_url = EXCLUDED.product_url,
    price = EXCLUDED.price,
    stock_status = EXCLUDED.stock_status,
    captured_at = EXCLUDED.captured_at,
    last_attempt_at = EXCLUDED.last_attempt_at,
    scrape_status = EXCLUDED.scrape_status,
    error_message = EXCLUDED.error_message
`;

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function toListing(row: StockListingRow): StockListing {
  const listing: StockListing = {
    id: row.id,
    partId: row.part_id ?? undefined,
    productName: row.product_name,
    retailer: row.retailer,
    productUrl: row.product_url,
    // Without this the price reaches the page as "250.00" and
    // `toLocaleString` silently ignores its options on a string.
    price: Number(row.price),
    stockStatus: row.stock_status,
    capturedAt: iso(row.captured_at),
    lastAttemptAt: iso(row.last_attempt_at),
    scrapeStatus: row.scrape_status,
  };
  if (row.release_id) listing.releaseId = row.release_id;
  if (row.error_message !== null) listing.errorMessage = row.error_message;
  return listing;
}

export function createSqlStockListingStore(sql: SqlClient): StockListingStore & StockListingReader {
  return {
    async get(id) {
      const result = await sql.query(SELECT_SQL, [id]);
      const row = result.rows[0];
      return row ? toListing(row) : undefined;
    },
    async listByPartId(partId) {
      const result = await sql.query(SELECT_BY_PART_SQL, [partId]);
      return result.rows.map(toListing);
    },
    async listByReleaseId(releaseId) {
      const result = await sql.query(SELECT_BY_RELEASE_SQL, [releaseId]);
      return result.rows.map(toListing);
    },
    async save(row) {
      await sql.query(UPSERT_SQL, [
        row.id,
        row.partId ?? null,
        row.releaseId ?? null,
        row.productName,
        row.retailer,
        row.productUrl,
        row.price,
        row.stockStatus,
        row.capturedAt,
        row.lastAttemptAt,
        row.scrapeStatus,
        row.errorMessage ?? null,
      ]);
    },
  };
}
