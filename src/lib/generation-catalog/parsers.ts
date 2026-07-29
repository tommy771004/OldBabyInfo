import { createHash } from "node:crypto";
import type {
  GenerationCatalogRecord,
  GenerationId,
} from "./schema.ts";

function decodeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
    "&emsp;": " ",
  };
  return value
    .replace(/&(amp|quot|#39|lt|gt|nbsp|emsp);/g, (match) => entities[match] ?? match)
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}

function plainText(value: string): string {
  return decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function normalizePartType(value: string): string {
  const normalized = value
    .normalize("NFKC")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[（）()]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\p{Letter}]+/gu, "_")
    .replace(/^_+|_+$/g, "");
  const stablePartTypes: Record<string, string> = {
    support_parts: "support_part",
    ベイブレード_レイヤー: "layer",
    レイヤー: "layer",
    ディスク: "disc",
    ドライバー: "driver",
    フレーム: "frame",
    ガチンコチップ: "gatinko_chip",
    ウエイト: "weight",
    ベース: "base",
    スパーキングチップ: "sparking_chip",
    リング: "ring",
    シャーシ: "chassis",
    ダイナマイトバトルコア: "db_core",
    dbコア: "db_core",
    アーマー: "armor",
    ブレード: "blade",
    buブレード: "bu_blade",
  };
  return stablePartTypes[normalized] ?? normalized;
}

function stableToken(value: string): string {
  const readable = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  const hash = createHash("sha256").update(value).digest("hex").slice(0, 10);
  return `${readable || "record"}-${hash}`;
}

function identityKey(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, "");
}

function recordId(sourceId: string, sourceRecordId: string): string {
  return `${sourceId}:${stableToken(sourceRecordId)}`;
}

function wikiDisplayName(target: string, display?: string): string {
  return (display || target.split("#")[0] || target).replace(/''/g, "").trim();
}

function partTypeFromWikiTarget(target: string): string | null {
  const separator = target.indexOf(" - ");
  if (separator < 1) return null;
  const prefix = target.slice(0, separator);
  if (/^(File|Category|List|Beyblade)$/i.test(prefix)) return null;
  return normalizePartType(prefix);
}

export interface FandomPageInput {
  title: string;
  generationId: GenerationId;
  system: string;
  wikitext: string;
  sourceVersion: string;
}

export function parseFandomPartsPage(input: FandomPageInput): GenerationCatalogRecord[] {
  const records = new Map<string, GenerationCatalogRecord>();
  const linkPattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  for (const match of input.wikitext.matchAll(linkPattern)) {
    const target = match[1]!.trim();
    const partType = partTypeFromWikiTarget(target);
    if (!partType) continue;
    const name = wikiDisplayName(target.slice(target.indexOf(" - ") + 3), match[2]);
    if (!name || /^N\/A$/i.test(name)) continue;
    const sourceRecordId = `${input.title}:${target}`;
    records.set(sourceRecordId, {
      id: recordId("beyblade-fandom", sourceRecordId),
      generationId: input.generationId,
      system: input.system,
      kind: "part",
      partType,
      name,
      aliases: [],
      components: [],
      sourceId: "beyblade-fandom",
      sourceRecordId,
      sourceUrl: `https://beyblade.fandom.com/wiki/${encodeURIComponent(input.title.replaceAll(" ", "_"))}`,
      sourceVersion: input.sourceVersion,
      verificationStatus: "community_sourced",
      publicationStatus: "accepted",
    });
  }
  return [...records.values()];
}

export interface FandomCategoryInput {
  category: string;
  generationId: GenerationId;
  system: string;
  titles: string[];
  sourceVersion: string;
}

export function parseFandomCategory(input: FandomCategoryInput): GenerationCatalogRecord[] {
  const supported = /^(Attack Ring|Bit Chip|Bit Protector|Blade Base|Core|Engine Gear|Running Core|Spin Gear|Sub-Attack Ring|Support Parts?|Weight Disk) - (.+)$/i;
  return input.titles.flatMap((title) => {
    const match = title.match(supported);
    if (!match) return [];
    const sourceRecordId = `${input.category}:${title}`;
    return [{
      id: recordId("beyblade-fandom", sourceRecordId),
      generationId: input.generationId,
      system: input.system,
      kind: "part" as const,
      partType: normalizePartType(match[1]!),
      name: match[2]!.trim(),
      aliases: [],
      components: [],
      sourceId: "beyblade-fandom",
      sourceRecordId,
      sourceUrl: `https://beyblade.fandom.com/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`,
      sourceVersion: input.sourceVersion,
      verificationStatus: "community_sourced" as const,
      publicationStatus: "accepted" as const,
    }];
  });
}

function generationFromBeywikiHeading(heading: string): GenerationId | null {
  if (/PLASTICS/i.test(heading)) return "bakuten_shoot";
  if (/HEAVY METAL SYSTEM/i.test(heading)) return "bakuten_shoot";
  if (/METAL FIGHT BEYBLADE/i.test(heading)) return "metal_fight";
  return null;
}

function cleanWikiMarkup(value: string): string {
  return value
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/'{2,}/g, "")
    .replace(/<br\s*\/?>/gi, "")
    .trim();
}

export function parseBeywikiPartsList(
  wikitext: string,
  sourceVersion: string,
): GenerationCatalogRecord[] {
  const records: GenerationCatalogRecord[] = [];
  let generationId: GenerationId | null = null;
  let system = "unknown";
  let currentName: string | null = null;
  let currentSourceRecordId = "";
  let components: Array<{ partType: string; name: string }> = [];

  const flush = () => {
    if (!generationId || !currentName || components.length === 0) return;
    records.push({
      id: recordId("beywiki-parts-list", currentSourceRecordId),
      generationId,
      system,
      kind: "beyblade",
      partType: null,
      name: currentName,
      aliases: [],
      components,
      sourceId: "beywiki-parts-list",
      sourceRecordId: currentSourceRecordId,
      sourceUrl: "https://www.beywiki.com/index.php?title=Beyblade_Parts_List",
      sourceVersion,
      verificationStatus: "needs_review",
      publicationStatus: "needs_review",
    });
  };

  for (const rawLine of wikitext.split(/\r?\n/)) {
    const line = rawLine.trim();
    const majorHeading = line.match(/^==([^=].*?)==$/);
    if (majorHeading) {
      flush();
      currentName = null;
      components = [];
      generationId = generationFromBeywikiHeading(cleanWikiMarkup(majorHeading[1]!));
      system = cleanWikiMarkup(majorHeading[1]!);
      continue;
    }
    const minorHeading = line.match(/^===([^=].*?)===$/);
    if (minorHeading) {
      flush();
      currentName = null;
      components = [];
      system = cleanWikiMarkup(minorHeading[1]!);
      continue;
    }
    const bey = line.match(/^''\[\[([^\]|]+)(?:\|([^\]]+))?\]\]''(?:\s*\(([^)]*)\))?<br\s*\/?>/i);
    if (bey) {
      flush();
      currentName = wikiDisplayName(bey[1]!, bey[2]);
      if (bey[3]) currentName += ` (${cleanWikiMarkup(bey[3])})`;
      currentSourceRecordId = `${generationId}:${system}:${bey[1]}`;
      components = [];
      continue;
    }
    if (!currentName) continue;
    const component = line.match(/^(?:\([^)]*\)\s*)?([A-Za-z][A-Za-z -]*):\s*(.+?)<br\s*\/?>/i);
    if (component) {
      components.push({
        partType: normalizePartType(component[1]!),
        name: cleanWikiMarkup(component[2]!),
      });
    }
  }
  flush();
  return records;
}

export function parseBurstOfficialProducts(
  html: string,
  sourceVersion: string,
): GenerationCatalogRecord[] {
  const records: GenerationCatalogRecord[] = [];
  const parts = new Map<string, GenerationCatalogRecord>();
  const boxPattern = /<div\s+id="([^"]+)"\s+class="productBox">([\s\S]*?)(?=<div\s+id="[^"]+"\s+class="productBox">|<\/section>)/g;
  for (const box of html.matchAll(boxPattern)) {
    const body = box[2]!;
    const title = body.match(/<h3[^>]*class="productTtl"[^>]*>([\s\S]*?)<\/h3>/)?.[1];
    const contents = body.match(/【セット内容】([\s\S]*?)<\/p>/)?.[1];
    if (!title || !contents || !/ベイブレード/.test(contents)) continue;
    const productName = plainText(title);
    const components: Array<{ partType: string; name: string }> = [];
    const partPattern = /([^<：、［\]【】]{1,30})：\s*<a\s+[^>]*href="parts\.html\?id=([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    for (const part of contents.matchAll(partPattern)) {
      components.push({
        partType: normalizePartType(plainText(part[1]!)),
        name: plainText(part[3]!),
      });
    }
    if (components.length === 0) continue;
    const system = components.some((component) => component.partType === "bu_blade")
      ? "burst_ultimate"
      : components.some((component) => component.partType === "db_core")
        ? "dynamite_battle"
        : components.some((component) =>
            ["sparking_chip", "ring", "chassis"].includes(component.partType))
          ? "superking"
            : components.some((component) =>
                ["gatinko_chip", "weight", "base"].includes(component.partType))
              ? "gatinko"
            : burstLayerSystemForProduct(productName);
    const anchorId = box[1]!;
    const sourceRecordId = `${anchorId}:${productName}`;
    const beybladeId = recordId("takaratomy-burst-products", sourceRecordId);
    const componentRecordIds = components.map((component) =>
      recordId("takaratomy-burst-products", `part:${component.partType}:${component.name}`),
    );
    const linkedComponents = components.map((component, index) => ({
      ...component,
      recordId: componentRecordIds[index]!,
    }));
    records.push({
      id: beybladeId,
      generationId: "burst",
      system,
      kind: "beyblade",
      partType: null,
      name: productName,
      aliases: [],
      components: linkedComponents,
      sourceId: "takaratomy-burst-products",
      sourceRecordId,
      sourceUrl: `https://beyblade.takaratomy.co.jp/burst/products.html#${anchorId}`,
      sourceVersion,
      verificationStatus: "officially_verified",
      publicationStatus: "accepted",
    });
    records.push({
      id: recordId("takaratomy-burst-products", `release:${sourceRecordId}`),
      generationId: "burst",
      system,
      kind: "release",
      partType: null,
      name: productName,
      aliases: [],
      components: [],
      sourceId: "takaratomy-burst-products",
      sourceRecordId: `release:${sourceRecordId}`,
      sourceUrl: `https://beyblade.takaratomy.co.jp/burst/products.html#${anchorId}`,
      sourceVersion,
      verificationStatus: "officially_verified",
      publicationStatus: "accepted",
      releaseOf: beybladeId,
      containsRecordIds: componentRecordIds,
      sku: productName.match(/\bB-\d+\b/i)?.[0],
      region: "JP",
      comboEligible: false,
    });
    for (const component of components) {
      const partSourceRecordId = `part:${component.partType}:${component.name}`;
      if (parts.has(partSourceRecordId)) continue;
      parts.set(partSourceRecordId, {
        id: recordId("takaratomy-burst-products", partSourceRecordId),
        generationId: "burst",
        system,
        kind: "part",
        partType: component.partType,
        name: component.name,
        aliases: [],
        components: [],
        sourceId: "takaratomy-burst-products",
        sourceRecordId: partSourceRecordId,
        sourceUrl: `https://beyblade.takaratomy.co.jp/burst/products.html#${anchorId}`,
        sourceVersion,
        verificationStatus: "officially_verified",
        publicationStatus: "accepted",
      });
    }
  }
  return [...records, ...parts.values()];
}

function burstLayerSystemForProduct(productName: string): string {
  const productNumber = Number(productName.match(/\bB-(\d+)\b/i)?.[1]);
  if (!Number.isFinite(productNumber)) return "burst";
  if (productNumber <= 24) return "single_layer";
  if (productNumber <= 63) return "dual_layer";
  if (productNumber <= 100) return "god";
  if (productNumber <= 132) return "cho_z";
  return "burst";
}

interface BeybrewPart {
  name: string;
  altname?: string;
  alias?: string;
  /** BX / UX / CX — the product line a Blade belongs to. Absent on Ratchets
   *  and Bits, which are shared across every line rather than belonging to
   *  one (which is why the source only records it for Blade-family Parts). */
  line?: string;
}

export interface BeybrewParts {
  blades?: BeybrewPart[];
  assist_blades?: BeybrewPart[];
  ratchets?: BeybrewPart[];
  bits?: BeybrewPart[];
  lock_chips?: BeybrewPart[];
  over_blades?: BeybrewPart[];
}

interface MasterDataEntry {
  model_name?: string;
  group_id?: string;
  release_at?: string;
  name?: Record<string, string>;
  /** Carries the product line ("bx"/"ux"/"cx") plus release-flavour tags
   *  ("reprint", "convention", "other") — the line tag is the reliable one,
   *  present on every Part entry. */
  tags?: string[];
}

export interface MasterDataPayload {
  data?: Record<string, MasterDataEntry[]>;
}

/**
 * MasterData ships entries whose localized name never got filled in and
 * arrives as a placeholder glyph ("■"). It has to count as *no name*, not as
 * a very short one: the caller keeps the shortest name per `group_id` (to
 * prefer "Dran Sword" over "BX-01 DRANSWORD3-60F"), so a one-character
 * placeholder would otherwise win every contest and publish a Part nobody
 * can identify — and, having no real name to match on, it would escape
 * deduplication against the properly named record of the same Part.
 */
const PLACEHOLDER_ONLY = /^[■□◼◻▪▫�\s]+$/u;

function cleanMasterDataName(value: string | undefined): string | null {
  if (!value) return null;
  const cleaned = plainText(value)
    .replace(/^(?:BX|UX|CX|BXG|BXA|BXH)-?\d+\s*/i, "")
    .replace(/\s*【(?:rental|レンタル)】/gi, "")
    .trim();
  if (!cleaned || PLACEHOLDER_ONLY.test(cleaned)) return null;
  return cleaned;
}

const X_LINES = ["bx", "ux", "cx"];

/** The line a source states outright, preferred over any guess from a model
 *  code: a Blade reissued under a different product number still belongs to
 *  the line it was designed for. */
function xLineOf(values: string[] | undefined): string | undefined {
  return values?.map((value) => value.toLowerCase()).find((value) => X_LINES.includes(value));
}

function xSystemForModel(modelName: string | undefined): string {
  const line = modelName?.match(/^(BX|UX|CX)/i)?.[1];
  return line?.toLowerCase() ?? "x";
}

function xSystemForPartType(partType: string, modelName?: string, line?: string): string {
  // CX-only Part kinds are CX whatever a model code says; everything else
  // takes the stated line first and falls back to the model prefix.
  return ["main_blade", "assist_blade", "lock_chip", "metal_blade", "over_blade"].includes(partType)
    ? "cx"
    : line ?? xSystemForModel(modelName);
}

function mechanicalPartIdentity(value: string): string {
  const withoutEdition = value
    .replace(/\s+Metallic\s+Coat\b.*$/i, "")
    .replace(/\s+(?:Special|Holo\s+sticker|Red|Blue|Black)\s+Ver\.?.*$/i, "")
    .replace(/\s+\((?:rapid-hit|upper-attack)\s+type\)\s*$/i, "")
    .trim();
  return identityKey(withoutEdition);
}

function linkXComponents(records: GenerationCatalogRecord[]): GenerationCatalogRecord[] {
  const parts = records
    .filter((record) => record.kind === "part")
    .sort((left, right) => left.id.localeCompare(right.id));

  return records.map((record) => {
    if (record.kind !== "beyblade") return record;
    return {
      ...record,
      components: record.components.map((component) => {
        const componentIdentity = identityKey(component.name);
        const mechanicalIdentity = mechanicalPartIdentity(component.name);
        const candidates = parts
          .filter((part) => part.partType === component.partType)
          .flatMap((part) =>
            [part.name, ...part.aliases].map((name) => ({
              part,
              identity: identityKey(name),
              mechanicalIdentity: mechanicalPartIdentity(name),
            })),
          );
        const exact = candidates.filter((candidate) => candidate.identity === componentIdentity);
        const mechanical = candidates.filter((candidate) =>
          candidate.mechanicalIdentity === mechanicalIdentity ||
          mechanicalIdentity.endsWith(candidate.mechanicalIdentity),
        );
        const prefix = candidates.filter((candidate) =>
          componentIdentity.startsWith(candidate.identity),
        );
        const matches = exact.length > 0
          ? exact
          : mechanical.length > 0
            ? mechanical
            : prefix;
        const preferred = [...matches].sort((left, right) => {
          const leftSystem = left.part.system === record.system ? 0 : 1;
          const rightSystem = right.part.system === record.system ? 0 : 1;
          return leftSystem - rightSystem ||
            right.identity.length - left.identity.length ||
            left.part.id.localeCompare(right.part.id);
        })[0];
        return preferred ? { ...component, recordId: preferred.part.id } : component;
      }),
    };
  });
}

export function buildBeybrewXRecords(
  beyparts: BeybrewParts,
  masterData: MasterDataPayload,
  sourceVersion: string,
): GenerationCatalogRecord[] {
  const records: GenerationCatalogRecord[] = [];
  const seenParts = new Set<string>();
  const partCollections: Array<[keyof BeybrewParts, string]> = [
    ["blades", "blade"],
    ["assist_blades", "assist_blade"],
    ["ratchets", "ratchet"],
    ["bits", "bit"],
    ["lock_chips", "lock_chip"],
    ["over_blades", "over_blade"],
  ];
  for (const [key, partType] of partCollections) {
    for (const part of beyparts[key] ?? []) {
      const sourceRecordId = `${key}:${part.name}`;
      const aliases = [part.altname, part.alias].filter(
        (alias): alias is string => Boolean(alias && alias !== part.name),
      );
      records.push({
        id: recordId("beybrew", sourceRecordId),
        generationId: "x",
        system: xLineOf(part.line ? [part.line] : undefined) ?? xSystemForPartType(partType),
        kind: "part",
        partType,
        name: part.name,
        aliases,
        components: [],
        sourceId: "beybrew",
        sourceRecordId,
        sourceUrl: "https://github.com/yujinyuz/beybrew/blob/main/src/data/beyparts.json",
        sourceVersion,
        verificationStatus: "official_app_derived",
        publicationStatus: "accepted",
      });
      for (const identity of [part.name, ...aliases]) {
        seenParts.add(`${partType}:${identityKey(identity)}`);
        seenParts.add(`x:${partType}:${identityKey(identity)}`);
        seenParts.add(`${partType}:${mechanicalPartIdentity(identity)}`);
        seenParts.add(`x:${partType}:${mechanicalPartIdentity(identity)}`);
      }
    }
  }

  const data = masterData.data ?? {};
  const componentKeys = [
    "BeybladePartsBlade",
    "BeybladePartsMainBlade",
    "BeybladePartsAssistBlade",
    "BeybladePartsLockChip",
    "BeybladePartsMetalBlade",
    "BeybladePartsOverBlade",
    "BeybladePartsRatchet",
    "BeybladePartsBit",
  ];
  const entriesByModel = new Map<string, Array<{ partType: string; name: string }>>();
  const masterPartsByIdentity = new Map<
    string,
    { partType: string; name: string; sourceRecordId: string; system: string }
  >();
  for (const key of componentKeys) {
    for (const entry of data[key] ?? []) {
      if (!entry.model_name) continue;
      const name = cleanMasterDataName(entry.name?.["en-US"] ?? entry.name?.["ja-JP"]);
      if (!name) continue;
      const partType = normalizePartType(key.replace(/^BeybladeParts/, ""));
      const system = xSystemForPartType(partType, entry.model_name, xLineOf(entry.tags));
      const identity = `${system}:${partType}:${entry.group_id || name}`;
      const priorPart = masterPartsByIdentity.get(identity);
      if (!priorPart || name.length < priorPart.name.length) {
        masterPartsByIdentity.set(identity, {
          partType,
          name,
          sourceRecordId: `master:${key}:${entry.group_id || name}`,
          system,
        });
      }
      const existing = entriesByModel.get(entry.model_name) ?? [];
      if (!existing.some((component) => component.partType === partType && component.name === name)) {
        existing.push({ partType, name });
      }
      entriesByModel.set(entry.model_name, existing);
    }
  }

  for (const part of masterPartsByIdentity.values()) {
    const key = `${part.system}:${part.partType}:${identityKey(part.name)}`;
    const genericKey = `${part.partType}:${identityKey(part.name)}`;
    const mechanicalKey = `${part.system}:${part.partType}:${mechanicalPartIdentity(part.name)}`;
    const genericMechanicalKey = `${part.partType}:${mechanicalPartIdentity(part.name)}`;
    if (
      seenParts.has(key) ||
      seenParts.has(genericKey) ||
      seenParts.has(mechanicalKey) ||
      seenParts.has(genericMechanicalKey)
    ) continue;
    records.push({
      id: recordId("beybrew", part.sourceRecordId),
      generationId: "x",
      system: part.system,
      kind: "part",
      partType: part.partType,
      name: part.name,
      aliases: [],
      components: [],
      sourceId: "beybrew",
      sourceRecordId: part.sourceRecordId,
      sourceUrl: "https://github.com/yujinyuz/beybrew/blob/main/MasterData.json",
      sourceVersion,
      verificationStatus: "official_app_derived",
      publicationStatus: "accepted",
    });
    seenParts.add(key);
  }

  const seriesRecords: GenerationCatalogRecord[] = [];
  for (const series of data.BeybladeSeries ?? []) {
    if (!series.model_name) continue;
    if (series.model_name.includes("_ModeChange") || /_Sharp$/i.test(series.model_name)) {
      continue;
    }
    const name = cleanMasterDataName(series.name?.["en-US"] ?? series.name?.["ja-JP"]);
    const components = entriesByModel.get(series.model_name) ?? [];
    if (!name || components.length === 0) continue;
    seriesRecords.push({
      id: recordId("beybrew", `series:${series.model_name}`),
      generationId: "x",
      system: series.model_name.match(/^(BX|UX|CX)/)?.[1]?.toLowerCase() ?? "x",
      kind: "beyblade",
      partType: null,
      name,
      aliases: [],
      components,
      sourceId: "beybrew",
      sourceRecordId: `series:${series.model_name}`,
      sourceUrl: "https://github.com/yujinyuz/beybrew/blob/main/MasterData.json",
      sourceVersion,
      verificationStatus: "official_app_derived",
      publicationStatus: "accepted",
    });
  }

  const linked = linkXComponents([...records, ...seriesRecords]);
  const linkedParts = linked.filter((record) => record.kind === "part");
  const linkedSeries = linked.filter((record) => record.kind === "beyblade");
  const byComposition = new Map<string, GenerationCatalogRecord[]>();
  for (const series of linkedSeries) {
    const compositionKey = series.components
      .map((component) => `${component.partType}:${component.recordId ?? component.name}`)
      .sort()
      .join("|");
    const group = byComposition.get(compositionKey) ?? [];
    group.push(series);
    byComposition.set(compositionKey, group);
  }

  const beyblades: GenerationCatalogRecord[] = [];
  const releases: GenerationCatalogRecord[] = [];
  for (const group of byComposition.values()) {
    const ranked = [...group].sort((left, right) => {
      const editionRank = (record: GenerationCatalogRecord) =>
        /Metallic\s+Coat|Special\s+Ver|Holo\s+sticker|(?:Red|Blue|Black)\s+Ver/i.test(record.name)
          ? 1
          : 0;
      const promotionalRank = (record: GenerationCatalogRecord) =>
        /^series:(?:BXG|BXH|BXC)/i.test(record.sourceRecordId) ? 1 : 0;
      return editionRank(left) - editionRank(right) ||
        promotionalRank(left) - promotionalRank(right) ||
        left.id.localeCompare(right.id);
    });
    const canonical = ranked[0]!;
    beyblades.push(canonical);

    for (const edition of group) {
      const modelName = edition.sourceRecordId.replace(/^series:/, "");
      releases.push({
        id: recordId("beybrew", `release:${edition.sourceRecordId}`),
        generationId: "x",
        system: edition.system,
        kind: "release",
        partType: null,
        name: edition.name,
        aliases: [],
        components: [],
        sourceId: "beybrew",
        sourceRecordId: `release:${edition.sourceRecordId}`,
        sourceUrl: edition.sourceUrl,
        sourceVersion,
        verificationStatus: "official_app_derived",
        publicationStatus: "accepted",
        releaseOf: canonical.id,
        containsRecordIds: edition.components
          .flatMap((component) => component.recordId ? [component.recordId] : []),
        sku: modelName.split("_")[0],
        region: "JP",
        comboEligible: false,
      });
    }
  }

  return [...linkedParts, ...beyblades, ...releases];
}

export function dedupeCatalogRecords(records: GenerationCatalogRecord[]): GenerationCatalogRecord[] {
  const byId = new Map<string, GenerationCatalogRecord>();
  for (const record of records) byId.set(record.id, record);
  const sorted = [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
  const canonicalParts = new Map<string, GenerationCatalogRecord>();
  const redirects = new Map<string, string>();
  const deduped: GenerationCatalogRecord[] = [];

  for (const record of sorted) {
    if (record.kind !== "part") {
      deduped.push(record);
      continue;
    }
    const identity = [
      record.generationId,
      record.system,
      record.partType,
      identityKey(record.name),
    ].join(":");
    const canonical = canonicalParts.get(identity);
    if (!canonical) {
      canonicalParts.set(identity, record);
      deduped.push(record);
      continue;
    }

    redirects.set(record.id, canonical.id);
    canonical.aliases = [...new Set([
      ...canonical.aliases,
      ...record.aliases,
      ...(record.name === canonical.name ? [] : [record.name]),
    ])].sort();
  }

  const targetOfPart = (id: string) => redirects.get(id) ?? id;
  const partLinked = deduped.map((record) => ({
    ...record,
    components: record.components.map((component) => ({
      ...component,
      recordId: component.recordId ? targetOfPart(component.recordId) : undefined,
    })),
    releaseOf: record.releaseOf ? targetOfPart(record.releaseOf) : record.releaseOf,
    reissueOf: record.reissueOf ? targetOfPart(record.reissueOf) : record.reissueOf,
    containsRecordIds: record.containsRecordIds
      ? [...new Set(record.containsRecordIds.map(targetOfPart))]
      : record.containsRecordIds,
  }));

  const canonicalBeyblades = new Map<string, GenerationCatalogRecord>();
  const beybladeRedirects = new Map<string, string>();
  const modelDeduped: GenerationCatalogRecord[] = [];
  for (const record of partLinked) {
    if (record.kind !== "beyblade") {
      modelDeduped.push(record);
      continue;
    }
    const composition = [
      record.generationId,
      ...record.components.map((component) => component.recordId ?? component.name).sort(),
    ].join("|");
    const canonical = canonicalBeyblades.get(composition);
    if (!canonical) {
      canonicalBeyblades.set(composition, record);
      modelDeduped.push(record);
      continue;
    }
    beybladeRedirects.set(record.id, canonical.id);
  }

  const targetOf = (id: string) =>
    beybladeRedirects.get(id) ?? redirects.get(id) ?? id;
  return modelDeduped.map((record) => ({
    ...record,
    releaseOf: record.releaseOf ? targetOf(record.releaseOf) : record.releaseOf,
    reissueOf: record.reissueOf ? targetOf(record.reissueOf) : record.reissueOf,
    containsRecordIds: record.containsRecordIds
      ? [...new Set(record.containsRecordIds.map(targetOf))]
      : record.containsRecordIds,
  })).sort((left, right) => left.id.localeCompare(right.id));
}
