# 06 — Funbox 每日 Stock Listing

**What to build:** 使用者可查看 Funbox 商品的名稱、價格、庫存、原通路網址與抓取時間，資料每日更新且不因單次失敗消失。

**Blocked by:** None — can start immediately

**Status:** in-progress

- [x] 每筆 Stock Listing 顯示商品名稱、價格、庫存、通路與 captured time
- [x] 不鏡像商品描述或產品圖像
- [x] 不顯示「可能過期」或其他推測性 stale 標記
- [x] 外部連結直接前往 Funbox 商品頁，本站不經手交易
- [x] 每日排程與手動執行共用同一抓取流程
- [x] 結構化資料優先，必要 fallback 遵守限速與來源條款
- [x] 單筆或整次失敗保留最後成功資料並記錄錯誤
- [x] 測試涵蓋有貨、售罄、未知價格、空結果與來源失敗

## Progress

- `WhereToBuyList` now shows the captured timestamp and retailer link without an inferred stale label.
- Existing structured-first／Playwright fallback／rate-limit／failure-retention tests pass.
- An empty reviewed target set is now a safe daily no-op: `scripts/scrape-products.ts` does not launch a browser, require `DATABASE_URL`, or write fabricated rows when discovery is empty.
- `data/funbox-category-sources.json` and `src/lib/stock/funbox-category.ts` now provide a structured-first discovery path for the ten reviewed Beyblade category endpoints. Discovery follows each category page until an empty page, with the configured rate limit. Rows are accepted only with a same-origin `/products/` URL, positive price, and a unique Part-name match; malformed, external, ambiguous and unmatched rows stay out of the public table and are counted for review. The current run with `PRODUCT_SCRAPE_INTERVAL_MS=0` still returned no safe rows and wrote nothing.
- On 2026-07-26 the reviewed Funbox endpoints returned no safe product rows: the source category endpoint `https://shop.funbox.com.tw/category_products/XI/KB.json?limit=18&page=1` and all 10 Beyblade subcategory endpoints returned `[]`. The public category page exposed only category navigation and an empty product loader (`totalPages: 0`); site-wide product sitemap entries did not establish a Beyblade product target. `data/product-targets.json` remains empty. No product snapshot was fabricated; target discovery remains open until a concrete product URL plus stable name／price／stock fields can be reviewed.
