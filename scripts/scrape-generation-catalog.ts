/**
 * Cross-generation source snapshot.
 *
 * Stores only product/part names, taxonomy, composition, source versions and
 * provenance. It deliberately does not mirror descriptions, images or PDF
 * bodies. Community data with unclear reuse rights is written only to the
 * Needs Review snapshot.
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildBeybrewXRecords,
  dedupeCatalogRecords,
  parseBeywikiPartsList,
  parseBurstOfficialProducts,
  parseFandomCategory,
  parseFandomPartsPage,
  type BeybrewParts,
  type MasterDataPayload,
} from "../src/lib/generation-catalog/parsers.ts";
import {
  generationCatalogSnapshotSchema,
  type GenerationCatalogRecord,
  type GenerationDefinition,
  type GenerationId,
  type GenerationSource,
  type GenerationSystem,
} from "../src/lib/generation-catalog/schema.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outputPath = join(root, "data", "generation-catalog.json");
const needsReviewPath = join(root, "data", "generation-catalog-needs-review.json");
const userAgent = "OldBabyInfo generation-catalog-bot/1.0 (structured facts only)";

interface FetchResult {
  body: string;
  contentHash: string;
  sourceVersion: string;
}

interface MediaWikiParseResponse {
  parse?: {
    pageid?: number;
    revid?: number;
    title?: string;
    wikitext?: { "*": string };
  };
}

interface CategoryMember {
  pageid: number;
  ns: number;
  title: string;
}

interface MediaWikiCategoryResponse {
  continue?: { cmcontinue?: string; continue?: string };
  query?: { categorymembers?: CategoryMember[] };
}

function hashOf(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

async function fetchText(url: string): Promise<FetchResult> {
  const response = await fetch(url, {
    headers: { "user-agent": userAgent, accept: "text/html,application/json" },
  });
  if (!response.ok) throw new Error(`Source returned ${response.status}: ${url}`);
  const body = await response.text();
  const contentHash = hashOf(body);
  const sourceVersion =
    response.headers.get("etag") ??
    response.headers.get("last-modified") ??
    contentHash;
  return { body, contentHash, sourceVersion };
}

async function fetchJson<T>(url: string): Promise<{ value: T } & FetchResult> {
  const result = await fetchText(url);
  return { ...result, value: JSON.parse(result.body) as T };
}

function mediaWikiParseUrl(origin: string, title: string): string {
  const url = new URL("/api.php", origin);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", title);
  url.searchParams.set("prop", "wikitext|revid");
  url.searchParams.set("format", "json");
  if (origin.includes("fandom.com")) url.searchParams.set("origin", "*");
  return url.toString();
}

async function fetchMediaWikiPage(origin: string, title: string) {
  const response = await fetchJson<MediaWikiParseResponse>(mediaWikiParseUrl(origin, title));
  const parsed = response.value.parse;
  const wikitext = parsed?.wikitext?.["*"];
  if (!parsed || !wikitext) throw new Error(`MediaWiki page missing: ${title}`);
  return {
    ...response,
    title: parsed.title ?? title,
    wikitext,
    sourceVersion: parsed.revid ? `revision:${parsed.revid}` : response.sourceVersion,
  };
}

async function fetchCategoryMembers(origin: string, category: string) {
  const members: CategoryMember[] = [];
  const responseBodies: string[] = [];
  let continuation: string | undefined;
  do {
    const url = new URL("/api.php", origin);
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("list", "categorymembers");
    url.searchParams.set("cmtitle", `Category:${category}`);
    url.searchParams.set("cmtype", "page|subcat");
    url.searchParams.set("cmlimit", "max");
    url.searchParams.set("origin", "*");
    if (continuation) url.searchParams.set("cmcontinue", continuation);
    const response = await fetchJson<MediaWikiCategoryResponse>(url.toString());
    responseBodies.push(response.body);
    members.push(...(response.value.query?.categorymembers ?? []));
    continuation = response.value.continue?.cmcontinue;
  } while (continuation);
  const joined = responseBodies.join("\n");
  return {
    members,
    contentHash: hashOf(joined),
    sourceVersion: hashOf(joined),
  };
}

function source(
  input: Omit<GenerationSource, "sourceVersion" | "contentHash">,
  fetched: Pick<FetchResult, "sourceVersion" | "contentHash">,
): GenerationSource {
  return {
    ...input,
    sourceVersion: fetched.sourceVersion,
    contentHash: fetched.contentHash,
  };
}

const generations: GenerationDefinition[] = [
  {
    id: "bakuten_shoot",
    nameEn: "Original Generation",
    nameJa: "爆転シュート ベイブレード",
    ordinal: 1,
    launchedYear: 1999,
    evidenceSourceId: "takaratomy-history",
  },
  {
    id: "metal_fight",
    nameEn: "Metal Fight Beyblade",
    nameJa: "メタルファイト ベイブレード",
    ordinal: 2,
    launchedYear: 2008,
    evidenceSourceId: "takaratomy-history",
  },
  {
    id: "burst",
    nameEn: "Beyblade Burst",
    nameJa: "ベイブレードバースト",
    ordinal: 3,
    launchedYear: 2015,
    evidenceSourceId: "takaratomy-history",
  },
  {
    id: "x",
    nameEn: "BEYBLADE X",
    nameJa: "ベイブレードエックス",
    ordinal: 4,
    launchedYear: 2023,
    evidenceSourceId: "takaratomy-history",
  },
];

/** `[id, generationId, nameEn, partTypes, compatibilityRule?]` */
const systemSeeds: Array<[string, GenerationId, string, string[], string?]> = [
  ["plastic", "bakuten_shoot", "Plastic", ["attack_ring", "weight_disk", "blade_base", "bit_chip", "core", "engine_gear", "spin_gear", "support_part"]],
  ["hms", "bakuten_shoot", "HMS", ["attack_ring", "running_core", "bit_protector", "weight_disk"]],
  ["metal_system", "metal_fight", "Metal System", ["face_bolt", "wheel", "spin_track", "performance_tip"]],
  ["hybrid_wheel", "metal_fight", "Hybrid Wheel", ["face_bolt", "energy_ring", "fusion_wheel", "light_wheel", "spin_track", "performance_tip"]],
  ["4d", "metal_fight", "4D", ["face_bolt", "energy_ring", "fusion_wheel", "spin_track", "performance_tip"]],
  ["zero_g_synchrome", "metal_fight", "Zero-G / Synchrome", ["shogun_face_bolt", "warrior_wheel", "element_wheel", "spin_track", "performance_tip"]],
  ["burst", "burst", "Burst", ["layer", "disc", "driver"]],
  ["single_layer", "burst", "Single Layer", ["layer", "disc", "driver", "frame"]],
  ["dual_layer", "burst", "Dual Layer", ["layer", "disc", "driver", "frame"]],
  ["god", "burst", "God Layer", ["layer", "disc", "driver", "frame"]],
  ["cho_z", "burst", "Cho-Z", ["layer", "disc", "driver", "frame"]],
  ["gatinko", "burst", "Gatinko", ["layer", "gatinko_chip", "weight", "base", "disc", "driver", "frame"]],
  ["superking", "burst", "Superking", ["sparking_chip", "ring", "chassis", "weight", "disc", "driver", "frame"]],
  ["dynamite_battle", "burst", "Dynamite Battle", ["db_core", "armor", "blade", "disc", "driver"]],
  ["burst_ultimate", "burst", "Burst Ultimate", ["bu_blade", "db_core", "armor", "disc", "driver"]],
  // Not a fourth line beside BX/UX/CX: the bucket for X Parts that belong to
  // no single line. Ratchets and Bits are shared by design; a Blade lands here
  // only when no source states its line.
  [
    "x",
    "x",
    "Shared",
    ["blade", "ratchet", "bit"],
    "Ratchets and Bits are shared across BX, UX and CX; they are not scoped to one line.",
  ],
  ["bx", "x", "BX", ["blade", "ratchet", "bit"]],
  ["ux", "x", "UX", ["blade", "ratchet", "bit"]],
  ["cx", "x", "CX", ["blade", "main_blade", "assist_blade", "lock_chip", "metal_blade", "over_blade", "ratchet", "bit"]],
];

const systems: GenerationSystem[] = systemSeeds.map(([id, generationId, nameEn, partTypes, rule]) => ({
  id,
  generationId,
  nameEn,
  partTypes,
  compatibilityRules: [rule ?? `${partTypes.join(" + ")} is system-scoped; incompatible with other Systems.`],
}));

async function main() {
  const capturedAt = new Date().toISOString();
  const historyPromise = fetchText("https://beyblade.takaratomy.co.jp/history/index.html");
  const burstPromise = fetchText("https://beyblade.takaratomy.co.jp/burst/products.html");
  const fandomPagesPromise = Promise.all([
    ["List of Metal System parts", "metal_system"],
    ["List of Hybrid Wheel System parts", "hybrid_wheel"],
    ["List of 4D System parts", "4d"],
    ["List of Synchrome System parts", "zero_g_synchrome"],
    ["List of Burst System parts", "burst"],
  ].map(async ([title, system]) => ({
    system,
    page: await fetchMediaWikiPage("https://beyblade.fandom.com", title!),
  })));
  const fandomCategoriesPromise = Promise.all([
    ["Plastic Parts", "plastic"],
    ["Hard Metal System Parts", "hms"],
  ].map(async ([category, system]) => ({
    category,
    system,
    result: await fetchCategoryMembers("https://beyblade.fandom.com", category!),
  })));
  const beywikiPromise = fetchMediaWikiPage(
    "https://www.beywiki.com",
    "Beyblade Parts List",
  );
  const beypartsPromise = fetchJson<BeybrewParts>(
    "https://raw.githubusercontent.com/yujinyuz/beybrew/main/src/data/beyparts.json",
  );
  const masterDataPromise = fetchJson<{ masterData: string }>(
    "https://raw.githubusercontent.com/yujinyuz/beybrew/main/MasterData.json",
  );
  const beybrewCommitPromise = fetchJson<{ sha: string }>(
    "https://api.github.com/repos/yujinyuz/beybrew/commits/main",
  );

  const [
    history,
    burst,
    fandomPages,
    fandomCategories,
    beywiki,
    beyparts,
    masterDataOuter,
    beybrewCommit,
  ] = await Promise.all([
    historyPromise,
    burstPromise,
    fandomPagesPromise,
    fandomCategoriesPromise,
    beywikiPromise,
    beypartsPromise,
    masterDataPromise,
    beybrewCommitPromise,
  ]);

  const fandomHash = hashOf([
    ...fandomPages.map(({ page }) => page.contentHash),
    ...fandomCategories.map(({ result }) => result.contentHash),
  ].join("\n"));
  const beybrewHash = hashOf(`${beyparts.contentHash}\n${masterDataOuter.contentHash}`);
  const sources: GenerationSource[] = [
    source({
      id: "takaratomy-history",
      label: "BEYBLADE HISTORY 1999–2026",
      publisher: "Takara Tomy",
      canonicalUrl: "https://beyblade.takaratomy.co.jp/history/index.html",
      authority: "first_party",
      sourceKind: "official_history",
      sourceRegion: "JP",
      licenseName: null,
      licenseUrl: null,
      rightsStatus: "structured_facts_only",
      generationIds: ["bakuten_shoot", "metal_fight", "burst", "x"],
    }, history),
    source({
      id: "takaratomy-burst-products",
      label: "Beyblade Burst product archive",
      publisher: "Takara Tomy",
      canonicalUrl: "https://beyblade.takaratomy.co.jp/burst/products.html",
      authority: "first_party",
      sourceKind: "official_product",
      sourceRegion: "JP",
      licenseName: null,
      licenseUrl: null,
      rightsStatus: "structured_facts_only",
      generationIds: ["burst"],
    }, burst),
    {
      id: "beyblade-fandom",
      label: "Beyblade Wiki",
      publisher: "Fandom community",
      canonicalUrl: "https://beyblade.fandom.com/",
      authority: "community_wiki",
      sourceKind: "community_wiki",
      sourceRegion: "global",
      licenseName: "CC BY-SA",
      licenseUrl: "https://www.fandom.com/licensing",
      rightsStatus: "licensed",
      generationIds: ["bakuten_shoot", "metal_fight", "burst", "x"],
      sourceVersion: fandomHash,
      contentHash: fandomHash,
    },
    {
      id: "beywiki-parts-list",
      label: "Beyblade Parts List",
      publisher: "Beywiki / World Beyblade Organization community",
      canonicalUrl: "https://www.beywiki.com/index.php?title=Beyblade_Parts_List",
      authority: "community_wiki",
      sourceKind: "community_wiki",
      sourceRegion: "global",
      licenseName: null,
      licenseUrl: null,
      rightsStatus: "unknown",
      generationIds: ["bakuten_shoot", "metal_fight"],
      sourceVersion: beywiki.sourceVersion,
      contentHash: beywiki.contentHash,
    },
    {
      id: "beybrew",
      label: "BeyBrew official App-derived data",
      publisher: "yujinyuz",
      canonicalUrl: "https://github.com/yujinyuz/beybrew",
      authority: "official_app_derived",
      sourceKind: "official_app_derived",
      sourceRegion: "global",
      licenseName: null,
      licenseUrl: null,
      rightsStatus: "structured_facts_only",
      generationIds: ["x"],
      sourceVersion: `commit:${beybrewCommit.value.sha}`,
      contentHash: beybrewHash,
    },
  ];

  const fandomRecords: GenerationCatalogRecord[] = [
    ...fandomPages.flatMap(({ system, page }) =>
      parseFandomPartsPage({
        title: page.title,
        generationId: system === "burst" ? "burst" : "metal_fight",
        system: system!,
        wikitext: page.wikitext,
        sourceVersion: page.sourceVersion,
      })),
    ...fandomCategories.flatMap(({ category, system, result }) =>
      parseFandomCategory({
        category: category!,
        generationId: "bakuten_shoot",
        system: system!,
        titles: result.members.filter((member) => member.ns === 0).map((member) => member.title),
        sourceVersion: result.sourceVersion,
      })),
  ];
  const masterData = JSON.parse(masterDataOuter.value.masterData) as MasterDataPayload;
  const records = dedupeCatalogRecords([
    ...parseBurstOfficialProducts(burst.body, burst.sourceVersion),
    ...fandomRecords,
    ...parseBeywikiPartsList(beywiki.wikitext, beywiki.sourceVersion),
    ...buildBeybrewXRecords(
      beyparts.value,
      masterData,
      `commit:${beybrewCommit.value.sha}`,
    ),
  ]);

  const accepted = records.filter((record) => record.publicationStatus === "accepted");
  const needsReview = records.filter((record) => record.publicationStatus === "needs_review");
  const snapshotBase = { schemaVersion: 1 as const, capturedAt, sources, generations, systems };
  const acceptedSnapshot = generationCatalogSnapshotSchema.parse({
    ...snapshotBase,
    records: accepted,
  });
  const needsReviewSnapshot = generationCatalogSnapshotSchema.parse({
    ...snapshotBase,
    records: needsReview,
  });
  writeFileSync(outputPath, JSON.stringify(acceptedSnapshot, null, 2) + "\n");
  writeFileSync(needsReviewPath, JSON.stringify(needsReviewSnapshot, null, 2) + "\n");

  const byGeneration = Object.fromEntries(
    generations.map((generation) => [
      generation.id,
      accepted.filter((record) => record.generationId === generation.id).length,
    ]),
  );
  console.log(JSON.stringify({
    outputPath,
    needsReviewPath,
    accepted: accepted.length,
    needsReview: needsReview.length,
    byGeneration,
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
