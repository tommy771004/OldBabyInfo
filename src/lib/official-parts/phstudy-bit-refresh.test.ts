import { describe, expect, it, vi } from "vitest";
import {
  phstudyBitRefreshSteps,
  requirePhstudyRefreshCategory,
  runPhstudyBitRefresh,
} from "./phstudy-bit-refresh.ts";

describe("runPhstudyBitRefresh", () => {
  it("rejects an incomplete requested category before the audit can run", () => {
    expect(requirePhstudyRefreshCategory("Bit", [{ id: "BT-A" }])).toEqual([{ id: "BT-A" }]);
    expect(() => requirePhstudyRefreshCategory("Ratchet", [])).toThrow(
      "Required phstudy category Ratchet has no valid rows",
    );
  });

  it("runs the network scrape before the read-only parity audit", async () => {
    const run = vi.fn().mockResolvedValue(0);

    await expect(runPhstudyBitRefresh(run)).resolves.toEqual({
      ok: true,
      completed: ["scrape", "audit"],
    });
    expect(run.mock.calls.map(([step]) => step.id)).toEqual(["scrape", "audit"]);
    expect(phstudyBitRefreshSteps[0]?.args).toEqual([
      "--category=Bit",
      "--category=Ratchet",
      "--category=Blade",
    ]);
    expect(phstudyBitRefreshSteps[1]?.args).toEqual(["--summary"]);
  });

  it("stops immediately and identifies the failed gate", async () => {
    const run = vi.fn()
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    await expect(runPhstudyBitRefresh(run)).resolves.toEqual({
      ok: false,
      completed: ["scrape"],
      failedStep: "audit",
    });
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("never audits a failed or incomplete scrape", async () => {
    const run = vi.fn().mockResolvedValue(1);

    await expect(runPhstudyBitRefresh(run)).resolves.toEqual({
      ok: false,
      completed: [],
      failedStep: "scrape",
    });
    expect(run).toHaveBeenCalledTimes(1);
  });
});
