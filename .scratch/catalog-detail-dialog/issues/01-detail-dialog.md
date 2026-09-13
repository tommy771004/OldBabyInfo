# 01 — 圖鑑詳情改為彈窗

**What to build:** `/parts` 每一列點下去在列表上開彈窗；同一網址直接打開仍是完整頁。見 `../spec.md`。

**Status:** done（2026-09-13）

- [x] `parts/layout.tsx` 加 `modal` slot；`@modal/default.tsx`、`@modal/[...catchAll]/page.tsx` 回 null
- [x] `@modal/(.)[slug]/page.tsx`、`@modal/(.)catalog/[id]/page.tsx`
- [x] `PartDetailCore`（`[slug]/part-detail-body.tsx`）與 `GenerationCatalogRecordBody`（`catalog/[id]/record-body.tsx`）抽成頁面與彈窗共用，`variant="dialog"`
- [x] `components/detail-dialog.tsx` + `.module.css`；`CloseIcon` 加進 `ui-icons.tsx`；`body:has(dialog[open])` 鎖捲動放 `globals.css`（CSS Modules 不收沒有 local class 的 selector）
- [x] 卡片格與 `CatalogRecordDetails` 的 `<a>` 改 `next/link`，讓攔截路由看得到 soft navigation
- [x] `PartDetailPage.dialog_close`、`dialog_full_page` 三語系
- [x] `detail-dialog.test.tsx`；全套 790 tests、eslint、tsc、`next build` 綠燈；Playwright 實測見 spec 驗收段
- [x] 移除來源判斷分頁（見 spec 末段）

## Comments

- catalog Part record 的標題原本印 `record.name`（"Dran Sword"），與相關列表用的本地化名稱不一致；`record-body.tsx` 現在同一條規則：有 projection 就用 `localizedNameOf(legacyPart)`。完整頁一併受惠。
- `next build` 會覆寫 `.next`，跟 dev server 共用；跑完 build 後 dev server 必須重啟，否則 500（`Cannot find module './5611.js'`）。
