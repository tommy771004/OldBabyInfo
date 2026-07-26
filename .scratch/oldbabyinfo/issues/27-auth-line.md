# 27 — LINE 登入

**What to build:** 使用者能以 LINE 帳號登入，這是台灣玩家與家長最普及的登入方式。

**Blocked by:** 26

**Status:** ready-for-agent

- [ ] LINE Login channel 設定完成，回呼網址在正式與預覽環境皆可運作
- [ ] 同一人以 Google 與 LINE 登入時的帳號歸屬有明確處理，不產生重複身分
- [x] 登入選項的呈現不使用填色按鈕搭配外框按鈕的組合
- [x] 取用的個資範圍最小化，並於登入畫面說明取用項目

## Comments

LINE custom OAuth provider、最小 `openid` profile scope、登入選項與隱私說明已完成並通過
typecheck／build。LINE channel callback 與 Google／LINE account linking 需要真實 provider
設定與資料庫 adapter，目前未宣稱已完成。
