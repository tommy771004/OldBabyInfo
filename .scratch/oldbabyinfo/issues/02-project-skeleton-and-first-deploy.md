# 02 — 專案骨架與首次部署

**What to build:** 一個空但真的上線的網站——訪客能開啟網址、在 zh-TW／ja／en 三種語言路由間切換，每種語言都渲染出屬於自己的頁面。

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [x] Next.js 15 App Router + TypeScript + Tailwind v4 專案可在本機啟動
- [x] next-intl 路由運作，`/`、`/ja`、`/en` 各自渲染且語言切換器可用
- [x] 部署至 Vercel，正式網址可開啟——部署狀態沿用 01 號票的使用者確認
- [x] Lint 與 type-check 在 CI 中通過
- [x] 尚未引入任何 UI 元件庫的預設樣式——版面是空的，但沒有任何預設外觀殘留

## Comments

本次回歸：`npm run lint`、`npm run typecheck`、`npm test`（256/256）與
`npm run build` 全部通過；build 產出 `/zh-TW`、`/ja`、`/en` 與條款頁等三語路由。
