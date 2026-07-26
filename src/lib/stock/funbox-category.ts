import { z } from "zod";
import type { Part } from "../parts/schema.ts";
import type { StockStatus } from "./parse-listing.ts";

const FUNBOX_ORIGIN = "https://shop.funbox.com.tw";

const funboxVariantSchema = z.object({
  inventory_quantity: z.number().finite().nullable().optional(),
});

const funboxProductSchema = z.object({
  id: z.union([z.number().int().positive(), z.string().min(1)]),
  url: z.string().trim().min(1),
  title: z.string().trim().min(1),
  price: z.number().finite().positive(),
  variants: z.array(funboxVariantSchema).optional(),
});

export interface FunboxCategoryListing {
  id: string;
  productName: string;
  productUrl: string;
  price: number;
  stockStatus: StockStatus;
}

export interface FunboxCategoryParseReport {
  listings: FunboxCategoryListing[];
  skippedRows: number;
}

function stockStatusOf(variants: z.infer<typeof funboxVariantSchema>[] | undefined): StockStatus {
  if (!variants || variants.length === 0) return "unknown";

  const quantities = variants.map((variant) => variant.inventory_quantity);
  if (quantities.some((quantity) => typeof quantity === "number" && quantity > 0)) return "in_stock";
  if (quantities.every((quantity) => typeof quantity === "number" && quantity === 0)) return "out_of_stock";
  return "unknown";
}

function productUrlOf(value: string, origin: string): string | undefined {
  try {
    const url = new URL(value, origin);
    if (url.origin !== new URL(origin).origin || !url.pathname.startsWith("/products/")) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function parseFunboxCategoryProducts(
  payload: unknown,
  origin = FUNBOX_ORIGIN,
): FunboxCategoryParseReport {
  if (!Array.isArray(payload)) return { listings: [], skippedRows: 1 };

  const byId = new Map<string, FunboxCategoryListing>();
  let skippedRows = 0;

  for (const candidate of payload) {
    const parsed = funboxProductSchema.safeParse(candidate);
    if (!parsed.success) {
      skippedRows += 1;
      continue;
    }

    const productUrl = productUrlOf(parsed.data.url, origin);
    if (!productUrl) {
      skippedRows += 1;
      continue;
    }

    const id = `funbox-product-${parsed.data.id}`;
    if (byId.has(id)) {
      skippedRows += 1;
      continue;
    }

    byId.set(id, {
      id,
      productName: parsed.data.title.trim(),
      productUrl,
      price: parsed.data.price,
      stockStatus: stockStatusOf(parsed.data.variants),
    });
  }

  return {
    listings: [...byId.values()].sort((left, right) => left.id.localeCompare(right.id)),
    skippedRows,
  };
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/[\s\-_／/·・:：]+/g, "");
}

function partSearchTerms(part: Part): string[] {
  return [part.nameEn, part.nameJa, part.nameZhTw, ...part.aliases]
    .filter((term): term is string => Boolean(term))
    .filter((term) => normalize(term).length >= 2);
}

/**
 * Returns a Part only when exactly one Part name appears in the retailer title.
 * Product bundles and vague titles stay outside the public Part journey until
 * they receive a reviewed manual mapping.
 */
export function matchFunboxProductToPart(productName: string, parts: Part[]): string | undefined {
  const normalizedProductName = normalize(productName);
  const matches = parts.filter((part) =>
    partSearchTerms(part).some((term) => normalizedProductName.includes(normalize(term))),
  );

  return matches.length === 1 ? matches[0]?.id : undefined;
}
