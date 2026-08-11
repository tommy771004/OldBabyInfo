export interface PhstudyBitRefreshStep {
  id: "scrape" | "audit";
  script: string;
  args: string[];
}

export const phstudyBitRefreshSteps: readonly PhstudyBitRefreshStep[] = [
  {
    id: "scrape",
    script: "scripts/scrape-phstudy-parts.ts",
    args: ["--category=Bit", "--category=Ratchet", "--category=Blade"],
  },
  {
    id: "audit",
    script: "scripts/audit-phstudy-bit-identity-parity.ts",
    args: ["--summary"],
  },
];

export function requirePhstudyRefreshCategory<T>(category: string, entries: T[]): T[] {
  if (entries.length === 0) {
    throw new Error(`Required phstudy category ${category} has no valid rows`);
  }
  return entries;
}

export type PhstudyBitRefreshResult =
  | { ok: true; completed: PhstudyBitRefreshStep["id"][] }
  | {
      ok: false;
      completed: PhstudyBitRefreshStep["id"][];
      failedStep: PhstudyBitRefreshStep["id"];
    };

export async function runPhstudyBitRefresh(
  run: (step: PhstudyBitRefreshStep) => Promise<number>,
): Promise<PhstudyBitRefreshResult> {
  const completed: PhstudyBitRefreshStep["id"][] = [];
  for (const step of phstudyBitRefreshSteps) {
    const exitCode = await run(step);
    if (exitCode !== 0) return { ok: false, completed, failedStep: step.id };
    completed.push(step.id);
  }
  return { ok: true, completed };
}
