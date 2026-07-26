import { createHash } from "node:crypto";
import type { GenerationCatalogRecord, GenerationId } from "./schema.ts";

export interface ReleaseEquipmentInput {
  sourceRecordId: string;
  name: string;
}

export interface ReleaseProductInput {
  sourceRecordId: string;
  sku: string;
  name: string;
  region: string;
  colorway?: string;
  reissueOf?: string;
  mechanicalRecordId?: string;
  componentRecordIds?: string[];
  equipment?: ReleaseEquipmentInput[];
}

export interface ReleaseSourceInput {
  sourceId: string;
  sourceUrl: string;
  sourceVersion: string;
  generationId: GenerationId;
  system: string;
  products: ReleaseProductInput[];
}

export type FunboxReleaseMatch =
  | { status: "matched"; releaseId: string; sourceRecordId: string; productUrl: string }
  | { status: "needs_review"; reason: "ambiguous" | "unmatched"; sourceRecordId: string };

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

function releaseId(sourceId: string, sourceRecordId: string): string {
  return `${sourceId}:release:${stableToken(sourceRecordId)}`;
}

function equipmentId(sourceId: string, sourceRecordId: string): string {
  return `${sourceId}:equipment:${stableToken(sourceRecordId)}`;
}

function normalizeIdentity(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, "");
}

export function buildReleaseRecords(input: ReleaseSourceInput): GenerationCatalogRecord[] {
  const records: GenerationCatalogRecord[] = [];
  const equipmentById = new Map<string, GenerationCatalogRecord>();

  for (const product of input.products) {
    const releaseRecordId = releaseId(input.sourceId, product.sourceRecordId);
    const productEquipment = (product.equipment ?? []).map((equipment) => {
      const id = equipmentId(input.sourceId, equipment.sourceRecordId);
      if (!equipmentById.has(id)) {
        equipmentById.set(id, {
          id,
          generationId: input.generationId,
          system: input.system,
          kind: "equipment",
          partType: null,
          name: equipment.name,
          aliases: [],
          components: [],
          sourceId: input.sourceId,
          sourceRecordId: `equipment:${equipment.sourceRecordId}`,
          sourceUrl: input.sourceUrl,
          sourceVersion: input.sourceVersion,
          verificationStatus: "officially_verified",
          publicationStatus: "accepted",
          comboEligible: false,
        });
      }
      return id;
    });

    records.push({
      id: releaseRecordId,
      generationId: input.generationId,
      system: input.system,
      kind: "release",
      partType: null,
      name: product.name,
      aliases: [],
      components: [],
      sourceId: input.sourceId,
      sourceRecordId: `release:${product.sourceRecordId}`,
      sourceUrl: input.sourceUrl,
      sourceVersion: input.sourceVersion,
      verificationStatus: "officially_verified",
      publicationStatus: "accepted",
      releaseOf: product.mechanicalRecordId ?? null,
      containsRecordIds: [...(product.componentRecordIds ?? []), ...productEquipment],
      sku: product.sku,
      region: product.region,
      colorway: product.colorway,
      reissueOf: product.reissueOf,
      comboEligible: false,
    });
  }

  return [...records, ...equipmentById.values()];
}

export function matchFunboxRelease(
  candidate: { sourceRecordId?: string; id?: string; productName: string; productUrl: string },
  releases: GenerationCatalogRecord[],
): FunboxReleaseMatch {
  const query = normalizeIdentity(candidate.productName);
  const releaseCandidates = releases.filter((release) => release.kind === "release");
  const exactMatches = releaseCandidates.filter((release) => {
    const identities = [release.name, release.sku].filter(
      (value): value is string => Boolean(value),
    ).map(normalizeIdentity);
    return identities.some((identity) => identity === query);
  });
  const matches = exactMatches.length > 0 ? exactMatches : releaseCandidates.filter((release) => {
    if (release.kind !== "release") return false;
    const identities = [release.name, release.sku].filter(
      (value): value is string => Boolean(value),
    ).map(normalizeIdentity);
    return identities.some((identity) => identity === query || identity.includes(query) || query.includes(identity));
  });

  if (matches.length !== 1) {
    return {
      status: "needs_review",
      reason: matches.length === 0 ? "unmatched" : "ambiguous",
      sourceRecordId: candidate.sourceRecordId ?? candidate.id ?? "unknown",
    };
  }
  return {
    status: "matched",
    releaseId: matches[0]!.id,
    sourceRecordId: candidate.sourceRecordId ?? candidate.id ?? "unknown",
    productUrl: candidate.productUrl,
  };
}
