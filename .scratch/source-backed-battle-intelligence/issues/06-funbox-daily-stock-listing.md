# 06 — Funbox 每日 Stock Listing

**What to build:** 使用者可查看 Funbox 商品的名稱、價格、庫存、原通路網址與抓取時間，資料每日更新且不因單次失敗消失。

**Blocked by:** None — can start immediately

**Status:** in-progress

- [ ] 每筆 Stock Listing 顯示商品名稱、價格、庫存、通路與 captured time
- [ ] 不鏡像商品描述或產品圖像
- [x] 不顯示「可能過期」或其他推測性 stale 標記
- [x] 外部連結直接前往 Funbox 商品頁，本站不經手交易
- [x] 每日排程與手動執行共用同一抓取流程
- [x] 結構化資料優先，必要 fallback 遵守限速與來源條款
- [x] 單筆或整次失敗保留最後成功資料並記錄錯誤
- [x] 測試涵蓋有貨、售罄、未知價格、空結果與來源失敗

## Progress

- `WhereToBuyList` now shows the captured timestamp and retailer link without an inferred stale label.
- Existing structured-first／Playwright fallback／rate-limit／failure-retention tests pass.
- On 2026-07-26 the reviewed Funbox category endpoint `/category_products/XI/KB.json` returned an empty array, and `data/product-targets.json` remains empty. No product snapshot was fabricated; target discovery remains open.
