# 08 — 首頁開發模式 hydration mismatch

Status: needs-triage
Type: research
Priority: P3

## 觀察（已確認 2026-09-13，`../probe/shoot.mjs` console 收集）

`/` 在 1440 與 390 都印出「A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.」；`/parts`、`/combo`、`/events` 沒有。

## 未做

沒有追出是哪個屬性。候選：`battle-search.tsx` 用到 `useId`／隨機 id、或 `page.tsx` 的 Marquee 節點重複。先在瀏覽器 devtools 看 React 印出的 diff 再開修票，不在這裡猜。

## Comments

（無）
