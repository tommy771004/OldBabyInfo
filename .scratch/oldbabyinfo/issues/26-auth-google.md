# 26 — Auth.js + Google 登入

**What to build:** 使用者能以 Google 帳號登入與登出，並在介面上看到自己已登入的身分。

**Blocked by:** 02

**Status:** ready-for-agent

本站不自建帳號密碼——保管他人密碼是一人維護的專案不該承擔的負債。

- [ ] Auth.js v5 接上 Google OAuth，可完成登入與登出
- [ ] 使用者資料表就位，僅保存必要欄位
- [ ] 登入狀態於三語路由間皆維持
- [x] 未登入者可完整瀏覽所有查詢功能，登入僅為參與討論所需
- [x] 憑證取自環境變數，未進入版本控制

## Comments

Auth.js v5 beta scaffold、Google provider、session route、登入／登出頁與 `.env.example` 已
完成；未設定環境變數時仍可公開瀏覽，且頁面會明確說明尚未設定。`app_users` schema 已在
discussion migration 中準備好。真實 Google OAuth callback、跨環境 cookie 與遠端 migration
仍需維護者提供 credentials／部署環境後驗證，因此前 3 項維持未勾選。
