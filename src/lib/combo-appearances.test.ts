import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAllParts } from "./parts/repository.ts";
import { comboKeyOf, computeMetaStandings, parseComboKey } from "./meta-standing.ts";
import { mergeComboAppearanceReviews, validateComboAppearances } from "./combo-appearances.ts";

const parts = ["blade", "ratchet", "bit"].map((type) => getAllParts().find((part) => part.type === type)!);
const comboKey = comboKeyOf(parts[0]!.id, parts[1]!.id, parts[2]!.id);
const event = { id: "fixture-event", date: "2026-08-01", tier: "G3", venueName: "Fixture venue", venueAddress: "Fixture address", time: "12:00", capacity: 16, registrationMethod: "onsite", ageCategory: "open", sourceUrl: "https://example.com/event", results: null };
const record = { eventId: event.id, eventDate: event.date, entryId: "slot-1", comboKey, placement: "unknown", sourceUrl: "https://example.com/results", sourceExcerpt: "Synthetic fixture observation", capturedAt: "2026-08-02T00:00:00.000Z" };
const approved = (overrides = {}) => ({ decision: "approved", reviewedBy: "fixture-reviewer", reviewedAt: "2026-08-03T00:00:00.000Z", record: { ...record, ...overrides } });

describe("reviewed Combo appearances", () => {
  it("accepts explicit approvals and preserves their source evidence", () => {
    const result = mergeComboAppearanceReviews([], [approved(), { decision: "pending", record }, { ...approved(), decision: "rejected" }], parts, [event]);
    expect(result).toMatchObject({ added: 1, pending: 1, rejected: 1 });
    expect(result.records).toEqual([record]);
  });
  it("deduplicates the same event entry across reimports without counting it twice", () => {
    const first = mergeComboAppearanceReviews([], [approved(), approved()], parts, [event]);
    expect(first).toMatchObject({ added: 1, unchanged: 1 });
    // Historical observations survive removal from the rotating calendar.
    expect(mergeComboAppearanceReviews(first.records, [approved()], parts, [])).toMatchObject({ added: 0, unchanged: 1 });
  });
  it("rejects cross-source duplicates with different claims, rather than adding to sample size", () => {
    expect(() => mergeComboAppearanceReviews([], [approved(), approved({ sourceUrl: "https://example.org/other", placement: "champion" })], parts, [event])).toThrow("Conflicting Event entry");
  });
  it("rejects unknown Event or mismatched date", () => {
    expect(() => mergeComboAppearanceReviews([], [approved()], parts, [])).toThrow("Unknown Event");
    expect(() => mergeComboAppearanceReviews([], [approved({ eventDate: "2026-08-02" })], parts, [event])).toThrow("mismatched date");
  });
  it("rejects corrupt published duplicate entries and conflicting Event dates", () => {
    expect(() => validateComboAppearances([record, record], parts)).toThrow("Duplicate Event entry");
    expect(() => validateComboAppearances([record, { ...record, entryId: "slot-2", eventDate: "2026-08-02" }], parts)).toThrow("Conflicting Event dates");
  });
  it.each(["UNKNOWN|3-60|F", `${comboKey}|extra`, "", "a|b"])("rejects invalid Combo %s", (key) => {
    expect(() => validateComboAppearances([{ ...record, comboKey: key }], parts)).toThrow();
  });
  it("rejects wrong-slot stable IDs", () => {
    expect(() => validateComboAppearances([{ ...record, comboKey: comboKeyOf(parts[2]!.id, parts[1]!.id, parts[0]!.id) }], parts)).toThrow("wrong-slot");
    expect(() => parseComboKey(`${comboKey}|extra`)).toThrow();
  });
  it.each([{ sourceExcerpt: " " }, { sourceUrl: "javascript:alert(1)" }, { sourceUrl: "https://user:password@example.com" }, { capturedAt: "unknown" }, { eventDate: "2000-01-01" }, { placement: "winner-ish" }])("rejects invalid evidence %j", (override) => {
    expect(() => mergeComboAppearanceReviews([], [approved(override)], parts, [event])).toThrow();
  });
  it("requires reviewer metadata and never guesses approval", () => {
    expect(() => mergeComboAppearanceReviews([], [{ ...approved(), reviewedBy: " " }], parts, [event])).toThrow();
    expect(() => mergeComboAppearanceReviews([], [record], parts, [event])).toThrow();
  });
  it("keeps unknown placement out of top-eight and champion conclusions even with a large sample", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ ...record, entryId: `slot-${i}`, placement: i === 0 ? "unknown" as const : "champion" as const }));
    const [standing] = computeMetaStandings(validateComboAppearances(rows, parts));
    expect(standing).toMatchObject({ sampleSize: 20, usageRate: 1, top8Rate: { status: "insufficient_data" }, championCount: { status: "insufficient_data" } });
  });
});

describe("offline appearances import CLI", () => {
  let directory: string;
  const script = resolve("scripts/import-combo-appearances.ts");
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "oldbaby-appearances-"));
    for (const [name, value] of Object.entries({ parts, events: [event], output: [], review: [approved()] })) {
      writeFileSync(join(directory, `${name}.json`), JSON.stringify(value));
    }
  });
  afterEach(() => rmSync(directory, { recursive: true, force: true }));
  const readOutput = () => readFileSync(join(directory, "output.json"), "utf8");
  function run(...args: string[]) {
    return spawnSync(process.execPath, [
      "--import", `data:text/javascript,${encodeURIComponent('globalThis.fetch = async () => { throw new Error("NETWORK_MUST_NOT_RUN"); };')}`,
      script, join(directory, "review.json"), "--parts", join(directory, "parts.json"), "--events", join(directory, "events.json"), "--output", join(directory, "output.json"), ...args,
    ], { encoding: "utf8", timeout: 15_000 });
  }
  it("defaults to dry-run, writes only with --write, and reimports byte-identically", () => {
    const preview = run();
    expect(preview.status, preview.stderr).toBe(0);
    expect(readOutput()).toBe("[]");
    const first = run("--write");
    expect(first.status, first.stderr).toBe(0);
    const after = readOutput();
    expect(JSON.parse(after)).toEqual([record]);
    expect(run("--write").status).toBe(0);
    expect(readOutput()).toBe(after);
    expect(readdirSync(directory).sort()).toEqual(["events.json", "output.json", "parts.json", "review.json"]);
  });
  it("leaves the output untouched on a later invalid row", () => {
    writeFileSync(join(directory, "review.json"), JSON.stringify([approved(), approved({ entryId: "slot-2", eventId: "unknown" })]));
    expect(run("--write").status).toBe(1);
    expect(readOutput()).toBe("[]");
  });
});
