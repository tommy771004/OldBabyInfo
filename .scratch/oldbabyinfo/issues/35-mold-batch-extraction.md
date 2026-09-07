# 35 — Mold Batch 資料抽取

**What to build:** 把散在教學文章中的模具批號斷代知識，抽取成結構化資料。

**Blocked by:** 20, 24

**Status:** ready-for-human

- [x] 從文章來源抽取批號辨識規則與其對應的生產期間
- [x] 每筆資料附 Source Excerpt 與來源連結
- [x] 抽取結果走雙模型交叉驗證，分歧者標記 Needs Review
- [x] 與 Part 建立關聯；對不上者記錄而非猜測
- [x] 資料不完整時如實標示涵蓋範圍，不假裝完整（見 Comments 的誠實範圍說明）

## Comments

### 2026-09-05：人工審核後的離線合併

已新增 `src/lib/mold-batch/review.ts` 與 `scripts/merge-mold-batches.ts`，入口為
`npm run merge:mold-batches`。抽取器產出的 matched 列現在帶有實際 capture time、
來源片段與選用重量範圍，且一律為 `pending`／`unattributed`，不將模型共識冒充人工核准。

合併器預設 dry-run；只有明確 approved 且帶審核者／審核時間的列可用 `--write` 加入
Mold Batch。未知 Part ID、缺來源、無效格式或同來源同批號衝突會拒絕整批；不覆寫 Stat、
Alias 或其他 Part 欄位。不同來源的判斷並存，重跑同一核准檔不重複寫入。

使用程序與驗證邊界見 [`mold-batch-review.md`](../../../docs/agents/mold-batch-review.md)。
新增測試僅使用合成資料與測試自建暫存目錄；真實文章取得、模型呼叫、人工逐筆核對及 PR
核准仍未執行，不能因本機流程已接上就宣稱真實資料已驗證或填入網站。


**這張票跟 32 號票不一樣：這裡真的需要語言模型，沒有結構化資料的路可以繞。** 32 號票
（Event 自動抓取）意外發現真實來源是結構化 CSV，不需要模型；這張票不是——CONTEXT.md 對
Mold Batch 的定義本身就講明「只能靠產品上的批號與玩家實戰歸納得知」，來源是社群散文文章，
沒有結構化資料可用。這正是 ADR-0004 講的「該用模型的情境」，票面文字自己也這樣講。

**誠實的邊界：管線寫完了、單元測試也覆蓋了，但沒有真的呼叫過一次真實模型。** 這個環境沒有
設定 `OPENROUTER_API_KEY`（`echo "OPENROUTER_API_KEY is set: ${OPENROUTER_API_KEY:+yes}"`
確認過是空的，也沒有 `.env` 檔），代表 `extractWithConsensus` 需要的真實雙模型呼叫在這個
環境裡完全無法執行。跟 32 號票不同——32 號票我對接了真實的 Google Sheets CSV
來源、實際跑了三次、證明了新增/變更/未變三種真實情境都正確——這張票沒有辦法做到同等程度
的端到端驗證，這裡不假裝已經驗證過。已完成、且真的驗證過的部分：

- `src/lib/mold-batch/schema.ts`／`match-part.ts`／`extract.ts` 三個模組，用跟 20 號票
  自己（`extraction.test.ts`）完全一致的測試手法——`callModel` 用參數注入假回應，不是打
  真實 API、也不是 mock 全域 `fetch`——實測 12 個測試涵蓋：雙模型一致時 accepted、分歧時
  needs_review、缺 Source Excerpt 時 rejected、精確比對 Part 名稱（含官方名／別名／
  大小寫與空白容錯）、刻意不做模糊比對以免誤配（"Dran Buster" 不會被誤判成
  "Dran Sword"）、每筆候選資料保證落在 matched 或 unmatched 其中一邊、不會被靜默漏掉。
- 執行期防呆路徑：沒有網址參數、沒有 `OPENROUTER_API_KEY` 這兩條，都是可以在沒有真實金鑰
  下驗證的部分，也實測跑過確認會清楚報錯、正確以 exit code 1 中止，不會嘗試在缺金鑰的情況
  下悄悄繼續執行。

**過程中抓到一個真的會讓抽取結果空白的邏輯漏洞。** 第一版腳本抓了文章原文
（`fetchArticleText`）卻從來沒有把它塞進送給模型的 prompt 裡——`buildCallModel` 用的是
固定不變的 `EXTRACTION_PROMPT`，文章內容根本沒有真的送到模型手上，等於每次都在問模型
「幫我從（沒有內容的）文章裡找批號」。這不是我自己發現的，是 `npm run lint` 的
`no-unused-vars` 警告揪出來的（`articleText` 抓了卻沒被用到）——如果沒有這條 lint
規則，這個 bug 很可能會一路留到真的有 API 金鑰時才會在執行期顯現成「怎麼每次都回傳空
陣列」，而且原因很不明顯。修正方式：`buildCallModel` 改成接收文章全文，組進送給模型的
prompt。這也是為什麼即使無法端到端驗證，`typecheck`／`lint`／單元測試這三層仍然真實
攔下了一個功能性 bug，不是形式主義。

**順手修好一個埋在 `openRouterHelper.ts` 裡、19 號票從未真正發現的既有型別錯誤。**
我的新腳本第一次把 `openRouterHelper.ts` 拉進 `scripts/tsconfig.json` 的型別檢查範圍
（先前只有 Next.js 主專案的 root tsconfig 會檢查它）。`scripts/tsconfig.json` 的
`lib` 只有 `["ES2022"]`、沒有 `"DOM"`，這代表 `fetch`／`Response` 的型別來自
`@types/node`，而 Node 的型別定義裡 `Response.json()` 回傳 `Promise<unknown>`（比
DOM lib 傳統上的 `Promise<any>`更嚴格）——`openRouterHelper.ts` 裡 `const data =
await response.json()` 後面有將近 30 處直接存取 `data.xxx` 的地方，在這個更嚴格的情境
下全部型別報錯。這個問題其實一直都在，只是從來沒有任何 `scripts/` 底下的檔案 import 過
`openRouterHelper.ts`，所以從未被觸發過——`npm run typecheck` 先前顯示乾淨，不代表這個
檔案真的完整通過型別檢查，只代表它「從未被檢查到這個路徑」。修法比照這個專案既有腳本
（`generate-parts-seed.ts` 的 `res.json() as Promise<T>`）已經在用的手法：把
`const data = await response.json();` 改成 `const data: any = await response.json();`
——跟這個檔案本身早就大量使用 `any` 的既有風格一致，不是引入新慣例。

**「不假裝完整」的具體做法：不直接寫入 `data/parts.json`。** 就算未來真的接上
`OPENROUTER_API_KEY` 執行，這支腳本設計上也不會直接改動 `data/parts.json`——只寫兩個
獨立的審閱檔案（`data/mold-batch-review-matched.json`／
`data/mold-batch-review-unmatched.json`），或在模型分歧時寫入
`data/mold-batch-needs-review.json`。這是刻意保守的設計：一來這條路徑從未被真實資料
驗證過，直接讓它改動全站都在用的 168 筆真實零件資料風險过高；二來 CONTEXT.md 對 Mold
Batch 的定義本身就寫明「官方不曾正式承認」——物理公差比官方結構化數值更軟性，就算通過雙
模型一致，也值得比照 25 號票（PR gate）最終要建立的人工核可流程再過一次眼，而不是被這支
腳本自動吃進生產資料。把「審閱結果」跟「已發布資料」分成不同檔案，正是這個保守判斷的具體
實作。

**測試：** `match-part.test.ts`（6 個）、`extract.test.ts`（6 個），共 12 個，全部用
20 號票已經驗證過的假模型注入手法。

**Pipeline：** `npm run typecheck`、`npm run lint`、`npx vitest run`（221/221）、
`npm run build` 全數通過；腳本本身的「無網址參數」「無 API 金鑰」兩條錯誤路徑經實際執行
確認正確中止並清楚報錯——這是在沒有真實 LLM 憑證的環境裡，誠實能做到的驗證上限。
