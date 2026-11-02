# Vercel Fluid Active CPU 偏高 + 圖鑑（/parts）邏輯稽核

**起因（2026-11-02）：** 站方發現 Fluid Active CPU 偏高，問「不是都用 JSON 檔嗎？」。

## 結論

資料是靜態 JSON，但**頁面不是靜態的**。本機 `next start` 量到的 cache-control：

| 路由 | 為什麼每次請求都重新渲染 |
| --- | --- |
| `/`、`/parts/[slug]`、`/parts/[slug]/where-to-buy`、`/discussion`、`/login` | `export const dynamic = "force-dynamic"`（讀 Neon：推廣版位、討論串、庫存） |
| `/parts`、`/events`、`/combo`、`/parts/compare` | `await searchParams` |
| `/meta`、`/guides`、`/mold-batches` | 靜態，`s-maxage=31536000`，CDN HIT |

`next build` 表格裡的 ● 對 searchParams 頁面是誤導，實際回應是 `private, no-cache, no-store`。

量測（本機 production build，暖機後）：

| | 修正前 | 修正後 |
| --- | --- | --- |
| `/parts` | 55 ms | 13–15 ms |
| `/parts?sort=attack&dir=desc` | 115 ms | 12–14 ms |
| `/` HTML | 387 KB | 213 KB |
| `/combo` HTML | 279 KB | 112 KB（含 08 的場地標記 1.9 KB） |
| `/parts/compare` HTML | 278 KB | 111 KB |

（最終數字是 08 完成後重新 `next build` + `next start` 量的。）

不是主因的（量過）：
- Link prefetch：每頁約 10 個 `_rsc` 請求，但每個只花約 3 ms、回 150–2000 B。
- 冷啟動 zod 驗證：`generation-catalog.json` 15 ms、needs-review 1 ms。
- Middleware 跑在 Edge，不算 Fluid CPU。

**本機無法確認的：** 線上哪條路由佔最多 CPU。要看 Vercel → Observability → Functions，依 CPU time 排序。

## Issues

見 `issues/`。01–08 全部完成（05 = ISR 300 秒、06 = 選項 A，2026-11-02 站方決定）。
