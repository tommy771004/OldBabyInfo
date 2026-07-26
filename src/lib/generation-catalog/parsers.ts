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
  return normalized === "support_parts" ? "support_part" : normalized;
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
    const system = components.some((component) => /buブレード/i.test(component.partType))
      ? "burst_ultimate"
      : components.some((component) => /ダイナマイトバトルコア|dbコア/i.test(component.partType))
        ? "dynamite_battle"
        : components.some((component) => /スパーキングチップ|リング|シャーシ/i.test(component.partType))
          ? "superking"
            : components.some((component) => /ガチンコチップ|ウエイト|ベース/i.test(component.partType))
              ? "gatinko"
            : burstLayerSystemForProduct(productName);
    const anchorId = box[1]!;
    const sourceRecordId = `${anchorId}:${productName}`;
    const beybladeId = recordId("takaratomy-burst-products", sourceRecordId);
    const componentRecordIds = components.map((component) =>
      recordId("takaratomy-burst-products", `part:${component.partType}:${component.name}`),
    );
    records.push({
      id: beybladeId,
      generationId: "burst",
      system,
      kind: "beyblade",
      partType: null,
      name: productName,
      aliases: [],
      components,
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
      containsRecordIds: [beybladeId, ...componentRecordIds],
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
}

export interface MasterDataPayload {
  data?: Record<string, MasterDataEntry[]>;
}

function cleanMasterDataName(value: string | undefined): string | null {
  if (!value) return null;
  const cleaned = plainText(value)
    .replace(/^(?:BX|UX|CX|BXG|BXA|BXH)-?\d+\s*/i, "")
    .replace(/\s*【(?:rental|レンタル)】/gi, "")
    .trim();
  return cleaned || null;
}

function xSystemForModel(modelName: string | undefined): string {
  const line = modelName?.match(/^(BX|UX|CX)/i)?.[1];
  return line?.toLowerCase() ?? "x";
}

function xSystemForPartType(partType: string, modelName?: string): string {
  return ["main_blade", "assist_blade", "lock_chip", "metal_blade", "over_blade"].includes(partType)
    ? "cx"
    : xSystemForModel(modelName);
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
        system: xSystemForPartType(partType),
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
      const system = xSystemForPartType(partType, entry.model_name);
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
    if (seenParts.has(key) || seenParts.has(genericKey)) continue;
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

  for (const series of data.BeybladeSeries ?? []) {
    if (!series.model_name) continue;
    const name = cleanMasterDataName(series.name?.["en-US"] ?? series.name?.["ja-JP"]);
    const components = entriesByModel.get(series.model_name) ?? [];
    if (!name || components.length === 0) continue;
    records.push({
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
  return records;
}

export function dedupeCatalogRecords(records: GenerationCatalogRecord[]): GenerationCatalogRecord[] {
  const byId = new Map<string, GenerationCatalogRecord>();
  for (const record of records) byId.set(record.id, record);
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}
