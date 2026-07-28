import { z } from "zod";
import partsJson from "../../../data/parts.json" with { type: "json" };
import partImagesJson from "../../../data/part-images.json" with { type: "json" };
import { partsFileSchema, type Part } from "./schema.ts";
import { slugify } from "./slug.ts";

/**
 * Validated once at module load. Per ADR-0001, Part data ships as static
 * repo JSON and is baked in at build time — an invalid seed file fails the
 * build immediately here rather than surfacing as a runtime error.
 */
const parts: Part[] = partsFileSchema.parse(partsJson);

const partImageSchema = z.object({
  /** A path under `public/`, not a URL: the restored photos are served from
   *  this repository rather than hotlinked. */
  url: z.string().regex(/^\/[\w./-]+$/, "Part image must be a local path under public/"),
  /** Each photo's own real pixel size (ticket 16) — not all square (e.g.
   *  358×339) — so <Image> can size without stretching either axis. */
  width: z.number().positive(),
  height: z.number().positive(),
});

/** Product photos, keyed by Part id. Not every Part needs a photo. */
const partImages: Record<string, z.infer<typeof partImageSchema>> = z
  .record(z.string(), partImageSchema)
  .parse(partImagesJson);

export function getAllParts(): Part[] {
  return parts;
}

export function getPartById(id: string): Part | undefined {
  return parts.find((p) => p.id === id);
}

export function getPartBySlug(slug: string): Part | undefined {
  return parts.find((p) => slugify(p.nameEn) === slug);
}

export function getPartImage(
  id: string,
): { url: string; width: number; height: number } | undefined {
  return partImages[id];
}
