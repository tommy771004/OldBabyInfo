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
- [x] **package-lock.json 與 package.json 不同步**（8/11 起五條 workflow 全數死在 `npm ci`）。
      `655c263` 從 lock 刪掉 `node_modules/next-intl/node_modules/@swc/helpers@0.5.23`；
      `next-intl` 拉的 `@swc/core@1.15.46` optional peer 要 `>=0.5.17`，
      lock 裡只剩 next 帶的 0.5.15。`npm install --package-lock-only` 重生，
      diff 純新增，既有套件無版本變更。修復後 CI run 34123744647 綠 —— 8/9 以來第一次。（`cb61030`）
- [x] **Funbox 抓取間歇性全滅**。10 個 category source 從 runner 全部 `fetch failed`
      （同一 endpoint 台灣本機 200 / 0.28s），推測 datacenter IP 被擋。
      `discoverFunboxListings` 對 fetch（且只對 fetch）加指數退避：3 次、1s→2s、上限 8s；
      `FunboxFetchError` 帶 status 讓 408/429/5xx 重試、404/403 照單全收；
      每次嘗試加 20s `AbortSignal.timeout`；workflow timeout 20→30 分。
      **尚未實地驗證** —— 觀察到的失敗是「天」為單位，退避只有在失敗屬單次請求層級才會贏。（`10ffe9d`）

## 需要人工操作（agent 無權限）

- [ ] Settings → Actions → General → Workflow permissions → 勾選 **Allow GitHub Actions to create and approve pull requests**。沒有這個，Official Part refresh 的 PR 開不了（8/2 的失敗原因），Data ingest 修好 body 之後也會撞同一道牆。
- [x] Settings → Secrets and variables → Actions → 新增 `DATABASE_URL`（Neon 連線字串）。沒有這個，Stock Listing 永遠是空的，「哪裡買」全站沒有資料。
      2026-09-07 確認已設定：run 31351426119（08-10）的 log 中 `DATABASE_URL: ***`，guard 步驟未觸發。
- [ ] 選用：`PRODUCT_EXPECTED_COUNT` variable。未設時退回 `targets.length`，目前 `data/product-targets.json` 是空的。

## 上游來源的錯字（不由本站猜測修正）

每次執行固定丟掉 2 列，現在會出現在 PR body 的「解析失敗」段落，由人回報給店家或手動修：

- `#395 創勝玩具批發` — 日期 `2026/726`，`726` 無法安全還原成月／日
- `#634 TTC小車工作室` — 時間 `15.:00`

## Comments

~~`auto/official-parts-refresh` 分支已存在（8/2 推上去的），比對 main 只有 `capturedAt` 一行不同，上游 Part 資料本身沒有變動——所以這兩週沒有實際資料損失，但管線等於沒被驗證過。~~

**2026-09-07 更新：上面這段已經不成立，分支已刪除。** 觀察本身在 8/9 當時是對的，
但分支停在原地而 main 往前走了（ADR-0013 的 phstudy field authority 遷移落地）。
到 9/7 為止的實測差異：

| | main | 分支 f488d20 |
| --- | --- | --- |
| Part 總數 | 191 | 178 |
| 帶 phstudy field authority | 190 | 0 |
| main 有、分支沒有的 Part id | — | 36 個 |

合併它會抹掉 190 筆 phstudy field authority 並刪除 36 個已發布的 Part 身分，
正是 `src/lib/official-parts/refresh-policy.ts` 警告的
「identities that no longer exist in the BeyBrew snapshot」。

分支已從 origin 刪除。需要還原時：
`git push origin f488d202efa8ccfc7ff0c21d6073a11eac028775:refs/heads/auto/official-parts-refresh`

本次無法在容器內跑真實 ingest 驗證：sandbox proxy 擋掉 docs.google.com（403）。改以還原 8/8 那次執行規模的合成報告做單元測試，並實測摘要位元組大小。
