# 03 — Assessment 分歧與 URL 分頁

**What to build:** 使用者能閱讀同一 Subject 的全部來源分歧，並以可分享的 URL 控制頁碼與每頁筆數。

**Blocked by:** 02 — 單一 Part Assessment tracer

**Status:** ready-for-agent

- [ ] 衝突 Assessment 並列，不平均、不投票、不合併
- [ ] 排序固定為 attributed 優先，再依內容時間由新到舊
- [ ] 每頁選項為 5、10、15、20，預設 10
- [ ] `assessmentPage` 與 `assessmentSize` 保留重新整理、返回與分享狀態
- [ ] 無效、負數或超出範圍的 query 值安全回到有效狀態
- [ ] 分頁控制可用鍵盤操作並具有明確名稱
- [ ] 測試只依可見順序、URL 與控制行為判斷結果
