import { describe, expect, it } from "vitest";
import {
  buildReleaseRecords,
  matchFunboxRelease,
} from "./releases.ts";

const source = {
  sourceId: "takaratomy-fixture",
  sourceUrl: "https://example.com/releases",
  sourceVersion: "revision:1",
  generationId: "x" as const,
  system: "bx",
};

describe("release and retailer adapters", () => {
  it("builds single-Beyblade, multi-item, and equipment-only Releases", () => {
    const records = buildReleaseRecords({
      ...source,
      products: [
        {
          sourceRecordId: "BX-01-JP",
          sku: "BX-01",
          name: "Dran Sword Starter",
          region: "JP",
          mechanicalRecordId: "x:beyblade:dran-sword",
          componentRecordIds: ["x:part:blade:dran-sword"],
        },
        {
          sourceRecordId: "BX-SET-JP",
          sku: "BX-SET",
          name: "Dran Sword Starter Set",
          region: "JP",
          componentRecordIds: ["x:beyblade:dran-sword", "x:equipment:launcher"],
        },
        {
          sourceRecordId: "LAUNCHER-JP",
          sku: "BX-LAUNCHER",
          name: "String Launcher",
          region: "JP",
          equipment: [{ sourceRecordId: "string-launcher", name: "String Launcher" }],
        },
      ],
    });

    expect(records.filter((record) => record.kind === "release")).toHaveLength(3);
    expect(records.filter((record) => record.kind === "equipment")).toMatchObject([{
      name: "String Launcher",
      comboEligible: false,
    }]);
    expect(records.find((record) => record.sourceRecordId === "release:BX-SET-JP")).toMatchObject({
      kind: "release",
      releaseOf: null,
      containsRecordIds: ["x:beyblade:dran-sword", "x:equipment:launcher"],
      sku: "BX-SET",
      region: "JP",
    });
  });

  it("only attaches a Funbox row when exactly one Release matches", () => {
    const releases = buildReleaseRecords({
      ...source,
      products: [
        {
          sourceRecordId: "BX-01-JP",
          sku: "BX-01",
          name: "Dran Sword Starter",
          region: "JP",
        },
        {
          sourceRecordId: "BX-01-TW",
          sku: "BX-01-TW",
          name: "Dran Sword Starter",
          region: "TW",
        },
      ],
    }).filter((record) => record.kind === "release");

    expect(matchFunboxRelease({
      sourceRecordId: "funbox:dran-sword",
      productName: "BX-01",
      productUrl: "https://shop.funbox.com.tw/products/bx-01",
    }, [releases[0]!])).toMatchObject({
      status: "matched",
      releaseId: releases[0]!.id,
    });
    expect(matchFunboxRelease({
      sourceRecordId: "funbox:ambiguous",
      productName: "Dran Sword Starter",
      productUrl: "https://shop.funbox.com.tw/products/ambiguous",
    }, releases)).toMatchObject({ status: "needs_review" });
    expect(matchFunboxRelease({
      sourceRecordId: "funbox:unknown",
      productName: "Unknown product",
      productUrl: "https://shop.funbox.com.tw/products/unknown",
    }, releases)).toMatchObject({ status: "needs_review" });
  });
});
