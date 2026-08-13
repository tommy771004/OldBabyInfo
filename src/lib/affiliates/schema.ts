/**
 * The shape of one row of the shared `affiliates` table, as this site reads
 * it. The table itself is not ours: it lives in the database behind
 * `SUP_DATABASE_URL` and is written by other systems, so every row arriving
 * here is untrusted input from a partner deployment — a contract, not a
 * local model. See the cross-system spec in the TW_veggieprice repo,
 * `docs/affiliate-integration-spec.md`.
 *
 * We read a subset on purpose. `categories`, `crops` and the `{crop}`
 * templating exist for a produce-price site with per-crop pages; OldBabyInfo
 * has no crop context anywhere, so those columns are neither selected nor
 * modelled here.
 *
 * A malformed row is skipped rather than thrown on (spec §6.4: "忽略該筆，
 * 回傳其他合法資料") — one bad write by any maintenance system must not empty
 * the slot for every other partner.
 */
import { z } from "zod";
import { isSafeExternalUrl } from "@/lib/security/external-url.ts";

/** Placeholders from the produce-site templating. This placement fills none
 * of them in, so a row still carrying one would render `{crop}` literally to
 * a reader. Such a row is dropped rather than shown broken. */
const CROP_PLACEHOLDER = /\{crop\}/;

const nonEmpty = z.string().trim().min(1);

export const affiliateOfferSchema = z.object({
  projectName: nonEmpty,
  id: nonEmpty,
  sponsored: z.boolean(),
  title: nonEmpty.refine((value) => !CROP_PLACEHOLDER.test(value)),
  url: nonEmpty.refine(isSafeExternalUrl).refine((value) => !CROP_PLACEHOLDER.test(value)),
  partner: z
    .string()
    .trim()
    .min(1)
    .refine((value) => !CROP_PLACEHOLDER.test(value))
    .nullish()
    .transform((value) => value ?? null),
  priority: z.number().int(),
});

export type AffiliateOffer = z.infer<typeof affiliateOfferSchema>;

/**
 * Parses rows one at a time so a single bad row costs only itself. The
 * rejection is logged: a slot that quietly drops a paying partner's row
 * forever is its own kind of bug, and nothing else here would notice.
 */
export function parseOffers(rows: readonly unknown[]): AffiliateOffer[] {
  const offers: AffiliateOffer[] = [];
  for (const row of rows) {
    const parsed = affiliateOfferSchema.safeParse(row);
    if (parsed.success) {
      offers.push(parsed.data);
      continue;
    }
    console.error("[affiliates] skipping malformed row:", parsed.error.issues);
  }
  return offers;
}

/**
 * What the reader shows for a row. Spec §4.3: the homepage placement is
 * keyed on the partner's name, falling back to the offer title when no
 * partner is recorded.
 */
export function offerLabel(offer: AffiliateOffer): string {
  return offer.partner ?? offer.title;
}
