# 32 — Event 自動抓取接上 PR gate

**What to build:** 賽事資料自動從社群來源匯入並走 PR 核可，不再需要手動輸入。

**Blocked by:** 24, 31

**Status:** ready-for-agent — script done, see Comments for what's still genuinely blocked

- [x] 從 03 確認過的來源結構抓取 Event 資料
- [x] 半結構化表格的解析走 20 的抽取契約，附 Source Excerpt
- [x] 日期與地點通過值域驗證——錯誤的賽事資訊會害玩家白跑一趟
- [x] 與既有 Event 比對，只產生真實新增與變更
- [x] 來源格式改變導致解析失敗時中止並告警，不寫入殘缺資料

## Comments

**範圍澄清：票名寫「接上 PR gate」，但 PR gate 本身是 25 號票的工作，這裡不做。** 票名是
「Event 自動抓取接上 PR gate」，但五條檢查項目本身全部是關於**腳本／解析邏輯正確性**，沒有
一條字面要求「寫一個 GitHub Actions workflow」。25 號票本來就是獨立的「PR gate actions」
票，卡在 01 號票尚未驗證的 repository secrets 上——這裡只把「自動抓取＋解析＋驗證＋diff」
這個核心腳本做完、做對、實測過，尚未寫排程 workflow（那需要 01 號票的真實 secrets，此環境
沒有，也不該由我自作主張生出一份會在背景自動執行、使用 repo secrets 開 PR 的排程設定）。

**這其實不需要呼叫任何語言模型。** 03 號票的 spike 已經確認過：ticket 31 用的真實來源
（Funbox／B4 門市時間表）是**結構化的 Google Sheets CSV 匯出**，不是散文——票面說的「20 的
抽取契約」指的正是 `parseStructuredExtraction()`，這個函式簽名本身就沒有模型依賴（20 號票
自己的說明：「結構上就不可能呼叫模型」）。這代表這張票完全不需要 `OPENROUTER_API_KEY`，
也是為什麼在沒有真實 LLM 憑證的這個環境裡，這張票依然能真正做完、真正跑通。

**共用邏輯，不是複製一份。** 新增 `src/lib/events/csv-source.ts`，把 31 號票手動腳本裡
`fetchCsv`／`parseDate`／`parseCapacity`／`parseTime`／`parseSheet` 這些已經驗證過真實
資料怪癖（日期漏年份、容量寫成範圍「32-48」、時間缺前導零）的邏輯抽出來，31 號票的
`generate-events-seed.ts` 跟這張票的 `scripts/ingest-events.ts` 共用同一份，不會有「手動
版」跟「自動版」各自理解來源格式、日後悄悄長歪的風險。抽取過程中把最終驗證步驟從直接呼叫
`eventSchema.safeParse` 改成真正經過 `parseStructuredExtraction()`，讓「走 20 的抽取
契約」這件事不只是說法，程式碼路徑上真的經過那個函式——過程中發現這樣做會讓錯誤訊息從乾淨的
「Invalid ISO date」退化成 ZodError 原始的 JSON 字串，找出原因（`parseStructuredExtraction`
的 catch 直接用 `err.message`，而拋出的 ZodError 的 `.message` 本身是 JSON）後修正：在
`validate` 函式內部自己先把 Zod issues 格式化成乾淨訊息再拋出，兩者都要——真正經過契約，
訊息也要保持可讀。

**自動版跟手動版的關鍵差異：失敗率斷路器。** 手動腳本（人在看 console）遇到單一壞列就跳過、
繼續處理其餘幾百筆好資料，這是合理的。但自動版沒有人即時盯著——如果來源格式整個改了（例如
欄位順序調換），沿用「跳過壞列繼續跑」的邏輯會悄悄漏掉大部分真實更新，或寫入嚴重殘缺的資料，
使用者不會知道。因此加了 `exceedsFailureRate()`：單一表格的失敗列比例超過 10% 就整個中止、
不寫入——這個門檻是根據真實資料訂的，31 號票目前找到的兩個已知真實錯字列（"2026/726" 缺斜線、
"15.:00" 多一個點）加起來也只佔全部資料列的不到 1%，10% 已經是遠高於實際雜訊率的寬鬆容忍值，
超過這個比例更可能是格式整個壞了，不是零星手誤。

**日期值域驗證：** 新增 `isPlausibleEventDate()`，若解析出的日期距今超過一年（過去或未來）
就視為不合理、整批中止——這通常代表 fallback 年份算錯或月日對調，真的寫入資料庫會讓玩家
跑錯場次日期，比不更新還糟。

**diff 邏輯：真的只產生新增與變更，不是整份覆蓋重寫。** `diffAgainstExisting()` 依 id 比對
每一筆解析結果，`unchanged`（逐位元相同）完全不進最終輸出的異動清單，只有真正 `added`／
`changed` 的項目才會被合併寫入，每一筆都保留原始來源列文字作為 Source Excerpt。

**這不是紙上談兵——腳本真的對真實線上來源跑過三次，而且驗證了新增/變更/未變三種真實情境。**
用 Playwright 之外的方式驗證：直接執行 `node scripts/ingest-events.ts --dry-run` 對接
真實的 Google Sheets URL，第一次確認「0 新增、0 變更、767 筆未變」（因為 `data/events.json`
本來就是最新的）；接著刻意構造一份「少 3 筆真實事件、其中 1 筆容量被改成假值 999」的過期
副本，重跑腳本，正確偵測出「3 added、1 changed、763 unchanged」，且新增/變更的內容跟真實
線上資料逐字吻合；接著跑非 dry-run 版本讓它真的寫入，寫入結果跟原始真實資料逐位元相同
（`diff` 確認 identical）——證明「抓取→解析→比對→合併→驗證→寫入」整條真實管線正確，
不是只憑型別檢查通過就宣稱完成。過程中也把 `generate-events-seed.ts`（31 號票）重構成
使用同一份共用邏輯後，重新對真實來源跑過一次，確認輸出跟重構前逐位元相同（無迴歸）。

**測試：** `csv-source.test.ts`（16 個測試，涵蓋日期／容量／時間解析的真實怪癖、標頭列
跳過、Source Excerpt 保留、失敗列原因保留）、`ingest-diff.test.ts`（13 個測試，涵蓋日期
合理性檢查、diff 分類三態、失敗率斷路器不誤觸真實雜訊率但會抓到真正的格式崩壞、除以零
安全）。

**尚未做、且誠實列出原因的部分：**
- **排程 workflow（GitHub Actions）與 PR gate 本身**：屬於 25 號票範圍，卡在 01 號票尚未
  驗證的 repository secrets，不是這張票能做的。
- 這支腳本目前是「本機可執行、也已用真實資料驗證過正確性」的狀態，跟 31 號票的手動腳本
  地位相同——差別在於它具備 25 號票之後可以直接拿去接排程的斷路器與 diff 能力，不需要再
  重新設計解析邏輯。

**Pipeline：** `npm run typecheck`、`npm run lint`、`npx vitest run`（209/209）、
`npm run build` 全數通過；`data/events.json` 在所有測試後確認與 git 已提交版本逐位元相同
（無意外異動殘留）。
