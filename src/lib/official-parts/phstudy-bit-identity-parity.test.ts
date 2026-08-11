import { describe, expect, it } from "vitest";
import type { Part } from "@/lib/parts/schema.ts";
import {
  auditPhstudyBitIdentityParity,
  formatPhstudyBitIdentityParityReport,
  phstudyBitIdentityRowsSchema,
  presentPhstudyBitIdentityParity,
} from "./phstudy-bit-identity-parity.ts";
import type { PhstudyBitIdentityRow } from "./phstudy-bit-identity-parity.ts";
import { assertPhstudyManifestArtifact } from "./phstudy-bit-metadata.ts";

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

const accelSourceStats = {
  attack: 40,
  defense: 10,
  stamina: 10,
  dash: 40,
  burst: 80,
};

describe("auditPhstudyBitIdentityParity", () => {
  it("rejects a normalized artifact whose bytes do not match its unique manifest claim", () => {
    const sha256 = "a".repeat(64);
    const manifest = {
      documents: [],
      normalized: [{ path: "parts-bit.json", bytes: 10, sha256 }],
    };

    expect(assertPhstudyManifestArtifact(manifest, "parts-bit.json", {
      bytes: 10,
      sha256,
    })).toBe(sha256);
    expect(() => assertPhstudyManifestArtifact(manifest, "parts-bit.json", {
      bytes: 11,
      sha256,
    })).toThrow("does not match manifest.json");
    expect(() => assertPhstudyManifestArtifact({
      ...manifest,
      normalized: [...manifest.normalized, ...manifest.normalized],
    }, "parts-bit.json", { bytes: 10, sha256 })).toThrow("exactly one");
  });

  it("rejects rows from an origin outside the documented three-file catalog", () => {
    expect(() => phstudyBitIdentityRowsSchema.parse([
      {
        id: "BT-A",
        groupId: "A",
        originDocument: "future-overlay.json",
        hiddenUpstream: false,
        codeName: accelCodeName,
        stats: accelSourceStats,
        collectionOrder: 1,
      },
    ])).toThrow();
  });

  it("rejects incomplete or invalid staged battle facts", () => {
    const row = {
      id: "BT-A",
      groupId: "A",
      originDocument: "main.json",
      hiddenUpstream: false,
      codeName: accelCodeName,
      stats: accelSourceStats,
      collectionOrder: 1,
      partType: "attack",
      modelName: "Attack A",
      releaseAt: "2024-01-01T15:00:00.000Z",
    };

    expect(() => phstudyBitIdentityRowsSchema.parse([
      { ...row, stats: { ...accelSourceStats, burst: undefined } },
    ])).toThrow();
    expect(() => phstudyBitIdentityRowsSchema.parse([
      { ...row, partType: "unknown" },
    ])).toThrow();
    expect(() => phstudyBitIdentityRowsSchema.parse([
      { ...row, releaseAt: "not-a-date" },
    ])).toThrow();
    expect(() => phstudyBitIdentityRowsSchema.parse([
      {
        ...row,
        image: {
          url: "/sources/phstudy/../../../../etc/passwd",
          originalUrl: "https://beyblade.phstudy.org/etc/passwd",
          sha256: "a".repeat(64),
        },
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
          stats: accelSourceStats,
          collectionOrder: 1,
        },
        {
          id: "BT-MAIN-10",
          groupId: "A",
          originDocument: "main.json",
          hiddenUpstream: false,
          codeName: accelCodeName,
          stats: accelSourceStats,
          collectionOrder: 10,
        },
        {
          id: "BT-MAIN-02",
          groupId: "A",
          originDocument: "main.json",
          hiddenUpstream: false,
          codeName: accelCodeName,
          stats: accelSourceStats,
          collectionOrder: 2,
        },
        {
          id: "BT-BLANK",
          groupId: " ",
          originDocument: "hasbro.json",
          hiddenUpstream: false,
          codeName: null,
          stats: accelSourceStats,
          collectionOrder: null,
        },
        {
          id: "BT-PLACEHOLDER",
          groupId: "■",
          originDocument: "main.json",
          hiddenUpstream: false,
          codeName: null,
          stats: accelSourceStats,
          collectionOrder: 99,
        },
      ],
      [bit()],
    );

    expect(report).toEqual({
      ok: true,
      artifactsChecked: false,
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
          stats: accelSourceStats,
          collectionOrder: 1,
        },
        {
          id: "BT-HASBRO",
          groupId: "A",
          originDocument: "hasbro.json",
          hiddenUpstream: false,
          codeName: accelCodeName,
          stats: accelSourceStats,
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
      stats: accelSourceStats,
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

  it("reports Playstyle and each of the five Stat dimensions", () => {
    const rows = phstudyBitIdentityRowsSchema.parse([
      {
        id: "BT-A",
        groupId: "A",
        originDocument: "main.json",
        hiddenUpstream: false,
        codeName: accelCodeName,
        partType: "attack",
        stats: {
          attack: 40,
          defense: 10,
          stamina: 20,
          dash: 30,
          burst: 80,
        },
        collectionOrder: 1,
        modelName: "Attack A",
        releaseAt: "2024-01-01T15:00:00.000Z",
      },
    ]);
    const report = auditPhstudyBitIdentityParity(rows, [
      bit({
        playstyle: "balance",
        stats: {
          attack: 1,
          defense: 2,
          stamina: 3,
          xDash: 4,
          burstResistance: 5,
        },
      }),
    ]);

    expect(report.mismatches.filter((issue) =>
      issue.field === "playstyle" || issue.field.startsWith("stats.")
    )).toEqual([
      { partId: "A", field: "playstyle", expected: "attack", actual: "balance" },
      { partId: "A", field: "stats.attack", expected: 40, actual: 1 },
      { partId: "A", field: "stats.burstResistance", expected: 80, actual: 5 },
      { partId: "A", field: "stats.defense", expected: 10, actual: 2 },
      { partId: "A", field: "stats.stamina", expected: 20, actual: 3 },
      { partId: "A", field: "stats.xDash", expected: 30, actual: 4 },
    ]);
  });

  it("keeps a visible canonical tuple and separates hidden Modes from visible Stat Editions", () => {
    const rows = phstudyBitIdentityRowsSchema.parse([
      {
        id: "BT-EDITION-LATE",
        groupId: "A",
        originDocument: "main.json",
        hiddenUpstream: false,
        codeName: accelCodeName,
        partType: "attack",
        stats: { attack: 30, defense: 10, stamina: 10, dash: 30, burst: 80 },
        collectionOrder: 1,
        modelName: "Edition SKU",
        releaseAt: "2024-03-02T15:00:00.000Z",
      },
      {
        id: "BT-EDITION-EARLY",
        groupId: "A",
        originDocument: "hardcoded.json",
        hiddenUpstream: false,
        codeName: accelCodeName,
        partType: "attack",
        stats: { attack: 30, defense: 10, stamina: 10, dash: 30, burst: 80 },
        collectionOrder: 10,
        modelName: "Earliest Edition",
        releaseAt: "2024-02-01T15:00:00.000Z",
      },
      {
        id: "BT-CANONICAL",
        groupId: "A",
        originDocument: "main.json",
        hiddenUpstream: false,
        codeName: accelCodeName,
        partType: "attack",
        stats: { attack: 20, defense: 20, stamina: 20, dash: 20, burst: 80 },
        collectionOrder: 2,
        modelName: "Canonical SKU",
        releaseAt: "2024-04-01T15:00:00.000Z",
      },
      {
        id: "BT-MODE",
        groupId: "A",
        originDocument: "main.json",
        hiddenUpstream: true,
        codeName: accelCodeName,
        partType: "attack",
        stats: { attack: 10, defense: 50, stamina: 10, dash: 10, burst: 30 },
        collectionOrder: 3,
        modelName: "Mode Change",
        releaseAt: "2024-05-01T15:00:00.000Z",
      },
      {
        id: "BT-MODE-2",
        groupId: "A",
        originDocument: "main.json",
        hiddenUpstream: true,
        codeName: accelCodeName,
        partType: "attack",
        stats: { attack: 10, defense: 10, stamina: 50, dash: 10, burst: 30 },
        collectionOrder: 4,
        modelName: "Mode Change 2",
        releaseAt: "2024-05-01T15:00:00.000Z",
      },
    ]);
    const report = auditPhstudyBitIdentityParity(rows, [
      bit({
        playstyle: "attack",
        stats: {
          attack: 20,
          defense: 20,
          stamina: 20,
          xDash: 20,
          burstResistance: 80,
        },
        modes: [
          {
            label: "WRONG 1",
            stats: {
              attack: 20,
              defense: 20,
              stamina: 20,
              xDash: 20,
              burstResistance: 80,
            },
          },
          {
            label: "WRONG 2",
            stats: {
              attack: 10,
              defense: 50,
              stamina: 10,
              xDash: 10,
              burstResistance: 30,
            },
          },
          {
            label: "WRONG 3",
            stats: {
              attack: 10,
              defense: 10,
              stamina: 50,
              xDash: 10,
              burstResistance: 30,
            },
          },
        ],
        statEditions: [],
      }),
    ]);

    expect(report.mismatches.filter((issue) =>
      issue.field === "modes" || issue.field === "statEditions"
    )).toEqual([
      {
        partId: "A",
        field: "modes",
        expected: [
          "Mode 1: A20/D20/S20/X20/B80",
          "Defense Mode: A10/D50/S10/X10/B30",
          "Stamina Mode: A10/D10/S50/X10/B30",
        ],
        actual: [
          "WRONG 1: A20/D20/S20/X20/B80",
          "WRONG 2: A10/D50/S10/X10/B30",
          "WRONG 3: A10/D10/S50/X10/B30",
        ],
      },
      {
        partId: "A",
        field: "statEditions",
        expected: ["Earliest Edition@2024-02-01: A30/D10/S10/X30/B80"],
        actual: [],
      },
    ]);
    expect(formatPhstudyBitIdentityParityReport(report)).toContain("`A` `modes`");
    expect(formatPhstudyBitIdentityParityReport(report)).not.toContain("BT-MODE");
    expect(presentPhstudyBitIdentityParity(report, "human").exitCode).toBe(1);
  });

  it("distinguishes document, metadata, image, and provenance drift", () => {
    const mainHash = "a".repeat(64);
    const rows = phstudyBitIdentityRowsSchema.parse([
      {
        id: "BT-A",
        groupId: "A",
        originDocument: "main.json",
        hiddenUpstream: false,
        codeName: accelCodeName,
        partType: "attack",
        stats: accelSourceStats,
        collectionOrder: 1,
        modelName: "Attack A",
        releaseAt: "2024-02-01T15:00:00.000Z",
        weight: { weight_g: 2.2 },
        image: {
          url: "/sources/phstudy/images/Bit/BT-A.png",
          originalUrl: "https://beyblade.phstudy.org/images/site/Bit/BT-A.png",
          sha256: "b".repeat(64),
        },
      },
    ]);
    const report = auditPhstudyBitIdentityParity(
      rows,
      [bit({
        playstyle: "attack",
        releaseAt: "2024-03-01",
        weightGrams: 1.1,
        provenance: [{
          sourceId: "phstudy-beyblade-x",
          sourceUrl: "https://wrong.example/",
          sourceVersion: `sha256:${"f".repeat(64)}`,
          authority: "community_source",
          rightsStatus: "unknown",
          fields: ["nameEn"],
        }],
      })],
      {
        manifest: {
          documents: [
            { path: "raw/main.json", url: "https://beyblade.phstudy.org/data/main.json", bytes: 1, sha256: mainHash },
            { path: "raw/hardcoded.json", url: "https://beyblade.phstudy.org/data/hardcoded.json", bytes: 1, sha256: "c".repeat(64) },
            { path: "raw/hasbro.json", url: "https://beyblade.phstudy.org/data/hasbro.json", bytes: 1, sha256: "d".repeat(64) },
            { path: "raw/part_colors.json", url: "https://beyblade.phstudy.org/data/part_colors.json", bytes: 1, sha256: "e".repeat(64) },
            { path: "raw/part_code_names.json", url: "https://beyblade.phstudy.org/data/part_code_names.json", bytes: 1, sha256: "1".repeat(64) },
          ],
          normalized: [{ path: "parts-bit.json", bytes: 1, sha256: "2".repeat(64) }],
        },
        images: {
          A: {
            url: "/parts/A.webp",
            originalUrl: "https://wrong.example/A.png",
            width: 1,
            height: 1,
            sourceId: "phstudy-beyblade-x",
            sourceUrl: "https://beyblade.phstudy.org/?category=Bit",
            sourceVersion: `sha256:${"9".repeat(64)}`,
            rightsStatus: "unknown",
            licenseUrl: null,
          },
        },
        curatedBaseline: {},
        sourceDocuments: {},
        sourceImages: {},
        publishedImages: {
          A: { sha256: "2".repeat(64), width: 512, height: 512 },
        },
      },
    );

    expect(new Set(report.mismatches.map((issue) => issue.field.split(".")[0]))).toEqual(
      new Set(["document", "metadata", "image", "provenance"]),
    );
    expect(report.mismatches).toContainEqual({
      partId: "A",
      field: "metadata.releaseAt",
      expected: "2024-02-01",
      actual: "2024-03-01",
    });
    expect(report.mismatches).toContainEqual({
      partId: "A",
      field: "metadata.weightGrams",
      expected: 2.2,
      actual: 1.1,
    });
  });

  it("preserves release absence and uses ranked positive weight fallback", () => {
    const rows = phstudyBitIdentityRowsSchema.parse([
      {
        id: "BT-MAIN",
        groupId: "A",
        originDocument: "main.json",
        hiddenUpstream: false,
        codeName: accelCodeName,
        partType: "attack",
        stats: accelSourceStats,
        collectionOrder: 1,
        modelName: "Attack A",
        releaseAt: "2022-01-01T15:00:00.000Z",
        weight: { weight_g: null },
        image: null,
      },
      {
        id: "BT-HASBRO",
        groupId: "A",
        originDocument: "hasbro.json",
        hiddenUpstream: false,
        codeName: accelCodeName,
        partType: "attack",
        stats: accelSourceStats,
        collectionOrder: 2,
        modelName: "Attack A 2",
        releaseAt: null,
        weight: { weight_g: 2.4 },
        image: null,
      },
    ]);
    const hash = "a".repeat(64);
    const documents = [
      "raw/main.json",
      "raw/hardcoded.json",
      "raw/hasbro.json",
      "raw/part_colors.json",
      "raw/part_weights.json",
      "raw/part_code_names.json",
    ].map((path) => ({
      path,
      url: `https://beyblade.phstudy.org/data/${path.slice(4)}`,
      bytes: 1,
      sha256: hash,
    }));
    const report = auditPhstudyBitIdentityParity(
      rows,
      [bit({ playstyle: "attack", releaseAt: "2024-01-01", weightGrams: 1.5 })],
      {
        manifest: {
          documents,
          normalized: [{ path: "parts-bit.json", bytes: 1, sha256: hash }],
        },
        images: {},
        curatedBaseline: { A: { releaseAt: "2024-01-01" } },
        sourceDocuments: Object.fromEntries(
          [...documents, { path: "parts-bit.json", sha256: hash }]
            .map(({ path, sha256 }) => [path, { bytes: 1, sha256 }]),
        ),
        sourceImages: {},
        publishedImages: {},
      },
    );

    expect(report.mismatches.filter((issue) => issue.field.startsWith("metadata."))).toEqual([
      {
        partId: "A",
        field: "metadata.weightGrams",
        expected: 2.4,
        actual: 1.5,
      },
    ]);

    const erased = auditPhstudyBitIdentityParity(
      rows,
      [bit({ playstyle: "attack", releaseAt: null, weightGrams: 2.4 })],
      {
        manifest: {
          documents,
          normalized: [{ path: "parts-bit.json", bytes: 1, sha256: hash }],
        },
        images: {},
        curatedBaseline: { A: { releaseAt: "2024-01-01" } },
        sourceDocuments: Object.fromEntries(
          [...documents, { path: "parts-bit.json", bytes: 1, sha256: hash }]
            .map(({ path, bytes, sha256 }) => [path, { bytes, sha256 }]),
        ),
        sourceImages: {},
        publishedImages: {},
      },
    );
    expect(erased.mismatches).toContainEqual({
      partId: "A",
      field: "metadata.releaseAt",
      expected: "2024-01-01",
      actual: null,
    });
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
          stats: accelSourceStats,
          collectionOrder: 1,
        },
      ],
      [bit({ nameEn: "Wrong Accel" })],
    );

    expect(formatPhstudyBitIdentityParityReport(report)).toBe([
      "Bit parity: FAIL",
      "1 source row, 1 non-empty group, 1 usable identity, 1 published Bit, 0 placeholders.",
      "Battle facts: Playstyle, five Stats, Modes, and Stat Editions checked.",
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
          stats: accelSourceStats,
          collectionOrder: 1,
        },
      ],
      [],
    );

    expect(presentPhstudyBitIdentityParity(report, "json")).toEqual({
      exitCode: 1,
      output: JSON.stringify(report, null, 2),
    });

    const summary = formatPhstudyBitIdentityParityReport({
      ...report,
      mismatches: [...report.mismatches, ...report.mismatches, ...report.mismatches],
    }, { maxMismatches: 2 });
    expect(summary).toContain("Mismatches (3)");
    expect(summary).toContain("1 more; run without `--summary` for the full report.");
  });
});
