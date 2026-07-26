# 07 — 原始 Event 試算表每日更新

**What to build:** 使用者每天都能看到由原始賽事試算表更新的 Event 排程與結果，並可追查每筆資料的來源。

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] 只由指定原始 Event 試算表決定正式排程與結果欄位
- [ ] 每日排程與手動執行產生 added、changed、unchanged 與 failed 報告
- [ ] 原始列保留為 Source Excerpt
- [ ] 不合理日期、格式破壞與高失敗率會停止發布並進入 Needs Review
- [ ] 單次失敗保留最後成功 Event 資料
- [ ] Event 頁與 Meta Standing 可讀取更新後資料
- [ ] ingestion contract 測試涵蓋新增、變更、未變與錯誤列
