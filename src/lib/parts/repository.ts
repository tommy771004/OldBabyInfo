import partsJson from "../../../data/parts.json";
import { partsFileSchema, type Part } from "./schema.ts";

/**
 * Validated once at module load. Per ADR-0001, Part data ships as static
 * repo JSON and is baked in at build time — an invalid seed file fails the
 * build immediately here rather than surfacing as a runtime error.
 */
const parts: Part[] = partsFileSchema.parse(partsJson);

export function getAllParts(): Part[] {
  return parts;
}

export function getPartById(id: string): Part | undefined {
  return parts.find((p) => p.id === id);
}
