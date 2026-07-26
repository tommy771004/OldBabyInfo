# 04 — Publication Rights 與 Source Document

**What to build:** 使用者可閱讀具公開權利的來源全文；沒有 Publication Rights 的輸入只能留下合法的結構化事實、必要短片段與原文連結。

**Blocked by:** 02 — 單一 Part Assessment tracer

**Status:** done

- [x] Source Document 記錄標題、發布者、發布／抓取時間、canonical URL 與完整內容
- [x] 每份 Source Document 記錄授權名稱、授權頁面或明確許可證明
- [x] 缺少 Publication Rights 時拒絕發布全文
- [x] 全文被拒絕時，合法的結構化事實與必要短片段可獨立處理
- [x] Assessment 可連回 Source Document 或 Discovery Source
- [x] Source Document 頁清楚顯示授權、原文連結與抓取時間
- [x] 權利撤回時可移除全文而不破壞其他領域資料
- [x] 測試涵蓋允許、拒絕與撤回三種公開行為

## Evidence

- `src/lib/source-documents/schema.ts` defines the auditable document fields and deterministic unique IDs; `data/source-documents.json` is intentionally empty until a source has compatible rights, so no full text is fabricated or mirrored.
- `publishSourceDocument()` accepts a license name plus license URL or explicit permission evidence, and rejects missing rights before schema publication. `revokeSourceDocument()` removes only the document collection entry; Assessment records remain in `data/assessments.json`.
- `src/app/[locale]/sources/[id]/page.tsx` displays the authorized document's publisher, publication/capture times, license, original URL and content.
- `src/lib/source-documents/publication.test.ts` covers allowed, rejected and revoked behavior; repository tests verify the empty safe baseline.
