# 15 — Discussion、Login、Terms 支援路由改版

**What to build:** 使用者在 Discussion、Login 與 Terms 路由中仍感受到同一個 OldBabyInfo 產品，且既有任務保持清楚可用。

**Blocked by:** 01 — 首頁對戰搜尋與視覺基座

**Status:** in-progress

- [x] Discussion 仍以 Part、Combo 或 Event Subject 為脈絡，不建立無主題論壇
- [x] Discussion feed、空狀態與作者資訊沿用整站資訊層級
- [x] Login 的可用 provider、錯誤與返回路徑清楚，不增加未決定的新身份功能
- [x] Terms 清楚說明非官方、非商業、來源、Publication Rights 與外部購買邊界
- [x] 三個路由沿用同一色彩、字體、導覽與 focus 語言
- [x] 不加入假控制、假社交證明或與任務無關的 CTA
- [ ] 鍵盤、三語與窄螢幕行為都有外部可見測試

## Progress

- Existing routes keep Discussion attached to Subject, expose only configured authentication providers, and explain source, rights and purchase boundaries in Terms. Their CSS modules use the shared warm palette, typography and focus treatment.
- `SiteHeader` now lives in the locale layout, so Discussion, Login, Terms and the other public data routes share the same primary navigation instead of only the homepage rendering it. The public HTML contract checks all five navigation destinations.
- `discussion-feed.test.tsx` verifies filtering and the return-to-subject link. The remaining external browser verification item is not claimed because the browser connector is unavailable.
- The server-rendered Part journey smoke now runs against all three locales and confirms the Discussion empty-state heading is present; it does not replace the missing real keyboard and narrow-viewport browser pass.
