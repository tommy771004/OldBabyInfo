# 21 — 商品抓取器 + Neon 寫入

**What to build:** 一支可在本機端到端執行的程式，抓取零售通路的商品售價與庫存並寫入資料庫，附抓取時間。

**Blocked by:** 09, 20

**Status:** ready-for-agent

Stock Listing 是會過期的快照，屬於 ADR-0001 所稱「快資料」，直寫資料庫。

- [x] 以 Playwright 取得動態載入的商品資料；若通路提供結構化端點則優先使用
- [x] 價格與庫存以決定性解析取得，不經模型
- [x] Stock Listing 資料表就位，每筆帶抓取時間
- [x] 抓取失敗時保留既有值並標記，絕不寫入空值或零
- [x] 抓取行為對來源站台友善：低頻率、有節流、帶可辨識的 user agent
- [x] 商品與 Part 的對應關係有明確處理，對不上時記錄而非猜測

## Comments

`src/lib/stock/*`、`scripts/scrape-products.ts`、`scripts/sql/stock-listings.sql` 已完成並由
單元測試覆蓋。`data/product-targets.json` 目前刻意為空：沒有真實通路目標、Neon migration
尚未在遠端資料庫執行，因此本次驗證的是可注入的抓取／解析／失敗保留／SQL seam，不宣稱
已完成真實通路的端到端抓取。
