import type { StockListing } from "@/lib/stock/repository.ts";
import { isStockListingStale } from "@/lib/stock/freshness.ts";

export interface WhereToBuyLabels {
  price: string;
  availability: string;
  inStock: string;
  outOfStock: string;
  unknownStock: string;
  capturedAt: string;
  stale: string;
  visitRetailer: string;
  emptyHeading: string;
  emptyBody: string;
}

export function WhereToBuyList({
  listings,
  now,
  staleAfterMs,
  labels,
}: {
  listings: StockListing[];
  now: string;
  staleAfterMs?: number;
  labels: WhereToBuyLabels;
}) {
  if (listings.length === 0) {
    return (
      <section aria-labelledby="where-to-buy-empty-heading">
        <h2 id="where-to-buy-empty-heading">{labels.emptyHeading}</h2>
        <p>{labels.emptyBody}</p>
      </section>
    );
  }

  return (
    <ul>
      {listings.map((listing) => {
        const stale =
          listing.scrapeStatus === "failed" ||
          isStockListingStale(listing, now, staleAfterMs);
        const stockLabel =
          listing.stockStatus === "in_stock"
            ? labels.inStock
            : listing.stockStatus === "out_of_stock"
              ? labels.outOfStock
              : labels.unknownStock;

        return (
          <li key={listing.id}>
            <h2>{listing.productName}</h2>
            <p>{listing.retailer}</p>
            <dl>
              <dt>{labels.price}</dt>
              <dd>NT${listing.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</dd>
              <dt>{labels.availability}</dt>
              <dd>{stockLabel}</dd>
              <dt>{labels.capturedAt}</dt>
              <dd>
                <time dateTime={listing.capturedAt}>{listing.capturedAt}</time>
              </dd>
            </dl>
            {stale ? <p>{labels.stale}</p> : null}
            <a href={listing.productUrl} target="_blank" rel="noreferrer">
              {labels.visitRetailer}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
