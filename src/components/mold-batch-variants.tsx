import type { MoldBatch } from "@/lib/mold-batch/lookup.ts";
import { ExternalLink } from "./external-link.tsx";

export function MoldBatchVariants({
  batches,
  labels,
}: {
  batches: MoldBatch[];
  labels: { heading: string; source: string };
}) {
  if (batches.length === 0) return null;

  return (
    <section aria-labelledby="mold-batch-variants-heading">
      <h2 id="mold-batch-variants-heading">{labels.heading}</h2>
      <ul>
        {batches.map((batch) => (
          <li key={batch.batchCode}>
            <strong>{batch.batchCode}</strong>
            <p>{batch.note}</p>
            {batch.weightGrams ? <p>{batch.weightGrams.min}–{batch.weightGrams.max} g</p> : null}
            {batch.sourceExcerpt ? <p>{batch.sourceExcerpt}</p> : null}
            <ExternalLink href={batch.sourceUrl} newTab>
              {labels.source}
            </ExternalLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
