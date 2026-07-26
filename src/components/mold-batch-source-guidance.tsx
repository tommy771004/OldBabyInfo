import type { Locale } from "@/i18n/routing.ts";
import type { MoldBatchGuidance } from "@/lib/mold-batch/guidance.ts";

export interface MoldBatchSourceGuidanceLabels {
  heading: string;
  scope: string;
  excerpt: string;
  discoverySource: string;
  attribution: string;
  unattributed: string;
  capturedAt: string;
}

export function MoldBatchSourceGuidance({
  guidance,
  locale,
  labels,
}: {
  guidance: MoldBatchGuidance;
  locale: Locale;
  labels: MoldBatchSourceGuidanceLabels;
}) {
  return (
    <section aria-labelledby="mold-batch-source-guidance-heading">
      <h2 id="mold-batch-source-guidance-heading">{labels.heading}</h2>
      <p>{guidance.summary[locale]}</p>
      <p>{labels.scope}</p>
      <dl>
        <dt>{labels.excerpt}</dt>
        <dd>{guidance.sourceExcerpt}</dd>
        <dt>{labels.discoverySource}</dt>
        <dd><a href={guidance.discoverySource.url}>{guidance.discoverySource.label}</a></dd>
        <dt>{labels.attribution}</dt>
        <dd>{labels.unattributed}</dd>
        <dt>{labels.capturedAt}</dt>
        <dd><time dateTime={guidance.capturedAt}>{guidance.capturedAt}</time></dd>
      </dl>
    </section>
  );
}
