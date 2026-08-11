import { z } from "zod";
import type { Part } from "../parts/schema.ts";
import {
  formatPhstudyBitModes,
  formatPhstudyBitStatEditions,
  phstudyBitBattleRowFields,
  projectPhstudyBitBattleFacts,
} from "./phstudy-bit-battle.ts";
import {
  phstudyBitMetadataRowFields,
  projectPhstudyBitMetadata,
  projectPhstudyBitProvenanceFields,
  requiredPhstudyDocumentPaths,
  type PhstudyBitParityArtifacts,
} from "./phstudy-bit-metadata.ts";
import {
  phstudyOriginDocumentSchema,
  projectPhstudyBitIdentity,
} from "./phstudy-bit-identity.ts";

const phstudyBitIdentityRowSchema = z.object({
  id: z.string().min(1),
  groupId: z.string().nullable(),
  originDocument: phstudyOriginDocumentSchema,
  hiddenUpstream: z.boolean(),
  codeName: z.object({
    name: z.record(z.string(), z.string().nullish()),
  }).nullable(),
  collectionOrder: z.number().nullable(),
  ...phstudyBitBattleRowFields,
  ...phstudyBitMetadataRowFields,
});

export const phstudyBitIdentityRowsSchema = z.array(phstudyBitIdentityRowSchema);
export type PhstudyBitIdentityRow = z.infer<typeof phstudyBitIdentityRowSchema>;

export type PhstudyBitPlaceholderReason =
  | "empty-group"
  | "missing-code-name"
  | "missing-stats";

export interface PhstudyBitPlaceholder {
  groupId: string | null;
  rowIds: string[];
  reasons: PhstudyBitPlaceholderReason[];
}

export type PhstudyBitIdentityField =
  | "record"
  | "type"
  | "nameEn"
  | "nameJa"
  | "nameZhTw"
  | "aliases"
  | "source.nameJa"
  | "source.nameZhTw"
  | "playstyle"
  | "stats.attack"
  | "stats.defense"
  | "stats.stamina"
  | "stats.xDash"
  | "stats.burstResistance"
  | "modes"
  | "statEditions"
  | "document.requiredHashes"
  | "metadata.releaseAt"
  | "metadata.weightGrams"
  | "image.record"
  | "image.file"
  | "image.sourceFileHash"
  | "image.url"
  | "image.originalUrl"
  | "image.width"
  | "image.height"
  | "image.sourceId"
  | "image.sourceUrl"
  | "image.sourceVersion"
  | "image.rightsStatus"
  | "image.licenseUrl"
  | "provenance.record"
  | "provenance.sourceUrl"
  | "provenance.sourceVersion"
  | "provenance.authority"
  | "provenance.rightsStatus"
  | "provenance.fields";

type PhstudyBitIdentityValue = string | number | string[] | null;

export interface PhstudyBitIdentityMismatch {
  partId: string;
  field: PhstudyBitIdentityField;
  expected: PhstudyBitIdentityValue;
  actual: PhstudyBitIdentityValue;
}

export interface PhstudyBitIdentityParityReport {
  ok: boolean;
  artifactsChecked: boolean;
  counts: {
    rows: number;
    nonEmptyGroups: number;
    usableIdentities: number;
    publishedBits: number;
    placeholders: number;
  };
  identities: Array<{
    partId: string;
    representativeRowId: string;
    skuRows: number;
  }>;
  placeholders: PhstudyBitPlaceholder[];
  mismatches: PhstudyBitIdentityMismatch[];
}

function normalizedAliases(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
}

function mismatch(
  partId: string,
  field: PhstudyBitIdentityField,
  expected: PhstudyBitIdentityValue,
  actual: PhstudyBitIdentityValue,
): PhstudyBitIdentityMismatch {
  return { partId, field, expected, actual };
}

export function auditPhstudyBitIdentityParity(
  rows: PhstudyBitIdentityRow[],
  parts: Part[],
  artifacts?: PhstudyBitParityArtifacts,
): PhstudyBitIdentityParityReport {
  const groups = new Map<string, PhstudyBitIdentityRow[]>();
  const emptyGroupRows: PhstudyBitIdentityRow[] = [];
  for (const row of rows) {
    const groupId = row.groupId?.trim();
    if (!groupId) {
      emptyGroupRows.push(row);
      continue;
    }
    groups.set(groupId, [...(groups.get(groupId) ?? []), row]);
  }

  const placeholders: PhstudyBitPlaceholder[] = [];
  if (emptyGroupRows.length > 0) {
    placeholders.push({
      groupId: null,
      rowIds: emptyGroupRows.map((row) => row.id).sort(),
      reasons: ["empty-group"],
    });
  }

  const partsById = new Map(parts.map((part) => [part.id, part]));
  const publishedBits = parts.filter((part) => part.type === "bit");
  const usableIds = new Set<string>();
  const identities: PhstudyBitIdentityParityReport["identities"] = [];
  const mismatches: PhstudyBitIdentityMismatch[] = [];
  const documents = artifacts
      ? [
        ...artifacts.manifest.documents.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 })),
        ...artifacts.manifest.normalized.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 })),
      ]
    : [];
  const validDocumentPaths = requiredPhstudyDocumentPaths.filter((path) => {
    const matching = documents.filter((document) => document.path === path);
    const sourceDocument = artifacts?.sourceDocuments[path];
    return matching.length === 1 &&
      /^[a-f0-9]{64}$/.test(matching[0]!.sha256) &&
      sourceDocument?.sha256 === matching[0]!.sha256 &&
      sourceDocument.bytes === matching[0]!.bytes;
  });
  if (artifacts && validDocumentPaths.length !== requiredPhstudyDocumentPaths.length) {
    mismatches.push(mismatch(
      "phstudy",
      "document.requiredHashes",
      [...requiredPhstudyDocumentPaths],
      validDocumentPaths,
    ));
  }
  const normalizedHash = documents.find((document) => document.path === "parts-bit.json")?.sha256;

  for (const [partId, groupRows] of [...groups].sort(([left], [right]) => left.localeCompare(right))) {
    const identity = projectPhstudyBitIdentity(partId, groupRows);
    const { nameEn, representative } = identity;
    const reasons: PhstudyBitPlaceholderReason[] = [];
    if (!nameEn) reasons.push("missing-code-name");
    if (!representative?.stats) reasons.push("missing-stats");
    if (!nameEn || !representative?.stats) {
      placeholders.push({
        groupId: partId,
        rowIds: groupRows.map((row) => row.id).sort(),
        reasons,
      });
      continue;
    }

    usableIds.add(partId);
    identities.push({
      partId,
      representativeRowId: representative.id,
      skuRows: groupRows.length,
    });

    const part = partsById.get(partId);
    if (!part) {
      mismatches.push(mismatch(partId, "record", "bit Part", null));
      continue;
    }
    if (part.type !== "bit") {
      mismatches.push(mismatch(partId, "type", "bit", part.type));
      continue;
    }

    if (!identity.nameJaReading) {
      mismatches.push(mismatch(partId, "source.nameJa", "localized reading", null));
    }
    if (!identity.nameZhTwReading) {
      mismatches.push(mismatch(partId, "source.nameZhTw", "localized reading", null));
    }

    const expectedAliases = normalizedAliases(identity.aliases);
    const actualAliases = normalizedAliases(part.aliases);

    if (part.nameEn !== nameEn) {
      mismatches.push(mismatch(partId, "nameEn", nameEn, part.nameEn));
    }
    if (identity.nameJa && part.nameJa !== identity.nameJa) {
      mismatches.push(mismatch(partId, "nameJa", identity.nameJa, part.nameJa ?? null));
    }
    if (identity.nameZhTw && part.nameZhTw !== identity.nameZhTw) {
      mismatches.push(mismatch(partId, "nameZhTw", identity.nameZhTw, part.nameZhTw ?? null));
    }
    if (JSON.stringify(actualAliases) !== JSON.stringify(expectedAliases)) {
      mismatches.push(mismatch(partId, "aliases", expectedAliases, actualAliases));
    }

    const battle = projectPhstudyBitBattleFacts(partId, groupRows, part);
    if (battle.playstyle && part.playstyle !== battle.playstyle) {
      mismatches.push(mismatch(partId, "playstyle", battle.playstyle, part.playstyle ?? null));
    }
    if (battle.stats) {
      const statFields = [
        "attack",
        "defense",
        "stamina",
        "xDash",
        "burstResistance",
      ] as const;
      for (const field of statFields) {
        if (part.stats[field] !== battle.stats[field]) {
          mismatches.push(mismatch(
            partId,
            `stats.${field}`,
            battle.stats[field],
            part.stats[field],
          ));
        }
      }
    }
    const expectedModes = formatPhstudyBitModes(battle.modes);
    const actualModes = formatPhstudyBitModes(part.modes);
    if (JSON.stringify(actualModes) !== JSON.stringify(expectedModes)) {
      mismatches.push(mismatch(partId, "modes", expectedModes, actualModes));
    }
    const expectedEditions = formatPhstudyBitStatEditions(battle.statEditions);
    const actualEditions = formatPhstudyBitStatEditions(part.statEditions);
    if (JSON.stringify(actualEditions) !== JSON.stringify(expectedEditions)) {
      mismatches.push(mismatch(partId, "statEditions", expectedEditions, actualEditions));
    }

    if (artifacts) {
      const metadata = projectPhstudyBitMetadata(partId, groupRows, part);
      if (metadata.sourceReleaseAt && part.releaseAt !== metadata.sourceReleaseAt) {
        mismatches.push(mismatch(
          partId,
          "metadata.releaseAt",
          metadata.sourceReleaseAt,
          part.releaseAt,
        ));
      } else if (!metadata.sourceReleaseAt) {
        const baseline = artifacts.curatedBaseline[partId];
        if (baseline && part.releaseAt !== baseline.releaseAt) {
          mismatches.push(mismatch(
            partId,
            "metadata.releaseAt",
            baseline.releaseAt,
            part.releaseAt,
          ));
        }
      }
      if (metadata.sourceWeightGrams && part.weightGrams !== metadata.sourceWeightGrams) {
        mismatches.push(mismatch(
          partId,
          "metadata.weightGrams",
          metadata.sourceWeightGrams,
          part.weightGrams ?? null,
        ));
      }

      const provenance = (part.provenance ?? []).filter((entry) =>
        entry.sourceId === "phstudy-beyblade-x");
      if (provenance.length !== 1) {
        mismatches.push(mismatch(partId, "provenance.record", "one phstudy entry", provenance.length));
      } else {
        const actual = provenance[0]!;
        const expectedFields = projectPhstudyBitProvenanceFields(
          part,
          identity,
          battle,
          metadata,
        ).sort();
        const actualFields = [...actual.fields].sort();
        const expectedAuthority = "community_source";
        if (actual.sourceUrl !== "https://beyblade.phstudy.org/?category=Bit") {
          mismatches.push(mismatch(
            partId,
            "provenance.sourceUrl",
            "https://beyblade.phstudy.org/?category=Bit",
            actual.sourceUrl,
          ));
        }
        if (normalizedHash && actual.sourceVersion !== `sha256:${normalizedHash}`) {
          mismatches.push(mismatch(
            partId,
            "provenance.sourceVersion",
            `sha256:${normalizedHash}`,
            actual.sourceVersion,
          ));
        }
        if (actual.authority !== expectedAuthority) {
          mismatches.push(mismatch(
            partId,
            "provenance.authority",
            expectedAuthority,
            actual.authority,
          ));
        }
        if (actual.rightsStatus !== "unknown") {
          mismatches.push(mismatch(
            partId,
            "provenance.rightsStatus",
            "unknown",
            actual.rightsStatus,
          ));
        }
        if (JSON.stringify(actualFields) !== JSON.stringify(expectedFields)) {
          mismatches.push(mismatch(partId, "provenance.fields", expectedFields, actualFields));
        }
      }

      const imageRow = metadata.imageRow;
      const actualImage = artifacts.images[partId];
      if (imageRow?.image) {
        const sourceImage = artifacts.sourceImages[imageRow.image.url];
        if (sourceImage?.sha256 !== imageRow.image.sha256) {
          mismatches.push(mismatch(
            partId,
            "image.sourceFileHash",
            imageRow.image.sha256,
            sourceImage?.sha256 ?? null,
          ));
        }
        if (!actualImage) {
          mismatches.push(mismatch(partId, "image.record", "published image", null));
        } else {
          const fileStem = partId.replace(/[^\w.-]+/g, "-");
          const published = artifacts.publishedImages[partId];
          const expectedImageValues = {
            url: `/parts/${fileStem}.webp`,
            originalUrl: imageRow.image.originalUrl,
            sourceId: "phstudy-beyblade-x",
            sourceUrl: "https://beyblade.phstudy.org/?category=Bit",
            rightsStatus: "unknown",
            licenseUrl: null,
          } as const;
          for (const field of Object.keys(expectedImageValues) as Array<keyof typeof expectedImageValues>) {
            if (actualImage[field] !== expectedImageValues[field]) {
              mismatches.push(mismatch(
                partId,
                `image.${field}`,
                expectedImageValues[field],
                actualImage[field],
              ));
            }
          }
          if (!published) {
            mismatches.push(mismatch(partId, "image.file", "published WebP", null));
          } else {
            const expectedWidth = sourceImage?.width ?? published.width;
            const expectedHeight = sourceImage?.height ?? published.height;
            if (actualImage.width !== expectedWidth || published.width !== expectedWidth) {
              mismatches.push(mismatch(partId, "image.width", expectedWidth, actualImage.width));
            }
            if (actualImage.height !== expectedHeight || published.height !== expectedHeight) {
              mismatches.push(mismatch(partId, "image.height", expectedHeight, actualImage.height));
            }
            const expectedPublishedHash = sourceImage?.webpSha256 ?? published.sha256;
            if (published.sha256 !== expectedPublishedHash) {
              mismatches.push(mismatch(
                partId,
                "image.file",
                expectedPublishedHash,
                published.sha256,
              ));
            }
            const expectedVersion = `sha256:${expectedPublishedHash}`;
            if (actualImage.sourceVersion !== expectedVersion) {
              mismatches.push(mismatch(
                partId,
                "image.sourceVersion",
                expectedVersion,
                actualImage.sourceVersion,
              ));
            }
          }
        }
      } else if (actualImage?.sourceId === "phstudy-beyblade-x") {
        mismatches.push(mismatch(partId, "image.record", null, "published image"));
      }
    }
  }

  for (const part of publishedBits) {
    if (!usableIds.has(part.id)) mismatches.push(mismatch(part.id, "record", null, "bit Part"));
  }

  mismatches.sort((left, right) =>
    left.partId.localeCompare(right.partId) || left.field.localeCompare(right.field));

  return {
    ok: mismatches.length === 0,
    artifactsChecked: Boolean(artifacts),
    counts: {
      rows: rows.length,
      nonEmptyGroups: groups.size,
      usableIdentities: usableIds.size,
      publishedBits: publishedBits.length,
      placeholders: placeholders.length,
    },
    identities,
    placeholders,
    mismatches,
  };
}

function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function displayValue(value: PhstudyBitIdentityValue): string {
  return JSON.stringify(value);
}

export function formatPhstudyBitIdentityParityReport(
  report: PhstudyBitIdentityParityReport,
  options: { maxMismatches?: number } = {},
): string {
  const lines = [
    `Bit parity: ${report.ok ? "PASS" : "FAIL"}`,
    [
      countLabel(report.counts.rows, "source row"),
      countLabel(report.counts.nonEmptyGroups, "non-empty group"),
      countLabel(report.counts.usableIdentities, "usable identity", "usable identities"),
      countLabel(report.counts.publishedBits, "published Bit"),
      countLabel(report.counts.placeholders, "placeholder"),
    ].join(", ") + ".",
    "Battle facts: Playstyle, five Stats, Modes, and Stat Editions checked.",
  ];
  if (report.artifactsChecked) {
    lines.push("Metadata: release, weight, images, document hashes, and provenance checked.");
  }

  if (report.placeholders.length > 0) {
    lines.push("", `Placeholders (${report.placeholders.length})`);
    for (const placeholder of report.placeholders) {
      const groupId = placeholder.groupId === null ? "empty group" : `\`${placeholder.groupId}\``;
      lines.push(
        `- ${groupId}: ${placeholder.reasons.join(", ")} ` +
          `(rows: ${placeholder.rowIds.map((id) => `\`${id}\``).join(", ")}).`,
      );
    }
  }

  if (report.mismatches.length > 0) {
    lines.push("", `Mismatches (${report.mismatches.length})`);
    const visible = options.maxMismatches === undefined
      ? report.mismatches
      : report.mismatches.slice(0, options.maxMismatches);
    for (const issue of visible) {
      lines.push(
        `- \`${issue.partId}\` \`${issue.field}\`: expected ${displayValue(issue.expected)}; ` +
          `actual ${displayValue(issue.actual)}.`,
      );
    }
    const omitted = report.mismatches.length - visible.length;
    if (omitted > 0) lines.push(`- … ${omitted} more; run without \`--summary\` for the full report.`);
  }

  return lines.join("\n");
}

export function presentPhstudyBitIdentityParity(
  report: PhstudyBitIdentityParityReport,
  format: "human" | "json",
  options: { maxMismatches?: number } = {},
): { output: string; exitCode: 0 | 1 } {
  return {
    output: format === "json"
      ? JSON.stringify(report, null, 2)
      : formatPhstudyBitIdentityParityReport(report, options),
    exitCode: report.ok ? 0 : 1,
  };
}
