const PART_STAGES = [
  "part-identity-heading",
  "official-facts-heading",
  "part-assessment-heading",
  "part-physical-heading",
  "where-to-buy-heading",
] as const;

const DISCUSSION_HEADINGS = ["discussion-heading", "discussion-empty-heading"] as const;
const PUBLIC_NAVIGATION_PATHS = ["parts", "events", "discussion", "login", "terms"] as const;

export type PartDetailHtmlContract =
  | { status: "ok"; failures: [] }
  | { status: "invalid"; failures: string[] };

export function evaluatePublicNavigationHtml(html: string): PartDetailHtmlContract {
  const failures: string[] = [];

  if (!/<nav\b[^>]*aria-label=/.test(html)) {
    failures.push("missing primary navigation");
  }

  for (const path of PUBLIC_NAVIGATION_PATHS) {
    const hrefPattern = new RegExp(`href="[^"]*/${path}(?:["/?])`);
    if (!hrefPattern.test(html)) failures.push(`missing primary navigation link: ${path}`);
  }

  return failures.length > 0 ? { status: "invalid", failures } : { status: "ok", failures: [] };
}

export function evaluateMoldBatchGuidanceHtml(html: string): PartDetailHtmlContract {
  const failures: string[] = [];
  if (!html.includes('id="mold-batch-source-guidance-heading"')) {
    failures.push("missing Mold Batch source guidance heading");
  }
  if (!html.includes("https://go-shoot.github.io/x/")) {
    failures.push("missing Go-Shoot Discovery Source link");
  }
  if (!/(未附原始來源|Original source not attached|原典未付与)/.test(html)) {
    failures.push("missing explicit unattributed state");
  }
  return failures.length > 0 ? { status: "invalid", failures } : { status: "ok", failures: [] };
}

export function evaluatePartDetailHtml(html: string): PartDetailHtmlContract {
  const failures: string[] = [];
  const stagePositions = PART_STAGES.map((id) => ({ id, position: html.indexOf(`id="${id}"`) }));

  for (const stage of stagePositions) {
    if (stage.position < 0) failures.push(`missing Part stage: ${stage.id}`);
  }

  const orderedStages = stagePositions.filter(({ position }) => position >= 0);
  for (let index = 1; index < orderedStages.length; index += 1) {
    const previous = orderedStages[index - 1];
    const current = orderedStages[index];
    if (previous && current && previous.position >= current.position) {
      failures.push(`Part stages are out of order: ${previous.id} before ${current.id}`);
    }
  }

  if (!DISCUSSION_HEADINGS.some((id) => html.includes(`id="${id}"`))) {
    failures.push("missing Discussion stage");
  }

  for (const pageSize of [5, 10, 15, 20]) {
    if (!html.includes(`assessmentSize=${pageSize}`)) {
      failures.push(`missing assessment page size: ${pageSize}`);
    }
  }

  if (!html.includes("https://hackmd.io/@liangyutw/beyblade-important-record")) {
    failures.push("missing Discovery Source link");
  }
  if (!html.includes("Dran Sword V2: +3g")) {
    failures.push("missing Go-Shoot weight observation");
  }
  if (!html.includes("https://go-shoot.github.io/x/db/-update.json")) {
    failures.push("missing Go-Shoot Discovery Source link");
  }
  if (!html.includes("/where-to-buy")) failures.push("missing Stock Listing full snapshot link");

  return failures.length > 0 ? { status: "invalid", failures } : { status: "ok", failures: [] };
}
