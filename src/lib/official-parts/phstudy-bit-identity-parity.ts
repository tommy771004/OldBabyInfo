import { z } from "zod";
import type { Part } from "../parts/schema.ts";
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
  stats: z.record(z.string(), z.unknown()).nullable(),
  collectionOrder: z.number().nullable(),
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
  | "source.nameZhTw";

export interface PhstudyBitIdentityMismatch {
  partId: string;
  field: PhstudyBitIdentityField;
  expected: string | string[] | null;
  actual: string | string[] | null;
}

export interface PhstudyBitIdentityParityReport {
  ok: boolean;
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
  expected: string | string[] | null,
  actual: string | string[] | null,
): PhstudyBitIdentityMismatch {
  return { partId, field, expected, actual };
}

export function auditPhstudyBitIdentityParity(
  rows: PhstudyBitIdentityRow[],
  parts: Part[],
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
  }

  for (const part of publishedBits) {
    if (!usableIds.has(part.id)) mismatches.push(mismatch(part.id, "record", null, "bit Part"));
  }

  mismatches.sort((left, right) =>
    left.partId.localeCompare(right.partId) || left.field.localeCompare(right.field));

  return {
    ok: mismatches.length === 0,
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

function displayValue(value: string | string[] | null): string {
  return JSON.stringify(value);
}

export function formatPhstudyBitIdentityParityReport(
  report: PhstudyBitIdentityParityReport,
): string {
  const lines = [
    `Bit identity parity: ${report.ok ? "PASS" : "FAIL"}`,
    [
      countLabel(report.counts.rows, "source row"),
      countLabel(report.counts.nonEmptyGroups, "non-empty group"),
      countLabel(report.counts.usableIdentities, "usable identity", "usable identities"),
      countLabel(report.counts.publishedBits, "published Bit"),
      countLabel(report.counts.placeholders, "placeholder"),
    ].join(", ") + ".",
  ];

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
    for (const issue of report.mismatches) {
      lines.push(
        `- \`${issue.partId}\` \`${issue.field}\`: expected ${displayValue(issue.expected)}; ` +
          `actual ${displayValue(issue.actual)}.`,
      );
    }
  }

  return lines.join("\n");
}

export function presentPhstudyBitIdentityParity(
  report: PhstudyBitIdentityParityReport,
  format: "human" | "json",
): { output: string; exitCode: 0 | 1 } {
  return {
    output: format === "json"
      ? JSON.stringify(report, null, 2)
      : formatPhstudyBitIdentityParityReport(report),
    exitCode: report.ok ? 0 : 1,
  };
}
