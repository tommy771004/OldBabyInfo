import { describe, expect, it } from "vitest";
import { buildCatalogRelations } from "./relations.ts";
import { getAllPublishableGenerationCatalogRecords } from "./repository.ts";
import type { GenerationCatalogRecord } from "./schema.ts";

/** The per-row scan `/parts` used before the index — the reference answer. */
function scanBeybladesUsing(records: GenerationCatalogRecord[], record: GenerationCatalogRecord) {
  return records.filter((candidate) => candidate.kind === "beyblade" && candidate.components.some((component) =>
    component.recordId === record.id ||
    (component.partType === record.partType && component.name === record.name),
  ));
}

function scanReleaseRelated(records: GenerationCatalogRecord[], record: GenerationCatalogRecord) {
  return [
    ...(record.releaseOf ? records.filter((candidate) => candidate.id === record.releaseOf) : []),
    ...(record.containsRecordIds ?? []).flatMap((id) => records.filter((candidate) => candidate.id === id)),
  ];
}

describe("buildCatalogRelations", () => {
  const records = getAllPublishableGenerationCatalogRecords();
  const relations = buildCatalogRelations(records);

  it("answers every Part exactly as the full scan does, in the same order", () => {
    const parts = records.filter((record) => record.kind === "part");
    expect(parts.length).toBeGreaterThan(100);
    for (const part of parts) {
      expect(relations.beybladesUsing(part).map((r) => r.id)).toEqual(scanBeybladesUsing(records, part).map((r) => r.id));
    }
  });

  it("answers every Release exactly as the full scan does", () => {
    const releases = records.filter((record) => record.kind === "release");
    expect(releases.length).toBeGreaterThan(100);
    for (const release of releases) {
      expect(relations.releaseRelated(release).map((r) => r.id)).toEqual(scanReleaseRelated(records, release).map((r) => r.id));
    }
  });

  it("finds a Beyblade through a component matched by id and by kind+name only once", () => {
    const part = { id: "p1", kind: "part", partType: "blade", name: "Dran Sword" } as GenerationCatalogRecord;
    const beyblade = {
      id: "b1",
      kind: "beyblade",
      partType: null,
      name: "DranSword3-60F",
      components: [{ recordId: "p1", partType: "blade", name: "Dran Sword" }],
    } as GenerationCatalogRecord;
    expect(buildCatalogRelations([part, beyblade]).beybladesUsing(part)).toEqual([beyblade]);
  });
});
