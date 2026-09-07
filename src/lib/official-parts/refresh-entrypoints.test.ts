import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertBeybrewRefreshAllowed,
  BeybrewRefreshBlockedError,
  BEYBREW_REFRESH_BLOCKED_EXIT_CODE,
} from "./refresh-policy.ts";
import type { Part } from "../parts/schema.ts";

/** Offline checks: never fetch sources, run migrations or publish anything. */
describe("Part refresh entry points", () => {
  it("blocks the real generator before fetching or changing published data", () => {
    const paths = ["data/parts.json", "data/part-images.json", "data/legacy-part-redirects.json"];
    const before = paths.map((path) => readFileSync(path, "utf8"));
    const result = spawnSync(process.execPath, [
      "--import",
      `data:text/javascript,${encodeURIComponent('globalThis.fetch = async () => { throw new Error("NETWORK_MUST_NOT_RUN"); };')}`,
      "scripts/generate-parts-seed.ts",
    ], { encoding: "utf8", timeout: 15_000 });

    expect(result.error).toBeUndefined();
    // The guard has its own exit code so the workflow can tell a designed stop
    // from a real break. Exit 1 here would make the two indistinguishable.
    expect(result.status).toBe(BEYBREW_REFRESH_BLOCKED_EXIT_CODE);
    expect(result.stderr).toContain("BeyBrew-only refresh blocked");
    expect(result.stderr).not.toContain("NETWORK_MUST_NOT_RUN");
    expect(result.stdout).not.toContain("Fetching");
    expect(paths.map((path) => readFileSync(path, "utf8"))).toEqual(before);
  });

  it("keeps both npm aliases on the guarded generator", () => {
    const { scripts } = JSON.parse(readFileSync("package.json", "utf8"));
    expect(scripts["generate:parts"]).toBe("node scripts/generate-parts-seed.ts");
    expect(scripts["refresh:parts"]).toBe(scripts["generate:parts"]);
  });

  it("reports Part failure without trying to bypass the acquisition gate", () => {
    const workflow = readFileSync(".github/workflows/official-parts-refresh.yml", "utf8");
    expect(workflow).toContain("npm run refresh:parts");
    expect(workflow).toContain("if: failure() && steps.parts.outcome == 'failure'");
    expect(workflow).not.toMatch(/run:.*(?:scrape:phstudy|merge:phstudy|refresh:phstudy-bit)/);
    expect(workflow).not.toContain("continue-on-error: true");
  });

  it("keeps Catalog refresh independent and restricts its PR to Catalog files", () => {
    const workflow = readFileSync(".github/workflows/official-parts-refresh.yml", "utf8");
    const [partJob, catalogJob] = workflow.split("\n  refresh:\n");
    expect(partJob).toContain("part-refresh:");
    expect(partJob).not.toContain("create-pull-request@");
    expect(catalogJob).toContain("npm run refresh:generation-catalog");
    expect(catalogJob).not.toContain("npm run refresh:parts");
    expect(catalogJob).not.toMatch(/^\s+needs:/m);
    expect(catalogJob).toContain("add-paths: |\n            data/generation-catalog.json\n            data/generation-catalog-needs-review.json");
    expect(catalogJob).toContain("branch: auto/generation-catalog-refresh");
  });

  it.each(["official-parts-refresh", "data-ingest"])(
    "%s only diagnoses PR failure after that step fails, without claiming a push succeeded",
    (name) => {
      const workflow = readFileSync(`.github/workflows/${name}.yml`, "utf8");
      expect(workflow).toContain("id: pr");
      expect(workflow).toContain("if: failure() && steps.pr.outcome == 'failure'");
      expect(workflow).not.toContain("資料已經推到");
      expect(workflow).toContain("不能由此判定分支已推送成功");
    },
  );

  it("throws a recognisable error carrying the blocked Part count", () => {
    const blocked = [{
      id: "DRANSWORD",
      provenance: [{ sourceId: "phstudy-beyblade-x" }],
    }] as unknown as Part[];

    expect(() => assertBeybrewRefreshAllowed(blocked)).toThrow(BeybrewRefreshBlockedError);
    try {
      assertBeybrewRefreshAllowed(blocked);
    } catch (error) {
      expect(error).toBeInstanceOf(BeybrewRefreshBlockedError);
      expect((error as BeybrewRefreshBlockedError).blockedPartCount).toBe(1);
    }
    expect(() => assertBeybrewRefreshAllowed([])).not.toThrow();
  });

  it("reports the designed block without letting a real break hide inside it", () => {
    const workflow = readFileSync(".github/workflows/official-parts-refresh.yml", "utf8");
    // Only exit 75 is swallowed; the step re-raises every other code.
    expect(workflow).toContain('if [ "$code" -eq 75 ]');
    expect(workflow).toContain('exit "$code"');
    expect(workflow).toContain("blocked=true");
    expect(workflow).toContain("if: steps.parts.outputs.blocked == 'true'");
    // A green Part job must never read as "Part data was refreshed".
    expect(workflow).toContain("Part 自動刷新仍未恢復");
    expect(workflow).not.toContain("continue-on-error: true");
  });

  it("never leaves a backtick unescaped inside a double-quoted workflow echo", () => {
    // A backtick inside double quotes is command substitution, so a summary
    // line naming `npm run merge:phstudy` would RUN it on the runner and
    // rewrite published data. Every such mention must be single-quoted or
    // backslash-escaped.
    const offenders: string[] = [];
    for (const file of readdirSync(".github/workflows")) {
      const lines = readFileSync(`.github/workflows/${file}`, "utf8").split("\n");
      lines.forEach((line, index) => {
        const echoed = /echo\s+"(.*)"\s*$/.exec(line.trim());
        if (echoed && /(^|[^\\])`/.test(echoed[1]!)) {
          offenders.push(`${file}:${index + 1}: ${line.trim()}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});
