# 14 — Mold Batch 與 Where to Buy 工作流改版

**What to build:** 使用者能查詢 Mold Batch 並接續查看通路快照，兩者都保持來源與時間脈絡。

**Blocked by:** 01 — 首頁對戰搜尋與視覺基座；06 — Funbox 每日 Stock Listing；09 — Go-Shoot Mold Batch 與重量觀察

**Status:** in-progress

- [x] Mold Batch 查詢可輸入批次碼並顯示匹配 Part、重量觀察與來源片段
- [x] Mold Batch 結果不使用官方 Stat Edition 的命名或視覺層級
- [x] Where to Buy 顯示商品、價格、庫存、通路與 captured time
- [x] 不顯示推測性 stale 標記
- [x] 查無批次、無 listing、載入中與資料庫不可用都有明確狀態
- [x] 外部通路連結的名稱與目的清楚
- [ ] 兩個工作流在手機與鍵盤操作下完整可用
- [x] 測試涵蓋成功、無匹配、空結果、來源失敗與外部連結

## Progress

- Mold Batch lookup uses exact batch-code matching, and Part records now have separate optional weight and Source Excerpt fields. Unknown matches remain an explicit empty/needs-review state.
- Where to Buy renders product, price, availability, retailer, captured time and direct external link; stale inference is absent and failure/empty states are tested.
- Mold Batch empty and matched results are now announced through a status region, while the public search result list exposes its expanded state and relationship to the input for keyboard and assistive-technology users.
- The shared public HTTP smoke now verifies that the Mold Batch and Where to Buy routes retain a `main`／`h1` landmark, labelled controls and explicit button types in their server-rendered HTML.
- Full browser breakpoint verification remains open because the browser connector is unavailable; no claim is made for that unchecked item.
