import type { ProductTarget } from "./scraper.ts";

export function shouldSkipProductScrape(targets: ProductTarget[]): boolean {
  return targets.length === 0;
}
