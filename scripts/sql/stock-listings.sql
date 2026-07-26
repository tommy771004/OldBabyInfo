CREATE TABLE IF NOT EXISTS stock_listings (
  id text PRIMARY KEY,
  part_id text,
  release_id text,
  product_name text NOT NULL,
  retailer text NOT NULL,
  product_url text NOT NULL,
  price numeric(10, 2) NOT NULL CHECK (price > 0),
  stock_status text NOT NULL CHECK (stock_status IN ('in_stock', 'out_of_stock', 'unknown')),
  captured_at timestamptz NOT NULL,
  last_attempt_at timestamptz NOT NULL,
  scrape_status text NOT NULL CHECK (scrape_status IN ('ok', 'failed')),
  error_message text
);

ALTER TABLE stock_listings ADD COLUMN IF NOT EXISTS release_id text;

CREATE INDEX IF NOT EXISTS stock_listings_part_id_idx ON stock_listings (part_id);
CREATE INDEX IF NOT EXISTS stock_listings_release_id_idx ON stock_listings (release_id);
CREATE INDEX IF NOT EXISTS stock_listings_captured_at_idx ON stock_listings (captured_at DESC);
