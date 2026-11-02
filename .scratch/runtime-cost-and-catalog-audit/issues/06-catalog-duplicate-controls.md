# 06 — 圖鑑的世代／系統各有兩組控制項

Status: done（2026-11-02，站方選 A）

`/parts` 上同一個參數有兩個控制項：
- 「迭代」下拉選單 ＋ 世代 chip 列（Original Generation / Metal Fight / Burst / X）都寫 `catalogGeneration`。
- 「系統」下拉選單 ＋ 系統 chip 列（全部 / Shared / BX / UX / CX）都寫 `catalogSystem`。

下拉選單的「全部」是唯一能跨世代搜尋的入口，所以不能直接拿掉「迭代」。

**選項：**
- A：拿掉「系統」下拉（chip 已涵蓋），「迭代」下拉改成「搜尋範圍：本世代 / 全部世代」。
- B：兩個下拉都拿掉，搜尋框旁加一個「搜尋全部世代」切換；世代與系統只用 chip。
- C：維持現狀。

## 實作（選項 A）

- 拿掉「系統」下拉；系統只由 chip 列決定。
- 「迭代」下拉改成「搜尋範圍」：本世代（值 = 目前世代）／全部世代（值 = 空字串）。三語系文案：搜尋範圍・本世代・全部世代／検索範囲・この世代・全世代／Search scope・This generation・All generations。
- 本世代搜尋時以 hidden input 保留目前的 `catalogSystem`；全部世代搜尋不送系統，頁面也忽略它（系統是 X 世代內的概念）。
- 測試：`generation-catalog-browser.test.tsx` 改測範圍選項，以及 hidden 系統只在單一世代時出現。
