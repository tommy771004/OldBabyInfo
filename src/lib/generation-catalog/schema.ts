import { z } from "zod";

export const generationIdSchema = z.enum([
  "bakuten_shoot",
  "metal_fight",
  "burst",
  "x",
]);

export const generationSourceSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  publisher: z.string().min(1),
  canonicalUrl: z.url(),
  authority: z.enum([
    "first_party",
    "official_app_derived",
    "community_wiki",
    "community_source",
    "retailer",
    "reference",
  ]),
  sourceKind: z.enum([
    "official_history",
    "official_product",
    "official_manual",
    "official_app_derived",
    "community_wiki",
    "community_source",
    "retailer",
    "reference",
  ]),
  sourceRegion: z.string().min(1),
  licenseName: z.string().min(1).nullable(),
  licenseUrl: z.url().nullable(),
  rightsStatus: z.enum(["structured_facts_only", "licensed", "unknown"]),
  generationIds: z.array(generationIdSchema).min(1),
  sourceVersion: z.string().min(1),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
});

export const generationDefinitionSchema = z.strictObject({
  id: generationIdSchema,
  nameEn: z.string().min(1),
  nameJa: z.string().min(1),
  ordinal: z.number().int().positive(),
  launchedYear: z.number().int().min(1999),
  evidenceSourceId: z.string().min(1),
});

export const catalogComponentSchema = z.strictObject({
  recordId: z.string().min(1).optional(),
  partType: z.string().min(1),
  name: z.string().min(1),
});

export const generationSystemSchema = z.strictObject({
  id: z.string().min(1),
  generationId: generationIdSchema,
  nameEn: z.string().min(1),
  partTypes: z.array(z.string().min(1)).min(1),
  compatibilityRules: z.array(z.string().min(1)).min(1),
});

export const generationCatalogRecordSchema = z.strictObject({
  id: z.string().min(1),
  generationId: generationIdSchema,
  system: z.string().min(1),
  kind: z.enum(["beyblade", "part", "release", "equipment"]),
  partType: z.string().min(1).nullable(),
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)),
  components: z.array(catalogComponentSchema),
  sourceId: z.string().min(1),
  sourceRecordId: z.string().min(1),
  sourceUrl: z.url(),
  sourceVersion: z.string().min(1),
  verificationStatus: z.enum([
    "officially_verified",
    "official_app_derived",
    "community_sourced",
    "needs_review",
  ]),
  publicationStatus: z.enum(["accepted", "needs_review"]),
  releaseOf: z.string().min(1).nullable().optional(),
  containsRecordIds: z.array(z.string().min(1)).optional(),
  sku: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  colorway: z.string().min(1).optional(),
  reissueOf: z.string().min(1).optional(),
  comboEligible: z.boolean().optional(),
  /** Every conflicting source variant is retained in Needs Review rather than
   * silently discarded. This id is only used inside that review snapshot. */
  conflictOf: z.string().min(1).optional(),
});

export const generationCatalogSnapshotSchema = z.strictObject({
  schemaVersion: z.literal(1),
  capturedAt: z.iso.datetime(),
  sources: z.array(generationSourceSchema),
  generations: z.array(generationDefinitionSchema).length(4),
  systems: z.array(generationSystemSchema).default([]),
  records: z.array(generationCatalogRecordSchema),
}).check((ctx) => {
  const sourceIds = new Set(ctx.value.sources.map((source) => source.id));
  const sourcesById = new Map(ctx.value.sources.map((source) => [source.id, source]));
  const generationIds = new Set(ctx.value.generations.map((generation) => generation.id));
  const systemIds = new Set<string>();
  const systemsById = new Map<string, z.infer<typeof generationSystemSchema>>();
  const recordIds = new Set<string>();
  const beybladeCompositions = new Set<string>();
  const recordsById = new Map(ctx.value.records.map((record) => [record.id, record]));
  for (const system of ctx.value.systems) {
    if (systemIds.has(system.id)) {
      ctx.issues.push({
        code: "custom",
        message: `Duplicate generation system id: ${system.id}`,
        input: system,
      });
    }
    systemIds.add(system.id);
    systemsById.set(system.id, system);
    if (!generationIds.has(system.generationId)) {
      ctx.issues.push({
        code: "custom",
        message: `Unknown system generation: ${system.generationId}`,
        input: system,
      });
    }
  }
  for (const generation of ctx.value.generations) {
    if (!sourceIds.has(generation.evidenceSourceId)) {
      ctx.issues.push({
        code: "custom",
        message: `Unknown generation evidence source: ${generation.evidenceSourceId}`,
        input: generation,
      });
    }
  }
  for (const record of ctx.value.records) {
    if (!sourceIds.has(record.sourceId)) {
      ctx.issues.push({
        code: "custom",
        message: `Unknown record source: ${record.sourceId}`,
        input: record,
      });
    }
    if (recordIds.has(record.id)) {
      ctx.issues.push({
        code: "custom",
        message: `Duplicate generation catalog record id: ${record.id}`,
        input: record,
      });
    }
    recordIds.add(record.id);
    if (!generationIds.has(record.generationId)) {
      ctx.issues.push({
        code: "custom",
        message: `Unknown record generation: ${record.generationId}`,
        input: record,
      });
    }
    if (
      record.publicationStatus === "accepted" &&
      ctx.value.systems.length > 0 &&
      !systemIds.has(record.system)
    ) {
      ctx.issues.push({
        code: "custom",
        message: `Unknown record system: ${record.system}`,
        input: record,
      });
    }
    const recordSource = sourcesById.get(record.sourceId);
    if (recordSource && !recordSource.generationIds.includes(record.generationId)) {
      ctx.issues.push({
        code: "custom",
        message: `Source ${record.sourceId} does not cover generation ${record.generationId}`,
        input: record,
      });
    }
    const system = ctx.value.systems.find((candidate) => candidate.id === record.system);
    if (system && system.generationId !== record.generationId) {
      ctx.issues.push({
        code: "custom",
        message: `Record ${record.id} system ${record.system} belongs to ${system.generationId}, not ${record.generationId}`,
        input: record,
      });
    }
    if (record.kind === "part" && record.partType === null) {
      ctx.issues.push({
        code: "custom",
        message: `Part record ${record.id} must have partType`,
        input: record,
      });
    }
    if (
      record.publicationStatus === "accepted" &&
      record.kind === "part" &&
      record.partType !== null
    ) {
      const declaredSystem = systemsById.get(record.system);
      if (declaredSystem && !declaredSystem.partTypes.includes(record.partType)) {
        ctx.issues.push({
          code: "custom",
          message: `Part ${record.id} kind ${record.partType} is not declared by System ${record.system}`,
          input: record,
        });
      }
    }
    if (record.kind !== "part" && record.partType !== null) {
      ctx.issues.push({
        code: "custom",
        message: `${record.kind} record ${record.id} cannot have partType`,
        input: record,
      });
    }
    if ((record.kind === "release" || record.kind === "equipment") && record.comboEligible === true) {
      ctx.issues.push({
        code: "custom",
        message: `${record.kind} record ${record.id} cannot enter a Combo`,
        input: record,
      });
    }
    if (record.publicationStatus === "accepted" && record.kind === "beyblade") {
      const composition = [
        record.generationId,
        ...record.components.map((component) => component.recordId ?? component.name).sort(),
      ].join("|");
      if (beybladeCompositions.has(composition)) {
        ctx.issues.push({
          code: "custom",
          message: `Duplicate mechanical Beyblade composition: ${record.id}`,
          input: record,
        });
      }
      beybladeCompositions.add(composition);
    }
    if (record.kind === "release" && record.releaseOf) {
      const target = recordsById.get(record.releaseOf);
      if (!target) {
        ctx.issues.push({
          code: "custom",
          message: `Unknown record relationship: ${record.id} releaseOf ${record.releaseOf}`,
          input: record,
        });
      } else if (target.kind !== "beyblade") {
        ctx.issues.push({
          code: "custom",
          message: `Invalid release relationship: ${record.id} must reference a Beyblade`,
          input: record,
        });
      } else if (target.generationId !== record.generationId) {
        ctx.issues.push({
          code: "custom",
          message: `Cross-generation release relationship: ${record.id} cannot reference ${record.releaseOf}`,
          input: record,
        });
      }
      if (record.containsRecordIds?.includes(record.releaseOf)) {
        ctx.issues.push({
          code: "custom",
          message: `Release ${record.id} must not repeat releaseOf in containsRecordIds`,
          input: record,
        });
      }
    }
    if (
      record.containsRecordIds &&
      new Set(record.containsRecordIds).size !== record.containsRecordIds.length
    ) {
      ctx.issues.push({
        code: "custom",
        message: `Record ${record.id} contains duplicate relationships`,
        input: record,
      });
    }
    for (const component of record.components) {
      if (
        record.publicationStatus === "accepted" &&
        record.kind === "beyblade" &&
        !component.recordId
      ) {
        ctx.issues.push({
          code: "custom",
          message: `Accepted Beyblade ${record.id} component ${component.name} must reference a Part`,
          input: record,
        });
        continue;
      }
      if (!component.recordId) continue;
      const target = recordsById.get(component.recordId);
      if (!target) {
        ctx.issues.push({
          code: "custom",
          message: `Unknown record relationship: ${record.id} component ${component.recordId}`,
          input: record,
        });
      } else if (target.kind !== "part") {
        ctx.issues.push({
          code: "custom",
          message: `Invalid component relationship: ${record.id} must reference a Part`,
          input: record,
        });
      } else if (target.generationId !== record.generationId) {
        ctx.issues.push({
          code: "custom",
          message: `Cross-generation component relationship: ${record.id} cannot reference ${component.recordId}`,
          input: record,
        });
      }
    }
    for (const containedRecordId of record.containsRecordIds ?? []) {
      if (!recordsById.has(containedRecordId)) {
        ctx.issues.push({
          code: "custom",
          message: `Unknown record relationship: ${record.id} contains ${containedRecordId}`,
          input: record,
        });
      }
    }
  }
});

export type GenerationId = z.infer<typeof generationIdSchema>;
export type GenerationSource = z.infer<typeof generationSourceSchema>;
export type GenerationDefinition = z.infer<typeof generationDefinitionSchema>;
export type GenerationSystem = z.infer<typeof generationSystemSchema>;
export type GenerationCatalogRecord = z.infer<typeof generationCatalogRecordSchema>;
export type GenerationCatalogSnapshot = z.infer<typeof generationCatalogSnapshotSchema>;
