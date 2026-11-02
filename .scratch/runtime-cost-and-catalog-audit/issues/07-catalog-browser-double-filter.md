# 07 — GenerationCatalogBrowser 重做一次頁面已經做完的篩選

Status: done（2026-11-02）

`/parts/page.tsx` 已依 query / 世代 / 系統 / 種類 / Part 種類篩好、排好序，`GenerationCatalogBrowser` 收到後又跑一次 `searchGenerationCatalog`（或同等的 filter）。目前兩邊結果一致（篩選是冪等的、保留順序），但規則寫在兩處，遲早會分歧。`/parts` 是這個元件唯一的使用者。

**做法：** 元件改成只負責分頁與渲染，篩選留在頁面；`generation-catalog-browser.test.tsx` 中測篩選的案例移到頁面層級的測試。

## 同族的既有 bug

跨世代搜尋模式下，元件的 `hrefFor` 用 `selectedGeneration`（預設 "x"）組分頁與系統連結，所以在「全部世代」搜尋結果裡點任何分頁，會悄悄縮回 X。與 01 同一類問題，篩選收歸頁面時一起修。

## 其他觀察（無需動作）

- `publishableCatalogRecords`（擋 `■` placeholder 名稱）與 `accepted && !needs_review` 在現有資料上都是 no-op（0 筆命中），但是有意義的防線，保留。
- ~~`parseFilterSortParams` 讀的 `?type=` 在 `/parts` 沒有任何作用~~ — 已移除（2026-11-02），`FilterSortState` 只剩 `sort` / `direction`。
- ~~`selectCatalogRecordsForPage` 在修正 01 之後只剩測試在用~~ — 已刪除（2026-11-02），測試改測 `searchGenerationCatalog`。
- 另外順手：`/mold-batches` 原本把含 provenance 的整份 Part 傳進 client，已改用 `getAllPartsForClient()`（2026-11-02）。
- `generation-catalog.json` 1.7 MB 中，非 X 世代佔 1,404 / 2,119 筆。是否要在一個「Beyblade X 查詢工具」裡保留是產品決定，不是技術問題。每筆重複的 `sourceUrl` / `sourceVersion`（beybrew 715 筆只有 2 個不同 URL、1 個版本）可以正規化到頂層 `sources[]`，但這是 provenance 格式變更，要另開 ADR 討論，不在這裡做。
- `scripts/smoke-public-journey.ts` 用 Node fetch（無瀏覽器 UA），被 middleware 歸為 unidentified client（¼ 額度），跑到 `/ja/meta` 就吃 429。與本次修改無關，但這支 smoke 目前在本機跑不完。

## 實作（2026-11-02）

- 新增 `src/lib/parts/catalog-view.ts`：`parseCatalogView`（讀網址一次）、`selectCatalogView`（列表與分頁計數池，皆已濾掉 placeholder 名稱）、`catalogViewQuery`（所有分頁／facet／排序／換頁連結的共同參數）。`/parts/page.tsx` 改用它，不再自己散落解析。
- `GenerationCatalogBrowser` 不再篩選：`records` 就是要顯示的清單，元件只負責分頁與渲染；分頁（tab）連結改由頁面提供的 `tabHrefFor` 產生。
- 修掉的 bug：
  - 跨世代搜尋時 tab 連結縮回 X，而且丟掉搜尋字。現在 tab 連結保留 `catalogGeneration=`（空值）、搜尋字與每頁筆數。
  - 單一世代內搜尋時 tab 連結也會丟掉搜尋字（tab 上的數字是搜尋命中數，點進去卻變成整個分類）。現在保留。
  - 跨世代搜尋時 X 的世代 chip 仍標為目前、仍顯示 X 的系統列。現在沒有世代 chip 被標為目前，系統列與相容性說明不顯示。
- 測試：篩選案例移到 `catalog-view.test.ts`（10 個）；元件測試改測「原樣顯示頁面給的清單」與跨世代的 chip／系統列／tab 連結。

**驗證：** 本機 `next start`：`/parts?catalogGeneration=&catalogKind=all&catalogQuery=dran` 所有 tab 連結皆保留跨世代與 `dran`；點 Blade（7）後 kicker 仍是 CATALOG / ALL、列出 7 筆。`/parts` 預設畫面（X、零件 295 筆、Stat 表格）不變；`x + cx + dran` 的 tab 連結保留系統與搜尋字。
