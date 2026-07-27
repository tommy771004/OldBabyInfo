import type { Locale } from "@/i18n/routing.ts";
import { localizedNameOf } from "../parts/localized-name.ts";
import type { Part } from "../parts/schema.ts";
import type { GenerationCatalogRecord } from "./schema.ts";

/**
 * A complete Beyblade has no name of its own in any language.
 *
 * What the source records is a model string — "DRANSWORD3-60F" — which is
 * the three Part names run together. Go-Shoot's product page reads the same
 * way and rebuilds the name from its Parts whenever the reader switches
 * language; this does the same thing from the composition the Catalog
 * already stores, so a Chinese reader gets 「蒼龍神劍 3-60 F」 instead of an
 * uppercase run-on nobody can parse.
 *
 * Nothing here invents a name: if any component can't be resolved to a Part,
 * there is no composed name and the model string stands as recorded.
 */
function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export interface PartNameIndex {
  find(partType: string, name: string): Part | undefined;
}

/**
 * Resolves a composition entry to a Part by name, then by alias.
 *
 * Where several Parts share a normalized name — a base Blade and its colour
 * variants ("Knight Shield" and "KNIGHTSHIELD Metallic Coat: Gold") — the
 * shortest name wins, because a composition entry naming no colour means the
 * base Part, not whichever variant happened to be indexed last.
 */
export function buildPartNameIndex(parts: Part[]): PartNameIndex {
  const byKey = new Map<string, Part>();

  const offer = (key: string, part: Part) => {
    if (!key) return;
    const existing = byKey.get(key);
    if (!existing || part.nameEn.length < existing.nameEn.length) byKey.set(key, part);
  };

  for (const part of parts) offer(`${part.type}:${normalizeName(part.nameEn)}`, part);
  // Aliases are a second pass so a real name always outranks another Part's
  // nickname for the same string.
  for (const part of parts) {
    for (const alias of part.aliases) offer(`${part.type}:${normalizeName(alias)}`, part);
  }

  return {
    find(partType, name) {
      return byKey.get(`${partType}:${normalizeName(name)}`);
    },
  };
}

export function composeBeybladeName(
  record: GenerationCatalogRecord,
  index: PartNameIndex,
  locale: Locale,
): string | undefined {
  if (record.kind !== "beyblade" || record.components.length === 0) return undefined;

  const names = record.components.map((component) => {
    const part = index.find(component.partType, component.name);
    return part ? localizedNameOf(part, locale) : undefined;
  });

  return names.every((name): name is string => Boolean(name)) ? names.join(" ") : undefined;
}

/**
 * The product code the record came from — `series:BX01_DranSword3-60F` is
 * product BX-01. It is how every player and every shop refers to a complete
 * Beyblade, and it is already in the id; it was just never surfaced.
 */
export function productCodeOf(record: GenerationCatalogRecord): string | undefined {
  const model = /^series:([A-Z]{2,3})(\d{2,3})_/.exec(record.sourceRecordId);
  return model ? `${model[1]}-${model[2]}` : undefined;
}

/**
 * The Part whose photo stands for a whole Beyblade.
 *
 * No source we ingest carries a product shot of an assembled Beyblade —
 * BeyBrew's image index is 457 Part photos and nothing else, and Go-Shoot's
 * product rows carry a video id, not an image. What a player recognises a
 * Beyblade by is its Blade anyway (it is the visible top face, and it is
 * what the name leads with), so the Blade's own photo represents it. The
 * same rule already decides the image for a Combo in the battle arena.
 *
 * This is the Blade's photo, not a boxed product shot, and the UI says so.
 */
export function beybladeImagePartOf(
  record: GenerationCatalogRecord,
  index: PartNameIndex,
): Part | undefined {
  if (record.kind !== "beyblade") return undefined;

  const bladeKinds = ["blade", "main_blade", "metal_blade", "over_blade"];
  for (const partType of bladeKinds) {
    const component = record.components.find((entry) => entry.partType === partType);
    const part = component && index.find(partType, component.name);
    if (part) return part;
  }
  return undefined;
}
