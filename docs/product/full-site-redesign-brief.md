# OldBabyInfo 整站改版 Brief

## 核心任務

讓台灣 Beyblade X 玩家能在最短時間內：

1. 用中文、日文、英文、Alias 或 Combo Style 找到 Part／Combo。
2. 先確認官方 Stat 與 Mode，再閱讀彼此可能衝突的社群 Assessment。
3. 查看 Mold Batch、重量、購買快照、Event 與討論。

整站的情緒是戰鬥熱血，但資訊閱讀必須保持安定、精準與長時間可用。

## 視覺世界

- 主背景：暖黑與深鐵色。
- 閱讀面：由同一色階推導的陶土淺色。
- 微電流：低飽和銅白。
- 每支 Part 的真實代表色只出現在剪影、軌跡或數值變化。
- 不使用藍紫漸層、霓虹 glow、彩色粒子、背景 radial halo 或全頁固定網格。
- 中文大標題：Taipei Sans TC Bold。
- 英文、Part 代號與大數字：Combat。
- 內文：Taipei Sans TC Regular。
- Iansui 只用於少量玩家原話。

## Signature

首頁主視覺是資料驅動的 Xtreme Stadium 對戰分析。兩支真實 Part／Combo 的剪影、旋轉、碰撞、軌跡與失速受官方 Stat 影響；碰撞時才出現短暫銅白微電流。使用者搜尋或切換 Combo 後，競技場直接重算，不另放一組制式 CTA。

`prefers-reduced-motion` 下保留完整靜態分析：兩支剪影、軌跡、碰撞點、勝負因素與 Stat 差異都可閱讀。

## 全站資訊架構

| 路由／區域 | 第一任務 | 主要呈現 |
| --- | --- | --- |
| 首頁 | 跨語言搜尋 Part／Combo | 競技場對戰分析與搜尋結果 |
| Parts | 找到與篩選 Part | 高密度可掃描列表，不使用卡片牆 |
| Part 詳情 | 從官方資料走到社群判斷 | 固定五段資訊順序 |
| Compare | 對齊多支 Part 的差異 | 共用水平基線的比較表 |
| Combo Builder | 組裝並理解數值變化 | Blade／Ratchet／Bit 選擇與即時差值 |
| Meta | 查看 Event 統計 | 樣本數、期間、使用率與名次 |
| Events | 找近期賽事 | 日期優先的清單／日程 |
| Mold Batch | 查批次與重量觀察 | 批號輸入、匹配與來源片段 |
| Assessment／Source | 閱讀來源意見與全文 | 分歧並列、歸屬與授權 |
| Where to Buy | 看通路快照 | 價格、庫存、通路與抓取時間 |
| Discussion | 閱讀附著於資料的討論 | Subject 導向的討論流 |
| Login／Terms | 完成帳號與規則任務 | 低干擾、同一視覺語言 |

`styleguide`、`color-demo`、`stadium-demo` 只作內部 QA。

## Part 詳情固定順序

1. Part 名稱、真實產品圖／剪影、官方 Stat、Mode。
2. Assessment：Tier、推薦 Combo、打法與來源分歧。
3. Mold Batch／重量觀察。
4. 哪裡買與抓取時間。
5. 討論。

Assessment 全部列出，不分頁（2026-09-13 移除：資料集只有個位數筆，分頁控制項從未有第二頁可翻）。

## 動效與互動

- 內容預設可見，任何動效失敗都不能造成空白區塊。
- 微電流只回應 hover、鍵盤 focus、Combo Stat 變化、競技場捲動與碰撞。
- 按鈕不位移、不放大、不帶 glow；hover 以色值、材質或圖示位移回應。
- 不使用入口 opacity 0、漂浮卡片、hover lift、成長底線或脈衝狀態點。
- 競技場運動由真實資料和使用者操作驅動，不做無目的自動循環。
- 所有互動支援鍵盤與 `prefers-reduced-motion`。

## 響應式

- Desktop 首屏尺寸以 1440 × 1024 為主要視覺探索基準。
- Mobile 不是縮小桌面版。搜尋、Part 重點與主要 Stat 先出現，來源與長清單後移。
- 比較頁在窄螢幕保留欄位對齊，可水平瀏覽；不得讓不同欄位因文字長度錯位。
- 一般內文維持可讀行長，所有裁切、固定高度與自訂輪廓都要逐邊檢查文字完整性。

## 上線前 QA

1. 三語路由與跨語言搜尋。
2. 主要操作皆可真實點擊，沒有死按鈕、假 tab 或假篩選器。
3. 深／淺表面文字對比與鍵盤 focus。
4. 320、390、768、1024、1440 寬度下無溢出、裁字或錯位。
5. `prefers-reduced-motion` 下資訊完整。
6. 真實產品圖維持原始比例；缺圖時用既有 Part 剪影，不做假資產。
7. 逐條執行全域 anti-slop 設計法（`~/.claude/CLAUDE.md`，每個 session 自動載入；不在本 repo 內）的 re-check，並讓 `src/lib/design/anti-slop-contract.test.ts` 全綠，修正後才能結案。
