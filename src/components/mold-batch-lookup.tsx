"use client";

import { useState, type FormEvent } from "react";
import type { Part } from "@/lib/parts/schema.ts";
import { lookupMoldBatches } from "@/lib/mold-batch/lookup.ts";

export interface MoldBatchLookupLabels {
  searchLabel: string;
  searchButton: string;
  emptyQuery: string;
  noMatches: string;
  coverage: string;
  source: string;
}

interface MoldBatchLookupProps {
  parts: Part[];
  labels: MoldBatchLookupLabels;
  partNames?: Record<string, string>;
}

export function MoldBatchLookup({ parts, labels, partNames = {} }: MoldBatchLookupProps) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const result = lookupMoldBatches(parts, submittedQuery);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query);
  }

  return (
    <section aria-label={labels.searchLabel}>
      <form onSubmit={submit}>
        <label htmlFor="mold-batch-code">{labels.searchLabel}</label>
        <input
          id="mold-batch-code"
          name="batchCode"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
        <button type="submit">{labels.searchButton}</button>
      </form>

      <p>{labels.coverage}</p>

      <div aria-live="polite">
        {result.kind === "empty-query" ? <p>{labels.emptyQuery}</p> : null}
        {result.kind === "no-matches" ? <p>{labels.noMatches}</p> : null}
        {result.kind === "matches"
          ? result.matches.map(({ part, batch }) => (
              <article key={`${part.id}-${batch.batchCode}`}>
                <h3>{partNames[part.id] ?? part.nameEn}</h3>
                <p>
                  <strong>{batch.batchCode}</strong>
                </p>
                <p>{batch.note}</p>
                <a href={batch.sourceUrl} target="_blank" rel="noreferrer">
                  {labels.source}
                </a>
              </article>
            ))
          : null}
      </div>
    </section>
  );
}
