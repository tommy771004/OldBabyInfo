import { describe, expect, it, vi } from "vitest";

vi.mock("../../data/combo-appearances.json", () => ({ default: [{
  eventId: "fixture-event", entryId: "slot-1", eventDate: "2026-08-01",
  comboKey: "BLADE|RATCHET|BIT", placement: "unknown",
  sourceUrl: "https://example.com/results", sourceExcerpt: "Fixture evidence",
  capturedAt: "2026-08-02T00:00:00.000Z",
}] }));
vi.mock("./parts/repository.ts", () => ({ getAllParts: () => [
  { id: "BLADE", type: "blade" }, { id: "RATCHET", type: "ratchet" }, { id: "BIT", type: "bit" },
] }));
import { getComboAppearances } from "./combo-appearances-repository.ts";

describe("Combo appearance repository", () => {
  it("returns validated JSON records with their evidence instead of a constant empty array", () => {
    expect(getComboAppearances()).toHaveLength(1);
    expect(getComboAppearances()[0]).toMatchObject({ comboKey: "BLADE|RATCHET|BIT", sourceExcerpt: "Fixture evidence", placement: "unknown" });
  });
});
