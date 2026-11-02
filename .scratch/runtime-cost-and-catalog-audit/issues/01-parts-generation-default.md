# 01 — /parts 少了 catalogGeneration 就跨世代

Status: done（2026-11-02）

**Bug：** `searchAcrossGenerations = hasCatalogSearchParams && !hasCatalogGeneration`。任何帶篩選但沒帶 `catalogGeneration` 的網址（`?catalogKind=part`、`?catalogPartType=blade`、`?catalogSystem=bx`）都會悄悄變成四個世代一起列：`?catalogKind=part` 列出 1,425 筆、44 個分頁，改用卡片格而不是 Stat 表格，連結從 `/parts/<slug>` 變成 `/parts/catalog/<id>`，但 kicker 仍寫 `CATALOG / X`。`/parts` 與 `/parts?catalogKind=part` 本該是同一頁。

另外 `selectedKind` 的預設值 `"part"` 只在渲染時才套用，伺服器端的篩選、facet、排序都用 `undefined`（全種類）算。

**修正：**
- 只有明確的空字串 `catalogGeneration=`（搜尋表單的「全部」選項）才跨世代；沒帶 = 預設世代。
- `selectedKind` 在頁首解析一次（`?? "part"`），清單、分頁列、facet、排序都看同一個值。
- 兩條分支（search / select）合併成同一次 `searchGenerationCatalog` 呼叫。
- kicker 跨世代時顯示 `CATALOG / ALL`，`metal_fight` 顯示為 `METAL FIGHT`。

**行為改變：** 手打的 `/parts?catalogQuery=蒼龍`（沒有 `catalogGeneration`）現在只搜 X。表單永遠會送 `catalogGeneration`，所以從頁面操作不受影響。
