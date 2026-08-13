/**
 * What the promotion slot is allowed to record, and nothing else.
 *
 * The endpoint behind this is unauthenticated and reachable by anyone, so
 * the shape here is the whole boundary: two known actions, a bounded target,
 * and a metadata object narrowed to the four fields the spec's §7.1 names.
 * Zod strips unknown keys rather than rejecting them, which is the point —
 * a caller cannot widen the row by sending more.
 *
 * Nothing identifies a person. No user id, no IP, no user agent, no session.
 * Adding one later is a decision with a disclosure attached, not a field.
 */
import { z } from "zod";

export const AFFILIATE_ACTIONS = ["affiliate_impression", "affiliate_click"] as const;
export type AffiliateAction = (typeof AFFILIATE_ACTIONS)[number];

/** Where the slot was rendered. One value today; kept as data because §7.1
 * requires clicks to be separable by placement once there is more than one. */
export const HOME_FOOTER_PLACEMENT = "home-footer";

export const affiliateEventSchema = z.object({
  action: z.enum(AFFILIATE_ACTIONS),
  // `affiliates.id` is short by convention ("kkday-farm"); the cap is here so
  // a forged caller cannot write megabytes into the log one row at a time.
  target: z.string().trim().min(1).max(200),
  metadata: z.object({
    project_name: z.string().trim().min(1).max(120),
    sponsored: z.boolean(),
    partner: z
      .string()
      .trim()
      .max(200)
      .nullish()
      .transform((value) => value ?? null),
    placement: z.string().trim().min(1).max(60),
  }),
});

export type AffiliateEvent = z.infer<typeof affiliateEventSchema>;

export interface ParsedEvent {
  ok: boolean;
  event?: AffiliateEvent;
}

/** Parses an untrusted request body. Returns `ok: false` rather than throwing
 * so the route stays a thin wire between HTTP and the log. */
export function parseAffiliateEvent(body: unknown): ParsedEvent {
  const parsed = affiliateEventSchema.safeParse(body);
  return parsed.success ? { ok: true, event: parsed.data } : { ok: false };
}
