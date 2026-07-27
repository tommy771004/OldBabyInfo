import { describe, expect, it } from "vitest";
import {
  buildBeybrewXRecords,
  parseBeywikiPartsList,
  parseBurstOfficialProducts,
  parseFandomCategory,
  parseFandomPartsPage,
} from "./parsers.ts";

describe("generation catalog source parsers", () => {
  it("extracts licensed Fandom part links without copying prose or images", () => {
    const records = parseFandomPartsPage({
      title: "List of Metal System parts",
      generationId: "metal_fight",
      system: "metal_system",
      sourceVersion: "revision:1",
      wikitext: `
==Wheels==
|[[File:Wheel.png]]
|[[Wheel - Pegasis|Pegasis]]
==Tracks==
|[[Track - 105|105]]
`,
    });

    expect(records.map((record) => [record.partType, record.name])).toEqual([
      ["wheel", "Pegasis"],
      ["track", "105"],
    ]);
    expect(records.every((record) => record.publicationStatus === "accepted")).toBe(true);
  });

  it("extracts original and HMS category titles into explicit part types", () => {
    const records = parseFandomCategory({
      category: "Plastic Parts",
      generationId: "bakuten_shoot",
      system: "plastic",
      titles: ["Attack Ring - Cross Dragon", "Blade Base", "Weight Disk - Wide"],
      sourceVersion: "category:2026-07-26",
    });

    expect(records.map((record) => [record.partType, record.name])).toEqual([
      ["attack_ring", "Cross Dragon"],
      ["weight_disk", "Wide"],
    ]);
  });

  it("keeps Beywiki stock combos in Needs Review when source rights are unknown", () => {
    const records = parseBeywikiPartsList(`
=='''[[Plastic Beyblade | PLASTICS]]'''==
===[[4-Layer Series | 4-LAYER SERIES]]===
''[[Ultimate Dragoon]]''<br>
AR: Cross Dragon<br>
WD: Wide<br>
BB: Flat Base<br><br>
`, "revision:2");

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      generationId: "bakuten_shoot",
      system: "4-LAYER SERIES",
      kind: "beyblade",
      publicationStatus: "needs_review",
      components: [
        { partType: "ar", name: "Cross Dragon" },
        { partType: "wd", name: "Wide" },
        { partType: "bb", name: "Flat Base" },
      ],
    });
  });

  it("extracts official Burst products and their labelled components", () => {
    const html = `
<div id="b200" class="productBox">
  <h3 class="productTtl">B-200 スターター ジフォイドエクスカリバー.Xn.Sw’-1</h3>
  <p>【セット内容】ベイブレード［ダイナマイトバトルコア：<a href="parts.html?id=1">エクスカリバー</a>、
  BUブレード：<a href="parts.html?id=2">ジフォイド</a>］</p>
</div></section>`;
    const records = parseBurstOfficialProducts(html, "etag:abc");

    expect(records).toHaveLength(4);
    expect(records.find((record) => record.kind === "beyblade")).toMatchObject({
      generationId: "burst",
      name: "B-200 スターター ジフォイドエクスカリバー.Xn.Sw’-1",
      components: [
        { partType: "ダイナマイトバトルコア", name: "エクスカリバー" },
        { partType: "buブレード", name: "ジフォイド" },
      ],
    });
    expect(records.filter((record) => record.kind === "part").map((record) => [
      record.partType,
      record.name,
    ])).toEqual([
      ["ダイナマイトバトルコア", "エクスカリバー"],
      ["buブレード", "ジフォイド"],
    ]);
    expect(records.find((record) => record.kind === "release")).toMatchObject({
      releaseOf: expect.stringContaining("takaratomy-burst-products"),
      region: "JP",
      comboEligible: false,
    });
  });

  it("classifies early Burst product IDs into their Layer systems", () => {
    const html = `
<div id="b001" class="productBox">
  <h3 class="productTtl">B-01 スターター ペガシス</h3>
  <p>【セット内容】ベイブレード［レイヤー：<a href="parts.html?id=1">ペガシス</a>］</p>
</div>
<div id="b104" class="productBox">
  <h3 class="productTtl">B-104 スターター ゼットアキレス</h3>
  <p>【セット内容】ベイブレード［レイヤー：<a href="parts.html?id=2">ゼットアキレス</a>］</p>
</div></section>`;

    const records = parseBurstOfficialProducts(html, "etag:layers");
    expect(records.filter((record) => record.kind === "beyblade").map((record) => record.system)).toEqual([
      "single_layer",
      "cho_z",
    ]);
  });

  it("preserves a later multi-Part Layer composition as independent Parts", () => {
    const html = `
<div id="b200" class="productBox">
  <h3 class="productTtl">B-200 スターター ジフォイドエクスカリバー.Xn.Sw’-1</h3>
  <p>【セット内容】ベイブレード［ダイナマイトバトルコア：<a href="parts.html?id=1">エクスカリバー</a>、
  BUブレード：<a href="parts.html?id=2">ジフォイド</a>、アーマー：<a href="parts.html?id=3">1</a>］</p>
</div></section>`;

    const records = parseBurstOfficialProducts(html, "etag:multi");
    expect(records.filter((record) => record.kind === "beyblade")[0]).toMatchObject({
      system: "burst_ultimate",
      components: [
        { partType: "ダイナマイトバトルコア", name: "エクスカリバー" },
        { partType: "buブレード", name: "ジフォイド" },
        { partType: "アーマー", name: "1" },
      ],
    });
    expect(records.filter((record) => record.kind === "part")).toHaveLength(3);
  });

  it("builds X parts plus complete Beyblade compositions from BeyBrew", () => {
    const records = buildBeybrewXRecords(
      {
        blades: [{ name: "Dran Sword" }],
        bits: [{ name: "Flat", alias: "F" }],
      },
      {
        data: {
          BeybladeSeries: [{
            model_name: "BX01_DranSword3-60F",
            name: { "en-US": "BX-01 DRANSWORD3-60F" },
          }],
          BeybladePartsBlade: [{
            model_name: "BX01_DranSword3-60F",
            name: { "en-US": "<b>BX-01</b> DRANSWORD" },
          }],
          BeybladePartsBit: [{
            model_name: "BX01_DranSword3-60F",
            name: { "en-US": "<b>BX-01</b> F" },
          }],
          BeybladePartsMainBlade: [{
            group_id: "SWORD",
            model_name: "CX01_DranSword3-60F",
            name: { "en-US": "<b>CX-01</b> SWORD" },
          }],
        },
      },
      "commit:abc",
    );

    expect(records.filter((record) => record.kind === "part")).toHaveLength(3);
    expect(records.find((record) => record.partType === "main_blade")).toMatchObject({
      system: "cx",
      name: "SWORD",
    });
    expect(records.find((record) => record.kind === "beyblade")).toMatchObject({
      generationId: "x",
      system: "bx",
      components: [
        { partType: "blade", name: "DRANSWORD" },
        { partType: "bit", name: "F" },
      ],
    });
  });

  it("never lets an unfilled MasterData name outrank the real one", () => {
    const records = buildBeybrewXRecords(
      { blades: [{ name: "Dran Sword" }] },
      {
        data: {
          BeybladeSeries: [
            { model_name: "BX01_DranSword3-60F", name: { "en-US": "BX-01 DRANSWORD3-60F" } },
            // A product whose own name never got filled in: no record, rather
            // than one called "■".
            { model_name: "BXC03_DranSword", name: { "en-US": "■" } },
          ],
          BeybladePartsBlade: [
            {
              group_id: "DRANSWORD",
              model_name: "BX01_DranSword3-60F",
              name: { "en-US": "<b>BX-01</b> DRANSWORD" },
            },
            // Shorter than every real name, and the reason the placeholder
            // used to win and escape deduplication.
            { group_id: "DRANSWORD", model_name: "BXC03_DranSword", name: { "en-US": "■" } },
          ],
        },
      },
      "commit:abc",
    );

    expect(records.every((record) => !record.name.includes("■"))).toBe(true);
    expect(records.every((record) =>
      record.components.every((component) => !component.name.includes("■")),
    )).toBe(true);
    // The MasterData blade resolves to "DRANSWORD", which is the beyparts
    // "Dran Sword" — one Part, one record.
    expect(records.filter((record) => record.partType === "blade")).toHaveLength(1);
    expect(records.find((record) => record.partType === "blade")).toMatchObject({
      name: "Dran Sword",
      sourceRecordId: "blades:Dran Sword",
    });
  });
});
