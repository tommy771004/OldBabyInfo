# 11 — Part 詳情五段完整旅程

**What to build:** 使用者在單一 Part 頁依固定順序完成從官方事實、社群判斷、物理觀察、購買到 Discussion 的完整旅程。

**Blocked by:** 01 — 首頁對戰搜尋與視覺基座；03 — Assessment 分歧與 URL 分頁；04 — Publication Rights 與 Source Document；06 — Funbox 每日 Stock Listing；08 — HackMD Assessment 匯入；09 — Go-Shoot Mold Batch 與重量觀察

**Status:** in-progress

- [x] 第一段呈現 Part 名稱、真實產品圖／剪影、官方 Stat 與 Mode
- [x] 第二段呈現 Assessment 的 Tier、推薦 Combo、打法與來源分歧
- [x] 第三段呈現 Mold Batch 與重量觀察
- [x] 第四段呈現 Stock Listing 與抓取時間
- [x] 第五段呈現附著於 Part Subject 的 Discussion
- [x] Assessment 的版型與語氣不會冒充官方 Stat
- [x] 真實產品圖保持原始比例，缺圖不顯示破圖或假資產
- [x] 手機版優先顯示 Part 身分與官方 Stat
- [ ] Playwright 旅程涵蓋五段順序、分頁、來源連結與空狀態

## Evidence

- `src/app/[locale]/parts/[slug]/page.tsx` now renders the fixed five-stage order: official identity/facts, source assessments, physical observations, Stock Listing, then Subject Discussion.
- `splitAssessmentsByStage()` keeps Tier/Combo/tactic separate from weight/Mold Batch observations; the Part page keeps the Assessment pagination only on the strategic list.
- The page uses the repository image when available and a tested silhouette fallback when not, preserving image dimensions and avoiding invented assets.
- `part-detail.module.css` prioritizes identity and official facts on narrow screens, while Stock Listing remains a direct retailer snapshot with captured time.
- The remaining unchecked item is the browser-backed public journey; the local browser connector is unavailable in this environment, so it is not claimed as verified.
