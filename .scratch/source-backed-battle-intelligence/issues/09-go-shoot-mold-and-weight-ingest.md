# 09 — Go-Shoot Mold Batch 與重量觀察

**What to build:** 使用者可在正確 Part 下查看 Go-Shoot 發現的批次碼、重量與策略觀察，且不會將物理公差誤認成官方 Stat Edition。

**Blocked by:** 02 — 單一 Part Assessment tracer

**Status:** in-progress

- [x] 可定位的批次碼與重量觀察附著到正確 Part
- [x] Mold Batch 與 Stat Edition 使用不同資料欄位與 UI 名稱
- [x] 策略判斷保存為 Assessment，不覆蓋官方 Stat
- [x] 保留 Source Excerpt、Discovery Source、時間與 Attribution Status
- [x] 無法可靠匹配 Part 的資料進入 Needs Review
- [x] 未取得 Publication Rights 時不鏡像全文
- [ ] 每週排程與手動觸發只在取得方式符合來源條款時啟用
- [x] fixture 測試涵蓋批次格式、重量範圍、Part 匹配與衝突

## Progress

- Mold Batch candidates now support an optional measured weight range and Source Excerpt; Part records have separate optional physical-observation fields and never reuse Stat Edition fields.
- Exact Part matching still sends unknown names to the `unmatched`/Needs Review bucket, while strategy remains an Assessment kind.
- The recurring Go-Shoot acquisition workflow remains disabled until the source-compliant acquisition method and rights metadata are recorded; no unverified batch or weight is added to the static dataset.
