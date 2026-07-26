# 30 — 檢舉／刪除／審核工具

**What to build:** 使用者能檢舉不當內容，而你能在不進資料庫下指令的情況下處理它。

**Blocked by:** 28

**Status:** ready-for-agent

這是開設討論功能的必要成本，不是選配。

- [ ] 使用者可檢舉單則發言並選填原因
- [ ] 管理者介面可檢視待處理檢舉並執行隱藏或刪除
- [ ] 可封鎖特定使用者發言
- [x] 被隱藏的內容不出現在任何公開頁面與索引中
- [x] 具備使用者條款與免責聲明頁面，說明本站不經手交易亦不擔保討論內容

## Comments

已完成 reports／blocked users schema、公開 reader 排除 hidden/deleted rows，以及三語
`/terms` 頁。檢舉表單、管理者審核介面與封鎖 action 尚未實作，故保留前三項未勾選。
