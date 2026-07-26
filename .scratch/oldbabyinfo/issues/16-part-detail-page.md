# 16 — Part 詳情頁

**What to build:** 使用者點進單一零件，看到完整資訊：三語名稱、四項 Stat、官方產品圖，以及後續討論的掛載位置。

**Blocked by:** 10, 13

**Status:** done

- [x] 三語名稱並列——這是全站唯一並列三語的地方
- [x] Stat 完整呈現（依真實資料是 3 或 5 項，見 Comments），數值使用 06 選定的字體
- [x] 官方產品圖僅於此頁出現，並標註版權歸屬與免責聲明
- [x] 顯示 `aliases[]` 中的玩家俗稱，讓使用者確認找到的是同一支
- [x] 頁面預留 Thread 區塊的位置，該區塊本身由 28 實作
- [x] 網址採官方英文名 slug，可分享

## Comments

**2026-07-26 資訊層級更新：** Part 詳情頁固定依序呈現：
1. Part 名稱、真實產品圖／剪影、官方 Stat、Mode。
2. Assessment：Tier、推薦 Combo、打法與來源分歧。
3. Mold Batch／重量觀察。
4. 哪裡買與抓取時間。
5. 討論。

這個順序讓 Field Authority 的官方事實先建立基線，再呈現可互相衝突的社群判斷；Assessment
不得在視覺上冒充官方 Stat。Assessment 使用真正的分頁清單，使用者可選每頁
5／10／15／20 則，預設每頁 10 則，不使用「只顯示三則再展開」的截斷方式。頁碼與每頁筆數
寫入 `assessmentPage`／`assessmentSize` URL query，確保重新整理、返回與分享都保留同一狀態。

**「四項 Stat」跟實際資料對不上，照真實資料實作。** 票面寫「四項 Stat」，但 ADR-0007（比這張
票晚寫定案）已經確立 Blade／Ratchet 是 3 項（Attack/Defense/Stamina），只有 Bit 是 5 項
（多 X-Dash／Burst Resistance）——資料庫裡從來不存在「四項」這個形狀。這是票面文字寫在
ADR-0007 定案之前留下的過時敘述，不是新發現，直接照 schema.ts 真實的 stat 結構實作（3 或 5
項，依零件類型），不勉強湊出四項假資料。

**官方產品圖：真的接上了這次搜集到的真實圖片資料。** 寫了 `scripts/generate-part-images.ts`，
用跟票 14 研究階段同一個真實資料來源（`beybrew` 的 `image-urls.json`，一個社群維護、公開的
圖床索引）比對出 168 個零件中 147 個（87.5%）的真實官方圖網址——採「hotlink 不下載」策略：
只把網址存進 `data/part-images.json`，不把圖片二進位檔複製進這個 repo。這是刻意的版權判斷：
這些是 TAKARA TOMY 的官方產品攝影，不是我們的資產，複製一份自己host風險比直接連到（同一個
社群專案本來就公開在用的）既有網址更大。詳情頁因此加上票面本來就要求的版權標註／免責聲明
（"Product image copyright belongs to TAKARA TOMY..."），三語都有對應翻譯。21 個零件目前
沒有真實圖可配對（比對邏輯抓不到對應 key），詳情頁對這些顯示「尚無產品圖」文字，不是破圖。

**修正一個真實的圖片變形 bug：** 第一版把 `<Image width={400} height={400}>` 寫死成正方形，
但抓下 Scorpio Spear 的真實圖片後量出原始尺寸是 358×339（不是正方形，長寬比約 1.056）——
寫死正方形會把圖片其中一軸拉伸約 5.6%，一個真實但容易被忽略的失真。修正方式是在
`generate-part-images.ts` 生成階段就用 `sharp` 量出每張圖片自己真實的原始尺寸並存進
`data/part-images.json`，`<Image>` 改用這組真實尺寸（外加 `maxWidth: 400` 限制顯示大小但
保持比例）。用 Playwright 量出實際渲染後的圖片方框尺寸（358×339）跟真實原始尺寸完全吻合，
確認沒有變形。

**網址 slug：** 新增 `slugify()`（`src/lib/parts/slug.ts`），把官方英文名轉成小寫連字號
格式（如 "Lightning L-Drago" → "lightning-l-drago"）。實測跑過全部 168 個零件確認 slug
彼此不衝突，不需要額外加零件類型當區分前綴。`/parts` 列表的零件名稱現在是可點擊連結，直接
連到 `/parts/[slug]`。

**Thread 區塊：** 純預留位置（標題＋「討論功能即將推出」文字），不做任何功能，票 28 才是
真正實作討論功能的地方。

**測試：** `slug.test.ts` 涵蓋雙詞／含標點／單詞 camelCase／前後贅字連字號四種真實命名情境。

**Pipeline：** `npm run typecheck`、`npm run lint`、`npx vitest run`（134/134）、
`npm run build` 全數通過（含 504 個新的靜態詳情頁：168 零件 × 3 語言）；`next start` 起
正式伺服器後截圖驗證 Blade／Ratchet／Bit 三種零件類型的詳情頁、英文版排版、404 情境
（`/parts/not-a-real-part` 正確回 404）、圖片未變形。
