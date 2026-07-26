import type { ComboAppearance } from "./meta-standing.ts";

/**
 * Real Combo appearance data (ticket 33/34) has nowhere to come from yet.
 * ADR-0003's spike found the real usage records — 1,215 of them, from
 * hackmd's "陀螺賽場統計2025" sheet — but that sheet has never been
 * ingested into this repo; no ticket has done that step yet. This
 * function is the single place that will change once one does (a real
 * `data/combo-appearances.json` + schema, parsed the same way
 * getAllParts()/getAllEvents() are) — until then it honestly returns no
 * data, and every consumer (the Meta Standing page) is built to handle
 * that as a real, expected state, not a loading placeholder.
 */
export function getComboAppearances(): ComboAppearance[] {
  return [];
}
