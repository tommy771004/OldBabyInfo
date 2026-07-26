# 24 — 慢資料 → repo JSON 寫入器

**What to build:** 一支可在本機執行的程式，把抓取與抽取的結果寫成 repo 內的 JSON，產生人類可讀的差異。

**Blocked by:** 09, 20

**Status:** ready-for-agent — done, see Comments

- [x] 輸出格式穩定：欄位順序固定、縮排一致，使差異只反映真實變動
- [x] 每筆新增或修改的欄位帶有 Source Excerpt 與來源連結
- [x] 標記為 Needs Review 的項目在輸出中可被明確辨識
- [x] 寫入前執行 schema 與值域驗證，未通過即中止且不寫入
- [x] 具備 dry-run 模式，可先檢視將產生的差異
- [x] 批次呼叫時有速率控制，不會在 Actions 中打爆免費額度（延自 19 號票，見該票 Comments；此票是真正迴圈呼叫 20 號票處理多筆 Part／Event 的地方，此時已有真實呼叫模式可據以設計）

## Comments

**這是通用基礎設施，不是完整功能。** 新模組 `src/lib/data-writer.ts`，跟 20 號票的
`extraction.ts` 一樣，對 Part／Event 完全沒有領域知識——真正把它接上「抓哪些零件」「怎麼合併
進 `data/parts.json`」這些具體決定，是 32（賽事自動匯入）與 35（Mold Batch 抽取）號票的
工作。這張票只確保「迴圈呼叫＋速率控制＋驗證即中止＋Needs Review 隔離＋dry-run」這五件事
本身正確、可重用、有測試覆蓋。

**格式穩定：直接沿用既有慣例，不是發明新的排序規則。** 一開始想過用遞迴排序物件 key 來
「穩定化」格式，後來意識到那樣反而會製造巨大差異——`data/parts.json`／`data/events.json`
現有內容本來就不是字母序（`id, nameEn, nameJa, ...` 是照 schema 欄位順序），硬套字母排序
會讓每一筆既有資料的 key 順序整個打散，產生一次性的巨大 diff，恰恰違反「差異只反映真實變動」
的本意。正確做法是原封不動沿用 `generate-parts-seed.ts`／`generate-events-seed.ts` 已經在
用的 `JSON.stringify(data, null, 2) + "\n"`——JS 物件的 key 插入順序本來就是穩定的，只要
建構物件的程式碼本身每次都用同樣順序組出來（本來就是），格式自然穩定，不需要額外排序層。

**Source Excerpt／來源連結不會被基礎設施丟掉。** `mergeAccepted` 收到的是完整的
`accepted` outcome 物件（含 `sourceExcerpt`／`sourceUrl`／`model`），不是只有抽出來的
`value`——呼叫端要嘛主動使用這些欄位、要嘛主動捨棄，但基礎設施本身絕不會在傳遞過程中悄悄
弄丟它們。測試明確驗證這點（"preserves sourceExcerpt/sourceUrl/model on every accepted
item passed to mergeAccepted"）。

**Needs Review 用獨立檔案隔離，不是欄位標記。** 對照 CONTEXT.md 的定義（「必須經人工判斷才能
發布」），最直接了當的「明確可辨識」做法不是在同一份資料裡加一個 `needsReview: true` 欄位
（那樣還是混在「已發布」的資料裡，容易被下游程式不小心當成可信資料使用），而是完全不寫進
`outputPath`，另外寫到 `needsReviewPath`——結構上就不可能被誤用成已驗證資料。

**驗證即中止：靠例外傳播，不是回傳值判斷。** `validateMerged` 丟出的例外不在
`writeBatch()` 內攔截，直接往外傳——呼叫端（未來的 32／35 號票腳本）如果沒有自己包
try/catch，整支腳本就會直接中止並印出錯誤，不會有「回傳了一個 written:false 但呼叫端沒檢查
就繼續往下跑」這種容易被忽略的失敗模式。測試驗證了這個路徑：驗證丟例外時，連
`outputPath` 檔案本身都不會被建立。

**速率控制：實測真的有等待，不是只看程式邏輯。** `runRateLimited()` 用真實計時器（不是
mock）驗證三個項目、每個間隔 30ms 的批次確實至少花費 55ms（兩個間隔，不是三個——最後一項
之後不等待，沒有意義的等待）。

**測試：** `data-writer.test.ts`，9 個測試，涵蓋格式穩定性、速率控制的呼叫順序與真實耗時、
只寫入 accepted 項目、Needs Review 隔離到獨立檔案、provenance 欄位不遺失、驗證失敗時完全
不寫入任何檔案、dry-run 模式下檔案系統完全不受影響且 `before`／`after` 正確反映真實既有
內容與將產生的內容。

**Pipeline：** `npm run typecheck`、`npm run lint`、`npx vitest run`（166/166）、
`npm run build` 全數通過。
