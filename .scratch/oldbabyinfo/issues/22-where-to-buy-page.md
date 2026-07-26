# 22 — 「哪裡買」頁

**What to build:** 使用者能查到某支零件或商品目前在哪些通路有貨、售價多少，並清楚知道這份資料是何時抓的。

**Blocked by:** 21

**Status:** ready-for-agent

- [x] 列出商品名稱、售價、庫存狀態與所屬通路
- [x] 每筆資料顯示抓取時間；超過設定時限者明確標示為可能過期
- [x] 點擊後導向原通路商品頁完成購買，本站不經手交易
- [x] 資料庫冷啟動期間有明確的載入狀態，不呈現空白版面
- [x] 查無資料時顯示有意義的說明，而非空列表

## Comments

動態 Part route、loading state、database-unavailable 說明、空結果狀態與 mobile layout
已實作並以瀏覽器檢查；頁面目前沒有真實 listing，因為 21 號票的通路目標與 Neon 連線尚未
由維護者提供。
