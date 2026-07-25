# 23 — 商品爬取 Actions 排程 + 失敗告警

**What to build:** 商品資料每日自動更新，且當抓取失敗時你會知道，而不是靜靜地顯示舊資料。

**Blocked by:** 01, 21

**Status:** ready-for-agent

- [ ] GitHub Actions 排程每日執行一次抓取
- [ ] Playwright 於 Actions 環境中可正常執行
- [ ] 抓取失敗或結果筆數異常銳減時發出告警
- [ ] 單次執行時間與用量記錄下來，確認遠低於免費額度
- [ ] 憑證取自 repository secrets，不出現於記錄輸出中
