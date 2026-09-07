"use client";

import { useState, type FormEvent } from "react";
import type { Part } from "@/lib/parts/schema.ts";
import { lookupMoldBatches } from "@/lib/mold-batch/lookup.ts";
import { ExternalLink } from "./external-link.tsx";

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
        {/* M3 outlined text field — label after the input, because the
            floating label is driven by `:placeholder-shown` on its sibling. */}
        <div className="m3-field">
          <input
            className="m3-field__input"
            id="mold-batch-code"
            name="batchCode"
            type="search"
            placeholder=" "
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
          <label className="m3-field__label" htmlFor="mold-batch-code">{labels.searchLabel}</label>
        </div>
        <button type="submit" className="m3-button m3-button--filled m3-state">
          {labels.searchButton}
        </button>
      </form>

      <p>{labels.coverage}</p>

      <div role="status" aria-live="polite">
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
                <ExternalLink href={batch.sourceUrl} newTab>
                  {labels.source}
                </ExternalLink>
              </article>
            ))
          : null}
      </div>
    </section>
  );
}
