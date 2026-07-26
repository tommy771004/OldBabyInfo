import type { Part } from "@/lib/parts/schema.ts";

export type ProductPartMapping =
  | { kind: "matched"; part: Part }
  | { kind: "unmatched"; productName: string }
  | { kind: "ambiguous"; productName: string; candidates: Part[] };

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function matchesPart(productName: string, part: Part): boolean {
  const product = normalize(productName);
  const officialNames = [part.nameEn, part.nameJa, part.nameZhTw].filter(
    (name): name is string => Boolean(name),
  );

  if (officialNames.some((name) => product.includes(normalize(name)))) return true;

  return part.aliases.some((alias) => {
    const normalizedAlias = normalize(alias);
    return normalizedAlias.length > 0 &&
      (product === normalizedAlias ||
        (normalizedAlias.length >= 2 && product.includes(normalizedAlias)));
  });
}

/**
 * Maps a retailer's product title to a Part without fuzzy guessing. A
 * product may include a deterministic SKU prefix, so official names can be
 * contained in the title. Short aliases must still match the whole title to
 * avoid mapping a one-letter alias found in an unrelated word.
 */
export function mapProductToPart(productName: string, parts: Part[]): ProductPartMapping {
  const normalizedProductName = productName.trim();
  const candidates = parts.filter((part) => matchesPart(normalizedProductName, part));

  if (candidates.length === 1) return { kind: "matched", part: candidates[0]! };
  if (candidates.length > 1) {
    return { kind: "ambiguous", productName: normalizedProductName, candidates };
  }
  return { kind: "unmatched", productName: normalizedProductName };
}
