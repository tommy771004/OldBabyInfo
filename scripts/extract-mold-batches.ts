/**
 * Mold Batch extraction (ticket 35) — the one real LLM-consensus consumer
 * of ticket 20's extractWithConsensus + ticket 24's writeBatch, since this
 * source (community prose articles) is exactly the case ADR-0004 says the
 * model belongs in, unlike ticket 32's structured CSV source.
 *
 * Usage: node scripts/extract-mold-batches.ts <article-url> [--dry-run]
 * Requires OPENROUTER_API_KEY.
 *
 * Deliberately does NOT write into data/parts.json directly. Two
 * independent models agreeing is a real signal, but a Mold Batch claim is
 * inherently softer than official data (CONTEXT.md: "官方不曾正式承認" —
 * never officially confirmed by the manufacturer, only inferred from
 * batch codes and community play-testing) — and this path has never been
 * run against a real article end-to-end (no OPENROUTER_API_KEY was
 * available while writing it). Output goes to two review files instead;
 * folding a reviewed batch of these into a specific Part's `moldBatches`
 * array is a separate, small, human-supervised step.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { partsFileSchema, type Part } from "../src/lib/parts/schema.ts";
import { extractMoldBatchesFromArticle, attachToParts } from "../src/lib/mold-batch/extract.ts";
import { fetchOpenRouterWithFallback } from "../openRouterHelper.ts";
import type { CallModel } from "../src/lib/extraction.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PARTS_PATH = join(__dirname, "..", "data", "parts.json");
const MATCHED_PATH = join(__dirname, "..", "data", "mold-batch-review-matched.json");
const UNMATCHED_PATH = join(__dirname, "..", "data", "mold-batch-review-unmatched.json");
const NEEDS_REVIEW_PATH = join(__dirname, "..", "data", "mold-batch-needs-review.json");

// Two different vendor families, as extractWithConsensus requires.
const MODELS: [string, string] = ["qwen/qwen3-coder:free", "google/gemma-4-31b-it:free"];

const EXTRACTION_PROMPT = `System: 你是一個資料抽取工具，只做格式轉換，不是判斷正確性的來源。
從下面這篇戰鬥陀螺 X 社群文章裡，找出所有「模具批次」相關的討論——同一個零件、不同生產批號之間的物理差異（例如某個批號的固鎖比較鬆、某個批號的塗裝比較容易剝落），這些差異未見於官方數值，只能從文章裡的敘述得知。

回傳一個 JSON 陣列，每個元素是 {"partNameRaw": 文章裡用來稱呼這個零件的原文名稱, "batchCode": 批號, "note": 這個批次的具體差異敘述}。如果文章沒有討論任何模具批次，回傳空陣列 []。只回傳 JSON，不要其他文字。

User:
`;

function buildCallModel(apiKey: string, articleText: string): CallModel {
  return async (model: string) => {
    const result = await fetchOpenRouterWithFallback(
      apiKey,
      EXTRACTION_PROMPT + articleText,
      (text: string) => text, // pass raw text through; JSON.parse happens below
      model,
    );
    return { value: JSON.parse(result.text), sourceExcerpt: result.text.slice(0, 500) };
  };
}

async function fetchArticleText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch article ${url}: ${res.status}`);
  const html = await res.text();
  // Minimal HTML-to-text: strip tags. Real articles here are hackmd/blog
  // posts, not complex layouts — a full HTML parser would be overkill for
  // a script whose only job is handing plain prose to the model.
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const url = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");
  if (!url || url.startsWith("--")) {
    console.error("Usage: node scripts/extract-mold-batches.ts <article-url> [--dry-run]");
    process.exit(1);
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not set — this script cannot call any model without it.");
    process.exit(1);
  }

  console.log(`Fetching article: ${url}`);
  const articleText = await fetchArticleText(url);

  console.log(`Extracting with consensus (${MODELS.join(" vs ")})...`);
  const outcome = await extractMoldBatchesFromArticle(url, MODELS, buildCallModel(apiKey, articleText));

  if (outcome.status === "rejected") {
    console.error(`Rejected: ${outcome.reason}`);
    process.exit(1);
  }

  if (outcome.status === "needs_review") {
    console.warn(`Models disagree — writing both candidate sets to ${NEEDS_REVIEW_PATH} for human judgment.`);
    if (!dryRun) {
      writeFileSync(NEEDS_REVIEW_PATH, JSON.stringify({ sourceUrl: url, ...outcome }, null, 2) + "\n");
    }
    return;
  }

  const allParts: Part[] = partsFileSchema.parse(JSON.parse(readFileSync(PARTS_PATH, "utf-8")));
  const { matched, unmatched } = attachToParts(outcome.value, allParts);

  console.log(`${matched.length} matched to a real Part, ${unmatched.length} unmatched.`);
  for (const { part, candidate } of matched) {
    console.log(`  matched: "${candidate.partNameRaw}" -> ${part.id} (batch ${candidate.batchCode})`);
  }
  for (const candidate of unmatched) {
    console.log(`  unmatched: "${candidate.partNameRaw}" (batch ${candidate.batchCode}) — recorded, not guessed`);
  }

  if (dryRun) {
    console.log("\n--dry-run: not writing.");
    return;
  }

  writeFileSync(
    MATCHED_PATH,
    JSON.stringify(
      matched.map(({ part, candidate }) => ({
        partId: part.id,
        batchCode: candidate.batchCode,
        note: candidate.note,
        sourceUrl: url,
        sourceExcerpt: outcome.sourceExcerpt,
      })),
      null,
      2,
    ) + "\n",
  );
  writeFileSync(UNMATCHED_PATH, JSON.stringify(unmatched, null, 2) + "\n");
  console.log(`Wrote review files: ${MATCHED_PATH}, ${UNMATCHED_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
