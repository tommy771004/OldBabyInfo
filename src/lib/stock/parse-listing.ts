export const stockStatuses = ["in_stock", "out_of_stock", "unknown"] as const;
export type StockStatus = (typeof stockStatuses)[number];

export interface RawProductSnapshot {
  productName: string;
  priceText: string;
  stockText: string;
}

export interface ParsedStockListing {
  productName: string;
  price: number;
  stockStatus: StockStatus;
}

function parsePrice(priceText: string): number {
  const normalized = priceText.replace(/,/g, "").trim();
  const match = normalized.match(/(?:NT\$?|TWD|\$)?\s*(\d+(?:\.\d{1,2})?)/i);
  const price = match?.[1] ? Number(match[1]) : Number.NaN;

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Unable to parse a positive price from: ${priceText}`);
  }

  return price;
}

function parseStockStatus(stockText: string): StockStatus {
  const normalized = stockText.trim().toLowerCase().replace(/\s+/g, " ");
  if (["有庫存", "有貨", "in stock", "available", "available now"].includes(normalized)) {
    return "in_stock";
  }
  if (["售罄", "缺貨", "out of stock", "sold out", "unavailable"].includes(normalized)) {
    return "out_of_stock";
  }
  return "unknown";
}

export function parseStockListing(snapshot: RawProductSnapshot): ParsedStockListing {
  const productName = snapshot.productName.trim();
  if (productName.length === 0) throw new Error("Product name is required");

  return {
    productName,
    price: parsePrice(snapshot.priceText),
    stockStatus: parseStockStatus(snapshot.stockText),
  };
}
