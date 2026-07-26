import { describe, expect, it } from "vitest";
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
    releaseAt: "2022-05-10",
    stats: { attack: 60, defense: 30, stamina: 25 },
    playstyle: "attack",
    modes: [],
    statEditions: [],
    ...overrides,
  } as Part;
}

describe("refreshOfficialParts", () => {
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
