import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { communitySourcePoliciesSchema, evaluateCommunityRefreshPolicy } from "../src/lib/source-permission/policy.ts";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const policyPath = join(scriptDirectory, "..", "data", "community-source-policy.json");
const policies = communitySourcePoliciesSchema.parse(JSON.parse(readFileSync(policyPath, "utf8")));
const decision = evaluateCommunityRefreshPolicy(policies);

for (const reason of decision.reasons) {
  console.error(`${reason.sourceKey}: ${reason.reason}`);
}

console.log(
  decision.status === "ready"
    ? `Community source policy ready for: ${decision.eligibleSources.join(", ") || "none"}`
    : "Community source refresh blocked; no source acquisition should run.",
);

if (process.env.GITHUB_OUTPUT) {
  const output = `eligible=${decision.eligibleSources.length > 0 ? "true" : "false"}\n`;
  const { appendFileSync } = await import("node:fs");
  appendFileSync(process.env.GITHUB_OUTPUT, output);
}

if (decision.status === "blocked" && decision.reasons.some(({ sourceKey }) => policies.find((source) => source.sourceKey === sourceKey)?.enabled)) {
  process.exitCode = 1;
}
