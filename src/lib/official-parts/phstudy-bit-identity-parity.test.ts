import { describe, expect, it } from "vitest";
import type { Part } from "@/lib/parts/schema.ts";
import {
  auditPhstudyBitIdentityParity,
  formatPhstudyBitIdentityParityReport,
  phstudyBitIdentityRowsSchema,
  presentPhstudyBitIdentityParity,
} from "./phstudy-bit-identity-parity.ts";
import type { PhstudyBitIdentityRow } from "./phstudy-bit-identity-parity.ts";

function bit(overrides: Partial<Part> = {}): Part {
  return {
    id: "A",
    type: "bit",
    nameEn: "Accel",
    nameJa: "A（アクセル）",
    nameZhTw: "A 加速",
    aliases: ["A", "アクセル", "加速"],
    moldBatches: [],
    generation: "X",
    releaseAt: null,
    stats: {
      attack: 40,
      defense: 10,
      stamina: 10,
      xDash: 40,
      burstResistance: 80,
    },
    modes: [],
    statEditions: [],
    ...overrides,
  } as Part;
}

const accelCodeName: NonNullable<PhstudyBitIdentityRow["codeName"]> = {
  name: {
    "en-US": "Accel",
    "ja-JP": "アクセル",
    "zh-TW": "加速",
  },
};

describe("auditPhstudyBitIdentityParity", () => {
  it("rejects rows from an origin outside the documented three-file catalog", () => {
    expect(() => phstudyBitIdentityRowsSchema.parse([
      {
        id: "BT-A",
        groupId: "A",
        originDocument: "future-overlay.json",
        hiddenUpstream: false,
        codeName: accelCodeName,
        stats: {},
        collectionOrder: 1,
      },
    ])).toThrow();
  });

  it("collapses SKU rows into one localized Bit identity and reports placeholders", () => {
    const report = auditPhstudyBitIdentityParity(
      [
        {
          id: "BT-HASBRO-01",
          groupId: "A",
          originDocument: "hasbro.json",
          hiddenUpstream: false,
          codeName: accelCodeName,
          stats: {},
          collectionOrder: 1,
        },
        {
          id: "BT-MAIN-10",
          groupId: "A",
          originDocument: "main.json",
          hiddenUpstream: false,
          codeName: accelCodeName,
          stats: {},
          collectionOrder: 10,
        },
        {
          id: "BT-MAIN-02",
          groupId: "A",
          originDocument: "main.json",
          hiddenUpstream: false,
          codeName: accelCodeName,
          stats: {},
          collectionOrder: 2,
        },
        {
          id: "BT-BLANK",
          groupId: " ",
          originDocument: "hasbro.json",
          hiddenUpstream: false,
          codeName: null,
          stats: {},
          collectionOrder: null,
        },
        {
          id: "BT-PLACEHOLDER",
          groupId: "■",
          originDocument: "main.json",
          hiddenUpstream: false,
          codeName: null,
          stats: {},
          collectionOrder: 99,
        },
      ],
      [bit()],
    );

    expect(report).toEqual({
      ok: true,
      counts: {
        rows: 5,
        nonEmptyGroups: 2,
        usableIdentities: 1,
        publishedBits: 1,
        placeholders: 2,
      },
      identities: [
        {
          partId: "A",
          representativeRowId: "BT-MAIN-02",
          skuRows: 3,
        },
      ],
      placeholders: [
        {
          groupId: null,
          rowIds: ["BT-BLANK"],
          reasons: ["empty-group"],
        },
        {
          groupId: "■",
          rowIds: ["BT-PLACEHOLDER"],
          reasons: ["missing-code-name"],
        },
      ],
      mismatches: [],
    });
  });

  it("uses a later ranked code name when an earlier row has no English name", () => {
    const report = auditPhstudyBitIdentityParity(
      [
        {
          id: "BT-MAIN",
          groupId: "A",
          originDocument: "main.json",
          hiddenUpstream: false,
          codeName: { name: { "ja-JP": "未完成" } },
          stats: {},
          collectionOrder: 1,
        },
        {
          id: "BT-HASBRO",
          groupId: "A",
          originDocument: "hasbro.json",
          hiddenUpstream: false,
          codeName: accelCodeName,
          stats: {},
          collectionOrder: 1,
        },
      ],
      [bit()],
    );

    expect(report.ok).toBe(true);
    expect(report.counts.usableIdentities).toBe(1);
    expect(report.placeholders).toEqual([]);
  });

  it("reports missing, extra, misclassified, and incorrectly named Bit Parts", () => {
    const sourceRow = (
      groupId: string,
      codeName: typeof accelCodeName = accelCodeName,
    ): PhstudyBitIdentityRow => ({
      id: `BT-${groupId}`,
      groupId,
      originDocument: "main.json",
      hiddenUpstream: false,
      codeName,
      stats: {},
      collectionOrder: 1,
    });
    const wrongCategory = {
      ...bit({ id: "C" }),
      type: "blade",
      stats: { attack: 40, defense: 10, stamina: 10 },
    } as Part;

    const report = auditPhstudyBitIdentityParity(
      [
        sourceRow("A"),
        sourceRow("B"),
        sourceRow("C"),
        sourceRow("D", {
          name: {
            "en-US": "Dot",
          },
        }),
      ],
      [
        bit({
          nameEn: "Wrong Accel",
          nameJa: "wrong-ja",
          nameZhTw: "wrong-zh",
          aliases: ["wrong"],
        }),
        wrongCategory,
        bit({ id: "D", nameEn: "Dot", nameJa: undefined, nameZhTw: "D", aliases: ["D"] }),
        bit({ id: "Z", nameEn: "Zap" }),
      ],
    );

    expect(report.ok).toBe(false);
    expect(report.mismatches).toEqual([
      {
        partId: "A",
        field: "aliases",
        expected: ["A", "アクセル", "加速"],
        actual: ["wrong"],
      },
      { partId: "A", field: "nameEn", expected: "Accel", actual: "Wrong Accel" },
      { partId: "A", field: "nameJa", expected: "A（アクセル）", actual: "wrong-ja" },
      { partId: "A", field: "nameZhTw", expected: "A 加速", actual: "wrong-zh" },
      { partId: "B", field: "record", expected: "bit Part", actual: null },
      { partId: "C", field: "type", expected: "bit", actual: "blade" },
      { partId: "D", field: "source.nameJa", expected: "localized reading", actual: null },
      { partId: "D", field: "source.nameZhTw", expected: "localized reading", actual: null },
      { partId: "Z", field: "record", expected: null, actual: "bit Part" },
    ]);
  });

  it("formats an actionable human summary from the structured report", () => {
    const report = auditPhstudyBitIdentityParity(
      [
        {
          id: "BT-A",
          groupId: "A",
          originDocument: "main.json",
          hiddenUpstream: false,
          codeName: accelCodeName,
          stats: {},
          collectionOrder: 1,
        },
      ],
      [bit({ nameEn: "Wrong Accel" })],
    );

    expect(formatPhstudyBitIdentityParityReport(report)).toBe([
      "Bit identity parity: FAIL",
      "1 source row, 1 non-empty group, 1 usable identity, 1 published Bit, 0 placeholders.",
      "",
      "Mismatches (1)",
      '- `A` `nameEn`: expected "Accel"; actual "Wrong Accel".',
    ].join("\n"));
  });

  it("presents the same report as JSON and fails the command on mismatches", () => {
    const report = auditPhstudyBitIdentityParity(
      [
        {
          id: "BT-A",
          groupId: "A",
          originDocument: "main.json",
          hiddenUpstream: false,
          codeName: accelCodeName,
          stats: {},
          collectionOrder: 1,
        },
      ],
      [],
    );

    expect(presentPhstudyBitIdentityParity(report, "json")).toEqual({
      exitCode: 1,
      output: JSON.stringify(report, null, 2),
    });
  });
});
