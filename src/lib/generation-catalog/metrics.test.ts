import { describe, expect, it } from "vitest";
import { getAllGenerationCatalogRecords } from "./repository.ts";
import { getCatalogPayloadBudget } from "./payload.ts";
import { measureGenerationCatalogSize } from "./metrics.ts";

describe("generation catalog size metrics", () => {
  it("reports accepted records by Generation and entity kind", () => {
    const report = measureGenerationCatalogSize(getAllGenerationCatalogRecords());

    expect(Object.keys(report.byGeneration).sort()).toEqual([
      "bakuten_shoot",
      "burst",
      "metal_fight",
      "x",
    ]);
    expect(report.byGeneration.burst.byKind.release).toBeGreaterThan(100);
    expect(report.byGeneration.x.byKind.part).toBeGreaterThan(0);
    expect(Object.values(report.byGeneration).every((bucket) =>
      bucket.serializedBytes <= getCatalogPayloadBudget(),
    )).toBe(true);
  });
});
