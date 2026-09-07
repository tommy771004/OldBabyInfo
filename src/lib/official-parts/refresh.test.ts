import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { partsFileSchema } from "@/lib/parts/schema.ts";
import type { Part } from "@/lib/parts/schema.ts";
import { refreshOfficialParts } from "./refresh.ts";

function blade(overrides: Partial<Part> = {}): Part {
  return {
    id: "DRANSWORD",
    type: "blade",
    nameEn: "Dran Sword",
    nameJa: "ドランソード",
    nameZhTw: "蒼龍神劍",
    aliases: [],
    moldBatches: [],
    generation: "X",
    releaseAt: "2023-07-15",
    stats: { attack: 60, defense: 30, stamina: 25 },
    playstyle: "attack",
    modes: [],
    statEditions: [],
    ...overrides,
  } as Part;
}

describe("refreshOfficialParts", () => {
  it("refuses replacement before loading when phstudy owns published fields", async () => {
    const previous = [blade({
      provenance: [{
        sourceId: "phstudy-beyblade-x",
        sourceUrl: "https://beyblade.phstudy.org/?category=Blade",
        sourceVersion: "sha256:fixture",
        authority: "community_source",
        rightsStatus: "unknown",
        fields: ["nameEn", "stats"],
      }],
    })];
    const load = vi.fn().mockResolvedValue({ sourceVersion: "beybrew@new", parts: [] });
    const before = JSON.stringify(previous);

    const result = await refreshOfficialParts(previous, load);

    expect(result.status).toBe("failed");
    if (result.status !== "failed") throw new Error("Expected a blocked refresh");
    expect(result.error).toContain("BeyBrew-only refresh blocked");
    expect(result.parts).toBe(previous);
    expect(JSON.stringify(previous)).toBe(before);
    expect(load).not.toHaveBeenCalled();
  });

  it("protects the committed migration without requiring ignored phstudy files", async () => {
    const previous = partsFileSchema.parse(JSON.parse(readFileSync("data/parts.json", "utf8")));
    const load = vi.fn();

    const result = await refreshOfficialParts(previous, load);

    expect(result.status).toBe("failed");
    expect(result.parts).toBe(previous);
    expect(load).not.toHaveBeenCalled();
  });

  it("reports deterministic added, changed, and removed official Parts", async () => {
    const previous = [blade(), blade({ id: "OLDPART", nameEn: "Old Part" })];
    const incoming = [
      blade({ stats: { attack: 65, defense: 30, stamina: 25 } }),
      blade({ id: "NEWPART", nameEn: "New Part" }),
    ];

    const result = await refreshOfficialParts(previous, async () => ({
      sourceVersion: "beybrew@abc123",
      parts: incoming,
    }));

    expect(result).toMatchObject({
      status: "updated",
      sourceVersion: "beybrew@abc123",
      diff: {
        added: ["NEWPART"],
        changed: ["DRANSWORD"],
        removed: ["OLDPART"],
      },
    });
    expect(result.parts.map((part) => part.id)).toEqual(["DRANSWORD", "NEWPART"]);
  });

  it("retains the last successful Parts and reports the error when loading fails", async () => {
    const previous = [blade()];

    const result = await refreshOfficialParts(previous, async () => {
      throw new Error("BeyBrew unavailable");
    });

    expect(result).toEqual({
      status: "failed",
      parts: previous,
      error: "BeyBrew unavailable",
    });
  });

  it("keeps the published payload to structured Part facts in stable id order", async () => {
    const incoming = [
      { ...blade({ id: "NEWPART", nameEn: "New Part" }), fullText: "not licensed" },
      { ...blade(), sourceCode: "not licensed" },
    ] as unknown as Part[];

    const result = await refreshOfficialParts([], async () => ({
      sourceVersion: "beybrew@abc123",
      parts: incoming,
    }));

    expect(result.status).toBe("updated");
    if (result.status !== "updated") throw new Error("Expected an updated result");
    expect(result.parts.map((part) => part.id)).toEqual(["DRANSWORD", "NEWPART"]);
    expect(result.parts[0]).not.toHaveProperty("sourceCode");
    expect(result.parts[1]).not.toHaveProperty("fullText");
  });
});
