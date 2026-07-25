# 19 — openRouterHelper 改造 + 測試

**What to build:** 一個可靠的模型呼叫層，在批次處理數百筆抽取工作時行為可預測，且用量正確歸屬於本專案。

**Blocked by:** 02

**Status:** ready-for-agent — all in-scope items done; one item deferred, see Comments

現況問題：`HTTP-Referer` 與 `X-Title` 仍指向另一個專案；`maxRetries = 1` 使重試迴圈永遠只執行一次，指數退避為無效程式碼。

- [x] 請求標頭改為本專案，用量歸屬正確
- [x] 重試行為重新設計並實際生效，退避間隔隨嘗試次數增長
- [x] 區分「應重試」與「應換模型」兩類錯誤並分別處理
- [x] 429 與 5xx 的處理路徑各有測試覆蓋
- [x] `parseAndRepairJSON` 原樣保留，並補上針對截斷與未跳脫引號的測試
- [ ] ~~批次呼叫時有速率控制~~ → 延後至 21、24 號票，見下方 Comments

## Comments

以 TDD 紅燈→綠燈完成前五項，七輪循環，測試見 `openRouterHelper.test.ts`。

Root cause 只有一行：`maxRetries = 1` 讓重試迴圈只跑一次；`continue`/`break` 分流（重試同一模型 vs 換下一個模型）邏輯原本就對，只是從未被跑過、也從未被測試鎖住。改成 `maxRetries = 3` 後，429／503／404／401 四種路徑一併補上回歸測試。

`parseAndRepairJSON` 未動一行程式碼，只補測試覆蓋。

**批次速率控制刻意未做**：這支檔案的職責是單次呼叫，節流是呼叫端（批次腳本）的關切。真正的批次呼叫者現在還不存在——20 號票每次抽取只打 2 通模型（有界，不需節流），24 號票才會迴圈呼叫 20 去處理數百筆 Part／Event，那才是節流真正該做的地方。此刻猜介面形狀是過度設計，已將此項移至 24 號票，開工時有真實呼叫模式可據以設計。

