import { z } from "zod";
import type { Part } from "../parts/schema.ts";
import { X_GENERATION_START_DATE } from "../parts/x-release-date.ts";
import type { PhstudyBitBattleProjection, PhstudyBitBattleSourceRow } from "./phstudy-bit-battle.ts";
import {
  comparePhstudyRows,
  pickPhstudyRepresentative,
  projectPhstudyBitIdentity,
  type PhstudyBitIdentityProjection,
} from "./phstudy-bit-identity.ts";

export const phstudyBitMetadataRowFields = {
  weight: z.object({ weight_g: z.number().nullish() }).nullish(),
  image: z.object({
    url: z.string().regex(/^\/sources\/phstudy\/images\/Bit\/[\w.-]+\.(?:png|jpg)$/),
    originalUrl: z.url(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  }).nullable().optional(),
};

export interface PhstudyBitMetadataSourceRow extends PhstudyBitBattleSourceRow {
  weight?: { weight_g?: number | null } | null;
  image?: {
    url: string;
    originalUrl: string;
    sha256: string;
  } | null;
}

type BitPart = Extract<Part, { type: "bit" }>;
type ProvenanceField = NonNullable<BitPart["provenance"]>[number]["fields"][number];

export interface PhstudyBitMetadataProjection<Row extends PhstudyBitMetadataSourceRow> {
  sourceReleaseAt: string | null;
  releaseAt: string | null;
  sourceWeightGrams: number | undefined;
  weightGrams: number | undefined;
  imageRow: Row | undefined;
}

function sourceReleaseAtOf(rows: readonly PhstudyBitMetadataSourceRow[]): string | null {
  const dates = rows.flatMap((row) => row.releaseAt ? [row.releaseAt.slice(0, 10)] : []);
  if (dates.length === 0) return null;
  const earliest = dates.sort()[0]!;
  return earliest < X_GENERATION_START_DATE ? null : earliest;
}

export function projectPhstudyBitMetadata<Row extends PhstudyBitMetadataSourceRow>(
  partId: string,
  rows: readonly Row[],
  existing?: Pick<BitPart, "releaseAt" | "weightGrams">,
): PhstudyBitMetadataProjection<Row> {
  const representative = projectPhstudyBitIdentity(partId, rows).representative;
  const sourceReleaseAt = sourceReleaseAtOf(rows);
  const representativeWeight = representative?.weight?.weight_g;
  const sourceWeightGrams = representativeWeight && representativeWeight > 0
    ? representativeWeight
    : [...rows]
        .sort(comparePhstudyRows)
        .find((row) => (row.weight?.weight_g ?? 0) > 0)
        ?.weight?.weight_g ?? undefined;
  const imageRow = pickPhstudyRepresentative(rows.filter((row) =>
    !row.hiddenUpstream && Boolean(row.image)));

  return {
    sourceReleaseAt,
    releaseAt: sourceReleaseAt ?? existing?.releaseAt ?? null,
    sourceWeightGrams,
    weightGrams: sourceWeightGrams ?? existing?.weightGrams,
    imageRow,
  };
}

export function projectPhstudyBitProvenanceFields<
  Row extends PhstudyBitMetadataSourceRow,
>(
  existing: BitPart | undefined,
  identity: PhstudyBitIdentityProjection<Row>,
  battle: PhstudyBitBattleProjection<Row>,
  metadata: PhstudyBitMetadataProjection<Row>,
): ProvenanceField[] {
  const fields: ProvenanceField[] = ["nameEn", "stats"];
  if (battle.statEditions.length > 0) fields.push("statEditions");
  if (identity.aliases.length > 0) fields.push("aliases");
  if (identity.nameJa) fields.push("nameJa");
  if (identity.nameZhTw) fields.push("nameZhTw");
  const priorOwnsId = (existing?.provenance ?? []).some(
    (entry) => entry.sourceId !== "phstudy-beyblade-x" && entry.fields.includes("id"),
  );
  if (!priorOwnsId) fields.push("id");
  if (battle.playstyle) fields.push("playstyle");
  if (battle.modes.length > 0) fields.push("modes");
  if (metadata.sourceReleaseAt) fields.push("releaseAt");
  if (metadata.sourceWeightGrams) fields.push("weightGrams");
  return fields;
}

export const phstudyManifestSchema = z.object({
  documents: z.array(z.object({
    path: z.string().min(1),
    url: z.url(),
    bytes: z.number().int().nonnegative(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })),
  normalized: z.array(z.object({
    path: z.string().min(1),
    bytes: z.number().int().nonnegative(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })),
});

export const phstudyBitCuratedBaselineSchema = z.record(
  z.string().min(1),
  z.object({ releaseAt: z.iso.date().nullable() }),
);

export function assertPhstudyManifestArtifact(
  manifest: z.infer<typeof phstudyManifestSchema>,
  path: string,
  actual: { bytes: number; sha256: string },
): string {
  const matches = [...manifest.documents, ...manifest.normalized]
    .filter((entry) => entry.path === path);
  if (matches.length !== 1) {
    throw new Error(`manifest.json must contain exactly one ${path} entry`);
  }
  const expected = matches[0]!;
  if (actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256) {
    throw new Error(
      `${path} does not match manifest.json (expected ${expected.bytes} bytes / ${expected.sha256})`,
    );
  }
  return expected.sha256;
}

export const publishedPartImagesSchema = z.record(z.string(), z.object({
  url: z.string().regex(/^\/parts\/[\w.-]+\.webp$/),
  originalUrl: z.url(),
  width: z.number().positive(),
  height: z.number().positive(),
  sourceId: z.enum(["go-shoot-x", "beybrew-image-index", "phstudy-beyblade-x"]),
  sourceUrl: z.url(),
  sourceVersion: z.string().regex(/^(?:commit:[a-f0-9]{40}|sha256:[a-f0-9]{64})$/),
  rightsStatus: z.literal("unknown"),
  licenseUrl: z.url().nullable(),
}));

export interface PhstudyBitParityArtifacts {
  manifest: z.infer<typeof phstudyManifestSchema>;
  images: z.infer<typeof publishedPartImagesSchema>;
  curatedBaseline: z.infer<typeof phstudyBitCuratedBaselineSchema>;
  sourceDocuments: Record<string, { bytes: number; sha256: string }>;
  sourceImages: Record<string, {
    sha256: string;
    webpSha256: string;
    width: number;
    height: number;
  }>;
  publishedImages: Record<string, { sha256: string; width: number; height: number }>;
}

export const requiredPhstudyDocumentPaths = [
  "raw/main.json",
  "raw/hardcoded.json",
  "raw/hasbro.json",
  "raw/part_colors.json",
  "raw/part_weights.json",
  "raw/part_code_names.json",
  "parts-bit.json",
] as const;
