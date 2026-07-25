# 10 — 三語名稱與 alias 資料層 + 語言切換

**What to build:** 每支 Part 帶有官方英文、日文與台灣通行中文三種名稱，介面語言切換時名稱隨之改變。

**Blocked by:** 09

**Status:** ready-for-agent

落實 ADR-0005。

- [ ] Part 主鍵與網址 slug 採 TAKARA TOMY 官方英文名
- [ ] `name_ja`、`name_zh_tw` 齊備；中文取自台灣社群既有通行用語，非自創翻譯
- [ ] `aliases[]` 欄位就位，可收錄俗稱、簡稱、常見錯字、Hasbro 名稱與 Combo Style 名
- [ ] 列表頁僅顯示當前語言的名稱，版面不因多語而撐開
- [ ] 缺少某語言名稱時有明確的回退規則，不顯示空白
