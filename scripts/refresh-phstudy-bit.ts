import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  runPhstudyBitRefresh,
  type PhstudyBitRefreshStep,
} from "../src/lib/official-parts/phstudy-bit-refresh.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function runStep(step: PhstudyBitRefreshStep): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(root, step.script), ...step.args], {
      cwd: root,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        console.error(`phstudy Bit ${step.id} terminated by ${signal}.`);
        resolve(1);
        return;
      }
      resolve(code ?? 1);
    });
  });
}

const result = await runPhstudyBitRefresh(runStep);
if (!result.ok) {
  console.error(
    result.failedStep === "audit"
      ? "phstudy Bit refresh stopped at parity review; inspect the summary above before merging."
      : "phstudy Bit refresh stopped because the source snapshot could not be completed.",
  );
  process.exitCode = 1;
} else {
  console.log("phstudy Bit snapshot refreshed and parity audit passed; no merge was performed.");
}
