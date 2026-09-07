# 資料刷新恢復程序

## 先辨認是哪一道關卡

工作流程成功不等於資料已發布：Event／Part 必須經 **取得 → 驗證 → 開 PR → 人工核准合併 → 部署**；Stock Listing 則直接寫入資料庫。不要只確認 cron 存在，也不要從 PR 步驟失敗推論分支已成功推送。

### Part：目前因 Field Authority 遷移而阻擋舊入口

`npm run generate:parts` 與 `npm run refresh:parts` 都指向 BeyBrew 全量重建器。已發布零件具有 `phstudy-beyblade-x` provenance 時，這兩個入口現在會在任何抓取或寫入前非零退出；domain refresh 也有同一道保護。這是拒絕不安全覆寫，不是刷新完成。

工作流程已分成兩個互不依賴的 job：Part job 明確失敗並報告阻擋；Catalog job 仍可更新，僅以 `auto/generation-catalog-refresh` 分支提出兩個 Catalog JSON 的 PR。整個 workflow 仍會因 Part 阻擋呈現失敗，不得把 Catalog PR 當作 Part 更新已恢復。舊 `auto/official-parts-refresh` 分支／PR 不會被自動合併或刪除，維護者應審查是否含舊版覆寫結果。

不能只在 CI 接上 `merge:phstudy`：

- `data/sources/phstudy/` 的來源快照被 Git 忽略，乾淨 runner 沒有這些輸入。
- phstudy 的自動取得仍由 `data/community-source-policy.json` 關閉；既有照片發布許可不等於允許自動取得。
- 先重建再合併也可能失去策展名稱、Alias、Mold Batch 等合併所依賴的既有值。

人工維護路徑（必須先有完整、已審查的來源快照）：

1. 檢查來源 manifest 與取得方式；缺失或部分抓取的快照不能拿來合併。
2. 在獨立的本機工作副本執行 `npm run merge:phstudy`，**不要先跑 BeyBrew 重建器**。此命令會改動資料、圖片與轉址。
3. 執行 `npm run audit:phstudy-bit`，審閱 Blade／Ratchet 的資料差異及轉址，再跑 CI 同等檢查。
4. 人工核准變更後才合併／發布；不要以移除 provenance、停用保護或捏造來源方式讓排程通過。

恢復自動化尚需：明確的來源取得授權、可在乾淨 runner 驗證的快照取得方式、保留策展值的整合流程，以及覆蓋 Bit／Blade／Ratchet 身分和轉址的回歸驗證。這不是只設定一個 Secret 就能完成。

### Event：確認 PR 閉環，不替上游猜日期

維護者在 GitHub 檢查最近的 Data ingest run：

- 取得／解析失敗：依 log 處理，不重寫舊值或猜測錯字。
- PR 步驟失敗：先確認是 push、權限或 API 問題；只有明確的權限錯誤才調整 Actions 建立 PR 的設定。
- PR 已存在：檢查新增、刪除、日期與 Needs Review，再人工核准。不要自動合併。
- 合併後：確認部署使用該 commit，公開賽事頁的未來場次與來源一致。

2026-09-05 本機盤點時，`data/events.json` 有 767 場、日期最晚為 2026-08-30。這只證明本機 snapshot 已無未來場次，不能證明遠端權限目前仍未設定。

### Stock Listing：先確認資料庫邊界

維護者需確認 Actions 的 `DATABASE_URL` 指向本站資料庫，且所需 migration 已完成；不得使用合作推廣的 `SUP_DATABASE_URL` 替代，也不要將連線字串貼在 log 或票內。

`data/product-targets.json` 空白不等於沒有工作：分類來源也能提供抓取目標。執行真實 product scrape 會寫入資料庫，需在環境、權限及目標確認後才操作。以成功寫入紀錄與公開頁抓取時間驗證，不能只看 workflow 綠燈。

## 本機驗證邊界

單元測試與靜態檢查可證明保護與錯誤分支存在，但不能替代真實 OAuth、GitHub 權限、來源授權或正式資料庫驗收。本輪不更動遠端設定、不執行真實抓取、不發布。
