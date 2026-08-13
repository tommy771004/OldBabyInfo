"use client";

/**
 * The promotion slot, and the only part of the homepage that needs to run in
 * the browser — because the two things the spec requires counting, an
 * impression and a click, are both browser events.
 *
 * Impression means *seen*, not *served*: an offer below the fold that the
 * reader never scrolls to has not been shown, and counting it would inflate
 * the denominator of every CTR the log can produce. So it is an
 * IntersectionObserver, fired once per offer per pageview and then detached.
 *
 * Clicks go out through `sendBeacon`, which survives the navigation that the
 * click itself starts. A plain fetch here is the classic way to lose exactly
 * the events that matter most — the ones where the reader left.
 *
 * The row is rendered `MARQUEE_COPIES` times so the page can scroll it
 * horizontally without a seam. Only the first copy is real: the repeats are
 * `aria-hidden` and unreachable by keyboard, so a screen reader and the Tab
 * order both see each offer exactly once. They keep `data-offer-id` on
 * purpose — `seenRef` already dedupes by offer, so observing every copy only
 * means the impression fires at whichever copy reaches the reader first.
 * Whether the row actually moves is the page's decision, in CSS; this
 * component renders the same markup either way.
 */

import { useEffect, useRef } from "react";
import { DiagonalArrow } from "./diagonal-arrow.tsx";
import { offerLabel, type AffiliateOffer } from "@/lib/affiliates/schema.ts";
import {
  HOME_PROMOS_PLACEMENT,
  type AffiliateAction,
  type AffiliateEvent,
} from "@/lib/audit/affiliate-event.ts";
import { safeExternalUrl } from "@/lib/security/external-url.ts";

const TRACK_URL = "/api/affiliates/track";

/* How many times the row is repeated end to end so the marquee can loop
   without a visible gap. Three is what makes a two-offer set still fill a
   wide viewport; the CSS moves the track by exactly -100/COPIES % , so the
   frame after the loop point is identical to the frame before it. */
const MARQUEE_COPIES = 3;

function eventFor(offer: AffiliateOffer, action: AffiliateAction): AffiliateEvent {
  return {
    action,
    target: offer.id,
    metadata: {
      project_name: offer.projectName,
      sponsored: offer.sponsored,
      partner: offer.partner,
      placement: HOME_PROMOS_PLACEMENT,
    },
  };
}

function send(event: AffiliateEvent): void {
  const body = JSON.stringify(event);
  if (navigator.sendBeacon?.(TRACK_URL, new Blob([body], { type: "application/json" }))) {
    return;
  }
  // `keepalive` is the same promise sendBeacon makes, for the browsers that
  // do not have it. Failures are dropped: nothing on the page depends on it.
  void fetch(TRACK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export interface AffiliateSlotLabels {
  heading: string;
  sponsored: string;
  partner: string;
}

export function AffiliateSlot({
  offers,
  labels,
  classNames,
}: {
  offers: AffiliateOffer[];
  labels: AffiliateSlotLabels;
  /* Typed as possibly-undefined because that is what a CSS module lookup
     really is under `noUncheckedIndexedAccess` — the slot owns no styles of
     its own, it wears whichever page's it is placed on. */
  classNames: {
    section?: string;
    heading?: string;
    viewport?: string;
    list?: string;
    item?: string;
    link?: string;
    badge?: string;
  };
}) {
  const listRef = useRef<HTMLUListElement>(null);
  /* Outlives the effect on purpose. Kept inside the effect, this set is
     rebuilt every time the effect re-runs — React's development StrictMode
     mounts, unmounts and remounts, and every offer would be counted twice.
     One impression per offer has to mean per pageview, not per effect. */
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const list = listRef.current;
    if (!list || offers.length === 0) return;
    if (typeof IntersectionObserver === "undefined") return;

    const byId = new Map(offers.map((offer) => [offer.id, offer]));
    const seen = seenRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset.offerId;
          const offer = id ? byId.get(id) : undefined;
          if (!offer || seen.has(offer.id)) continue;
          seen.add(offer.id);
          observer.unobserve(entry.target);
          send(eventFor(offer, "affiliate_impression"));
        }
      },
      // Half the row visible is the point where a reader can actually read
      // it, which is what "shown" has to mean for the number to be worth
      // anything.
      { threshold: 0.5 },
    );

    for (const item of list.querySelectorAll<HTMLElement>("[data-offer-id]")) {
      observer.observe(item);
    }

    return () => observer.disconnect();
  }, [offers]);

  if (offers.length === 0) return null;

  return (
    <section className={classNames.section} aria-labelledby="promos-label">
      <h2 id="promos-label" className={classNames.heading}>
        {labels.heading}
      </h2>
      <div className={classNames.viewport}>
        <ul className={classNames.list} ref={listRef}>
          {Array.from({ length: MARQUEE_COPIES }, (_, copy) =>
            offers.map((offer) => {
              // Still checked at render time even though the schema refused
              // unsafe protocols on read — this is the last point before the
              // value becomes an attribute. An unlinkable row stays visible as
              // text rather than disappearing without trace.
              const href = safeExternalUrl(offer.url);
              const label = offerLabel(offer);
              const repeat = copy > 0;

              return (
                <li
                  key={`${copy}:${offer.projectName}:${offer.id}`}
                  className={classNames.item}
                  data-offer-id={offer.id}
                  data-repeat={repeat ? "" : undefined}
                  aria-hidden={repeat || undefined}
                >
                  {href ? (
                    <a
                      href={href}
                      className={classNames.link}
                      rel="sponsored nofollow noopener noreferrer"
                      // A repeat is hidden from assistive tech, so it must
                      // also leave the Tab order — focusable-but-hidden is
                      // the one combination that is worse than either.
                      // A mouse click on it is still a real click.
                      tabIndex={repeat ? -1 : undefined}
                      onClick={() => send(eventFor(offer, "affiliate_click"))}
                    >
                      {label}
                      <DiagonalArrow />
                    </a>
                  ) : (
                    <span className={classNames.link}>{label}</span>
                  )}
                  <span className={classNames.badge}>
                    {offer.sponsored ? labels.sponsored : labels.partner}
                  </span>
                </li>
              );
            }),
          )}
        </ul>
      </div>
    </section>
  );
}
