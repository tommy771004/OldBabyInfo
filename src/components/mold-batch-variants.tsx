import type { MoldBatch } from "@/lib/mold-batch/lookup.ts";

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
            <a href={batch.sourceUrl} target="_blank" rel="noreferrer">
              {labels.source}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
