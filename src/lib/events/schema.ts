import { z } from "zod";

/** GP/G1/G2/G3 — regional/competitive weight, unrelated to Combo strength.
 *  See CONTEXT.md's Event Tier definition. */
export const eventTierSchema = z.enum(["GP", "G1", "G2", "G3"]);

/**
 * Age eligibility bracket for a specific scheduled session — a different
 * axis from Event Tier. Two sessions at the same G3 venue on the same day
 * can have different age categories; this is not a competitive weight.
 */
const resultsSchema = z.object({
  topFour: z.array(z.string().min(1)).min(1),
  sourceExcerpt: z.string().min(1),
});

export const eventSchema = z.object({
  id: z.string().min(1),
  tier: eventTierSchema,
  venueName: z.string().min(1),
  venueAddress: z.string().min(1),
  date: z.iso.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  capacity: z.int().positive(),
  registrationMethod: z.enum(["onsite", "online", "phone", "either", "store_community"]),
  ageCategory: z.string().min(1),
  sourceUrl: z.url(),
  /** Null for almost every event — see ticket 03's spike: the community
   *  records full results for essentially none of its scheduled events.
   *  This is expected, not a gap in the seed data. */
  results: resultsSchema.nullable(),
});

export type Event = z.infer<typeof eventSchema>;

export const eventsFileSchema = z.array(eventSchema).check((ctx) => {
  const seen = new Set<string>();
  for (const event of ctx.value) {
    if (seen.has(event.id)) {
      ctx.issues.push({
        code: "custom",
        message: `Duplicate event id: ${event.id}`,
        input: ctx.value,
      });
      return;
    }
    seen.add(event.id);
  }
});
