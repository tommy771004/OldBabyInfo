# 10 — BeybladeHub 權限閘門匯入

**What to build:** 維護者可匯入已取得相容權利的 BeybladeHub 資料，同時確保自動大量抓取在未獲許可時不會啟動。

**Blocked by:** 02 — 單一 Part Assessment tracer

**Status:** done

- [x] 預設沒有 BeybladeHub 自動大量抓取排程
- [x] 匯入必須帶取得方式、授權／許可與 capture metadata
- [x] 權利不明的輸入拒絕全文，只允許另行判定的合法結構化事實
- [x] Tier、推薦與打法只形成 Assessment，不覆蓋官方資料
- [x] BeybladeHub 保持 Discovery Source 身分
- [x] 權限閘門有允許與拒絕的外部行為測試
- [x] 拒絕匯入不改動上一份成功資料

## Evidence

- `src/lib/source-permission/gate.ts` requires acquisition method, rights state, capture time and canonical URL. Automated mass fetching is rejected without explicit compatible permission; manual unknown-rights input is structured-only.
- Full text remains governed by `src/lib/source-documents/publication.ts`; the source is never promoted to official Field Authority and remains a Discovery Source for Assessment.
- `src/lib/source-permission/gate.test.ts` covers automated rejection, manual structured-only import, documented permission and denied-rights retention.
- No BeybladeHub automated workflow was added.
