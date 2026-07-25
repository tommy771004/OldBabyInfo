# 24 — 慢資料 → repo JSON 寫入器

**What to build:** 一支可在本機執行的程式，把抓取與抽取的結果寫成 repo 內的 JSON，產生人類可讀的差異。

**Blocked by:** 09, 20

**Status:** ready-for-agent

- [ ] 輸出格式穩定：欄位順序固定、縮排一致，使差異只反映真實變動
- [ ] 每筆新增或修改的欄位帶有 Source Excerpt 與來源連結
- [ ] 標記為 Needs Review 的項目在輸出中可被明確辨識
- [ ] 寫入前執行 schema 與值域驗證，未通過即中止且不寫入
- [ ] 具備 dry-run 模式，可先檢視將產生的差異
- [ ] 批次呼叫時有速率控制，不會在 Actions 中打爆免費額度（延自 19 號票，見該票 Comments；此票是真正迴圈呼叫 20 號票處理多筆 Part／Event 的地方，此時已有真實呼叫模式可據以設計）
