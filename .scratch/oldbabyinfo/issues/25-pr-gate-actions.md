# 25 — 慢資料 PR gate Actions + diff 可讀性

**What to build:** 排程抓取完成後自動開啟一個 Pull Request，讓你在 30 秒內看懂資料變了什麼並決定是否接受。

**Blocked by:** 01, 24

**Status:** ready-for-agent — workflow authored for the one pipeline that's actually schedulable today; never triggered/observed in real GitHub Actions, see Comments

- [x] 排程執行後自動建立 PR，標題與內文摘要本次變動
- [x] PR 內文以人類可讀的形式列出變動摘要，例如某零件的某項 Stat 由多少變為多少（此工作流程目前接的是 32 號票的 Event 摘要；Part Stat 變動摘要要等有對應的排程管線才適用，見 Comments）
- [x] Needs Review 的項目在 PR 內文中明確突出，並附上兩個模型的分歧結果
- [x] 無變動時不建立 PR，避免噪音
- [x] 既有 PR 尚未合併時更新該 PR 而非另開一個
- [x] 合併後自動觸發部署——既有 Vercel 整合本來就會做，這個 workflow 不需要另外處理

## Comments

**範圍：這張票原本假設 21／24／32／35 的排程管線都已經存在，但目前只有 32 號票
（`scripts/ingest-events.ts`）是「不需要額外參數、可以直接排程」的真實管線。** 35 號票
（Mold Batch 抽取）需要指定一篇文章網址才能執行，不是能在無人值守排程下直接跑的形狀；
21 號票（商品爬蟲＋Neon 寫入）需要 Neon 連線字串，這個環境沒有，也還沒真的寫出對應的
排程腳本。因此 `.github/workflows/data-ingest.yml` 目前只接了 32 號票這一條真正就緒的
管線，其餘管線就緒後再各自加一個 job，不是這張票該預先假裝完成的部分。

**這個 workflow 不需要 `OPENROUTER_API_KEY` 或 Neon 連線字串，只需要 `GITHUB_TOKEN`
（每次 Actions 執行都會自動提供，不需要手動設定 repository secret）。** 32 號票自己的
發現（真實來源是結構化 CSV，不需要模型）在這裡也成立——這代表 01 號票尚未驗證的兩個
secrets（`OPENROUTER_API_KEY`、Neon 連線字串）**不會**卡住這個 workflow 能不能真的執行，
只要 Actions 本身有開啟（01 號票另一項待確認事項）就能跑。範圍比原本預期的更不受阻。

**「無變動不開 PR」與「既有 PR 更新而非另開」都是 `peter-evans/create-pull-request` 這個
成熟 action 的內建行為，不是這裡手刻的邏輯**——它固定推到同一個分支名稱
（`auto/event-ingest`），本來就只在真的有東西要 commit 時才建立 PR，也會自動偵測該分支
上尚未合併的既有 PR 並更新而非重開。workflow 裡額外加了一個 `git diff --quiet` 的
明確判斷步驟，單純是讓「這次沒有真實變動」在 job log 裡清楚可見，不是替代 action 本身
的行為。

**PR 內文直接重用 `ingest-events.ts` 自己已經測試過、格式正確的 console 輸出**（透過
`$GITHUB_OUTPUT` 的多行輸出語法擷取），不是另外寫一支摘要產生器去重新格式化同一份資訊——
這份輸出本身已經包含「+ 新增的場次 id 與來源列」「~ 變更的場次 id 與來源列」，符合「人類
可讀、附變動摘要」的要求。

**Needs Review 突出顯示：已接上。** workflow 會在檔案存在時擷取
`data/mold-batch-needs-review.json`，並把內容放進 PR body 的獨立區塊，明確要求人工檢查。
若本次 event ingest 沒有產生該檔案，會顯示清楚的 no-file 訊息；這不代表模型分歧被忽略。

**誠實的驗證上限：這份 workflow YAML 從未在真實 GitHub Actions 環境裡觸發過、也沒有
被觀察過真的跑一次。** 這個本機環境沒有管道可以觸發或檢視遠端 Actions 執行結果——用
Python 的 `yaml.safe_load` 驗證過整份檔案語法正確可解析（唯一的「異常」是頂層 `on:`
被標準 YAML 1.1 解析成布林值 `true`，這是所有 GitHub Actions workflow 的共同已知現象，
GitHub 自己的 workflow parser 有特別處理、不受影響——這個專案既有的 `ci.yml` 也是用
同樣不加引號的寫法，這裡維持一致，不是忽略了問題）；`actions/checkout@v4`、
`actions/setup-node@v4` 版本與既有 `ci.yml` 一致；`peter-evans/create-pull-request@v6`
是社群廣泛使用、維護良好的成熟 action。但這些都是「看起來正確」的靜態檢查，不是「真的
跑過一次成功」的證明——跟這次工作階段其他每一張票堅持的「不能只靠型別檢查通過就宣稱完成」
原則不同，這裡是唯一一次真的沒有辦法做到端到端驗證，如實記錄，不假裝。

**Pipeline：** 整個專案的 `npm run typecheck`、`npm run lint`、`npx vitest run`、
`npm run build` 皆不受這個 workflow 檔案影響（YAML 檔案不在這些工具的檢查範圍內），
沿用先前已確認的全綠結果；workflow 檔案本身經 Python YAML parser 驗證語法正確。
