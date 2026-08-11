import { z } from "zod";

export const phstudyOriginDocumentSchema = z.enum([
  "main.json",
  "hardcoded.json",
  "hasbro.json",
]);
export type PhstudyOriginDocument = z.infer<typeof phstudyOriginDocumentSchema>;

export interface PhstudyBitIdentitySourceRow {
  id: string;
  groupId: string | null;
  originDocument: PhstudyOriginDocument;
  hiddenUpstream: boolean;
  codeName?: {
    name?: Record<string, string | null | undefined> | null;
  } | null;
  stats: unknown | null;
  collectionOrder: number | null;
}

const originRank: Record<PhstudyOriginDocument, number> = {
  "main.json": 0,
  "hardcoded.json": 1,
  "hasbro.json": 2,
};

function rank(row: PhstudyBitIdentitySourceRow): [number, number, string] {
  return [
    originRank[row.originDocument],
    row.collectionOrder ?? Number.MAX_SAFE_INTEGER,
    row.id,
  ];
}

export function comparePhstudyRows(
  left: PhstudyBitIdentitySourceRow,
  right: PhstudyBitIdentitySourceRow,
): number {
  const [leftOrigin, leftOrder, leftId] = rank(left);
  const [rightOrigin, rightOrder, rightId] = rank(right);
  return leftOrigin - rightOrigin || leftOrder - rightOrder || leftId.localeCompare(rightId);
}

export function pickPhstudyRepresentative<Row extends PhstudyBitIdentitySourceRow>(
  rows: readonly Row[],
): Row | undefined {
  return [...rows].sort(comparePhstudyRows)[0];
}

export interface PhstudyBitIdentityProjection<Row extends PhstudyBitIdentitySourceRow> {
  partId: string;
  representative: Row | undefined;
  nameEn: string | undefined;
  nameJaReading: string | undefined;
  nameZhTwReading: string | undefined;
  nameJa: string | undefined;
  nameZhTw: string | undefined;
  aliases: string[];
}

/**
 * The shared SKU-to-Part identity projection used by both the phstudy merge
 * and its read-only parity audit. Bit naming is the owner-approved ADR-0010
 * exception recorded in `data/sources/phstudy/README.md`.
 */
export function projectPhstudyBitIdentity<Row extends PhstudyBitIdentitySourceRow>(
  partId: string,
  rows: readonly Row[],
): PhstudyBitIdentityProjection<Row> {
  const visible = rows.filter((row) => !row.hiddenUpstream);
  const representative = pickPhstudyRepresentative(visible.length > 0 ? visible : rows);
  const codeNames = [...rows]
    .sort(comparePhstudyRows)
    .find((row) => row.codeName?.name?.["en-US"]?.trim())
    ?.codeName?.name ?? undefined;
  const nameEn = codeNames?.["en-US"]?.trim() || undefined;
  const nameJaReading = codeNames?.["ja-JP"]?.trim() || undefined;
  const nameZhTwReading = codeNames?.["zh-TW"]?.trim() || undefined;

  return {
    partId,
    representative,
    nameEn,
    nameJaReading,
    nameZhTwReading,
    nameJa: nameJaReading ? `${partId}（${nameJaReading}）` : undefined,
    nameZhTw: nameZhTwReading ? `${partId} ${nameZhTwReading}` : undefined,
    aliases: [partId, nameZhTwReading, nameJaReading].filter(
      (value): value is string => Boolean(value),
    ),
  };
}
