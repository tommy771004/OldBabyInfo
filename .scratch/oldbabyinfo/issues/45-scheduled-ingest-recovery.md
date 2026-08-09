# 45 — 排程管線修復

**What to build:** 讓三條排程真的把資料送進 repo，而不是每天紅一次沒人知道為什麼。

**Status:** ready-for-human

## 背景

2026-08-09 盤點結果：`data/events.json` 停在 07-26，但 runner 每天都算得出 781 筆；`data/parts.json` 與 catalog 停在 07-29；Stock Listing 一筆都沒有。三條排程的 cron 時刻都是對的，壞的是執行。

## 已修

- [x] **Data ingest 的 PR body 過大**（8/1–8/8 連續 12 次失敗）。完整逐筆 diff 約 134 KB，超過 Linux 單一環境變數 128 KB 上限，`create-pull-request` 以 `Argument list too long` 死在抓取成功之後。改為 `formatIngestSummary()` 產生上限 8 KB 的摘要（計數 + 失敗列全文 + 每段最多 20 筆），完整 diff 留在 job log 並在 PR 內附連結。實測 134 KB → 2.3 KB。
- [x] 順帶：原本 `node ... | tee` 會把 node 的 exit code 吃掉，circuit breaker 中止時 job 仍然是綠的。移掉 `tee` 之後中止會正確變紅。
- [x] **失敗原因看不見**。Data ingest 與 Official Part refresh 都加上 `if: failure()` 的說明步驟，把該改的 repo 設定與手動開 PR 的 compare 連結寫進 job summary。
- [x] **Product scrape 白跑兩分鐘才死**。改為開頭就檢查 `DATABASE_URL`，缺就立刻失敗並在 job summary 寫明 secret 的設定位置。

## 需要人工操作（agent 無權限）

- [ ] Settings → Actions → General → Workflow permissions → 勾選 **Allow GitHub Actions to create and approve pull requests**。沒有這個，Official Part refresh 的 PR 開不了（8/2 的失敗原因），Data ingest 修好 body 之後也會撞同一道牆。
- [ ] Settings → Secrets and variables → Actions → 新增 `DATABASE_URL`（Neon 連線字串）。沒有這個，Stock Listing 永遠是空的，「哪裡買」全站沒有資料。
- [ ] 選用：`PRODUCT_EXPECTED_COUNT` variable。未設時退回 `targets.length`，目前 `data/product-targets.json` 是空的。

## 上游來源的錯字（不由本站猜測修正）

每次執行固定丟掉 2 列，現在會出現在 PR body 的「解析失敗」段落，由人回報給店家或手動修：

- `#395 創勝玩具批發` — 日期 `2026/726`，`726` 無法安全還原成月／日
- `#634 TTC小車工作室` — 時間 `15.:00`

## Comments

`auto/official-parts-refresh` 分支已存在（8/2 推上去的），比對 main 只有 `capturedAt` 一行不同，上游 Part 資料本身沒有變動——所以這兩週沒有實際資料損失，但管線等於沒被驗證過。

本次無法在容器內跑真實 ingest 驗證：sandbox proxy 擋掉 docs.google.com（403）。改以還原 8/8 那次執行規模的合成報告做單元測試，並實測摘要位元組大小。
