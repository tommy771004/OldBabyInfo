/**
 * Blade naming vocabulary for the phstudy merge (ADR-0013).
 *
 * Upstream Blade `group_id`s are run-together capitals ("DRANARC") and phstudy
 * carries no `part_code_names.json` entry for Blades, so an English display name
 * has to be reconstructed. X Blade names are two words — creature + main-blade —
 * so the id segments cleanly against a vocabulary.
 *
 * Most tokens are harvested at runtime from the Parts already curated
 * (`Dran Sword` -> DRAN, SWORD) and from the Generation Catalog's `main_blade`
 * records. The list below is the hand-checked remainder, each one read off the
 * SKU's katakana rather than guessed from the Latin id — which is how
 * "HELLSHUMMER" was caught as ヘルズハンマー (Hammer) and "WARRIORSABER" as
 * サムライセイバー (Samurai Saber).
 */
export const BLADE_NAME_TOKENS: Record<string, string> = {
  ANTLERS: "Antlers",
  BAHAMUT: "Bahamut",
  BRACHIO: "Brachio",
  BUCKS: "Bucks",
  CERBERUS: "Cerberus",
  CROCO: "Croco",
  CRUNCH: "Crunch",
  EMPEROR: "Emperor",
  FORT: "Fort",
  FOX: "Fox",
  GLORY: "Glory",
  HAMMER: "Hammer",
  HEAVENS: "Heavens",
  HORNET: "Hornet",
  KRAKEN: "Kraken",
  NETHER: "Nether",
  PERSEUS: "Perseus",
  RAGNA: "Ragna",
  RING: "Ring",
  SOL: "Sol",
  STRIKE: "Strike",
  VALKYRIE: "Valkyrie",
  WHALE: "Whale",
  WHIP: "Whip",
  WRIGGLE: "Wriggle",
};

/**
 * Upstream group ids that are not their own Part.
 *
 * `WARRIORSABER` and `HELLSHUMMER` are alternate spellings that split one Blade
 * across two groups — both pairs share a katakana name, which is what exposed
 * them. `BEYBLADEBURST` is a mislabelled single-SKU group holding Storm
 * Spriggan. Each folds into the curated id on the right.
 */
export const BLADE_GROUP_ALIASES: Record<string, string> = {
  WARRIORSABER: "SAMURAISABER",
  HELLSHUMMER: "HELLSHAMMER",
  BEYBLADEBURST: "STORMSPRIGGAN",
};

/** Curated ids upstream spells differently; the phstudy spelling wins (ADR-0013). */
export const BLADE_ID_RENAMES: Record<string, string> = {
  CROCCRUNCH: "CROCOCRUNCH",
  TUSKMAMMOTH: "MAMMOTHTUSK",
};

/** Upstream Blade groups that hold products of another kind entirely. */
export const BLADE_GROUP_SKIPS = new Set(["BIT"]);

/** Trailing spec letters that leaked into a few group ids (CERBERUSDARKW). */
export const BLADE_ID_TRAILING_NOISE: Record<string, string> = {
  CERBERUSDARKW: "CERBERUSDARK",
  WHALEFLAMEM: "WHALEFLAME",
};

/**
 * Longest-match segmentation. Returns null when any part of the id is not in
 * the vocabulary, so an unnamed Blade is reported rather than silently given a
 * mangled name.
 */
export function segmentBladeName(
  id: string,
  vocabulary: Record<string, string>,
): string | null {
  if (id.length === 0) return "";
  for (let length = id.length; length > 0; length -= 1) {
    const head = id.slice(0, length);
    const word = vocabulary[head];
    if (!word) continue;
    const rest = segmentBladeName(id.slice(length), vocabulary);
    if (rest !== null) return rest.length > 0 ? `${word} ${rest}` : word;
  }
  return null;
}
