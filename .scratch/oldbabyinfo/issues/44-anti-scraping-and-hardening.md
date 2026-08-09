# 44 — 反爬蟲與安全性強化

**What to build:** 讓整站級的批次抓取變慢且顯眼，同時把幾條實際存在的攻擊路徑關掉——全部不犧牲搜尋引擎與 AI 問答引擎的收錄。

**Status:** ready-for-agent

決策與取捨見 [ADR-0012](../../../docs/adr/0012-anti-scraping-is-friction-not-a-wall.md)。

## 反爬蟲

- [x] 誠實自報的商業採集器（AhrefsBot、SemrushBot、Bytespider…）與 HTTP 函式庫／掃描工具（python-requests、Scrapy、curl、sqlmap…）直接 403
- [x] 依路徑分類的滑動視窗流量限制：Catalog 頁面 90/分、sitemap 與 llms.txt 20/分、auth 20/分，各自獨立計數
- [x] 自稱搜尋引擎者拿到四倍預算而非無限通行；來源不明者拿到四分之一
- [x] `robots.txt` 禁止的誘餌路徑被請求時，該位址在所有分類上停權 15 分鐘
- [x] 誘餌連結存在於 HTML 原始碼，但不進可及性樹、不進鍵盤順序（ticket 42 的可及性不得倒退）
- [x] `robots.txt` 對採集器整站 Disallow，並排除會爆炸成無限爬取空間的 facet URL 與會過期的 Stock Listing 頁

## 安全性

- [x] 全站安全性標頭：CSP、HSTS（僅 production）、nosniff、frame-ancestors、Referrer-Policy、Permissions-Policy、COOP／CORP
- [x] JSON-LD 逸出 `<`、`>`、`&` 與 U+2028／U+2029，`</script>` 無法從 Part 名稱或 Alias 逃出腳本區塊
- [x] 所有來自匯入資料的外部連結經過 `safeExternalUrl`，`javascript:` 與 `data:` 退化為純文字
- [x] 外部連結補上 `noopener` 與 `nofollow`
- [x] Google 與 LINE 登入在 CSP 之下仍然可用（`form-action` 明列兩個 provider）

## Comments

以 `next build && next start` 實測：瀏覽器 UA 取得 200 並帶齊標頭；`curl` 與 `python-requests` 取得 403；誘餌路徑取得 403 且 `Retry-After: 900`，同一來源接著請求 `/parts` 取得 429；連續 120 次 Catalog 請求得到 87 次 200、33 次 429；`/ja`、`/en`、根路徑語言偵測轉址與 `sitemap.xml` 均未受影響。

已知界線：流量限制狀態存在單一 instance 記憶體，冷啟動歸零，分散式抓取的實際上限較寬鬆。要再進一步需要外部 store（Neon 已在架構內），但那是另一張票。
