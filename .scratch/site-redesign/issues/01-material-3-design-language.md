# 01 — 整站改用 Material 3 設計語言（配色不變）

Status: resolved
Type: task

站方指示：「配色不變之外，用 Material 3 的設計語言來重新設計 UI／UX。」

決策記錄在 [ADR-0014](../../../docs/adr/0014-material-3-as-the-design-language.md)。

## 做了什麼

- `src/styles/m3.css` — M3 system token（色彩角色、type scale、shape、state layer、motion、tonal elevation）。全部由 `colors.css` 既有 token 推導，沒有新色碼。兩個 scheme：`:root` 場邊、`.m3-dark` 場上（子樹 class，因為首頁要在同一畫面裡走完兩端）。
- `src/styles/m3-components.css` — 手寫的 M3 元件層：button 五種、icon button、chip、card 三種、text field／select（真正的浮動 label）、search bar、tabs、list item、divider、badge、top app bar、compact select。
- 全部公開路由改用這些角色與元件：首頁、Parts、Part 詳情、Compare、Combo Builder、Meta、Events、Mold Batch、Where to Buy、Discussion、Guides、Login、Terms、catalog 記錄頁。
- Shell：top app bar（置頂、不透明）＋ 手機浮動導覽膠囊（M3 active indicator、state layer、label-visibility: selected）。
- `/styleguide` 加上整組元件的雙打光渲染，作為內部驗收面。
- `anti-slop-contract.test.ts` 擴充：把 `src/styles/*.css` 納入掃描，並把每一組 M3 文字配對與 outline 配對的實測對比度寫成斷言。

## 順帶修掉（都有量測）

- 中文標題實際上沒有用到 Taipei Sans TC Bold，掉到系統明體（違反 ADR-0006）。
- 字型子集缺 18 個常用字，且從未包含 `content/guides/**`。已補來源並重新產生（113KB → 約 205KB／weight）。
- 進場動畫用 `opacity: 0` 藏內容，第一屏以下在未捲動時 computed opacity 為 0（列印／截圖為空白）。改為只動位移。

## 驗收

- `npm run typecheck` / `npm run lint` / `npm test` 全綠。
- 1440 與 390 兩種寬度逐頁截圖檢視。
- `npm run build` 通過（6995 個靜態頁）。
- `npm run audit:ui`（18 項）與 `npm run check:ui-interactions`（15 項）全綠。兩支腳本是這次新加的，把「綠燈不等於做完」那條規則裡可以機器檢查的部分固定下來：置中、觸控目標、橫向溢位、平行欄位對齊、邊界留白，以及每一個控制項真的被點過。

## Comments

（無）
