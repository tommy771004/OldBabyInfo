# 01 — 首頁對戰搜尋與視覺基座

**What to build:** 使用者一進首頁即可跨語言選擇兩個 Part／Combo，並在獲批准的徑向競技場介面中看到資料驅動的對戰分析。

**Blocked by:** None — can start immediately

**Status:** done

- [x] 中文、日文、英文、Alias 與 Combo Style 都能找到正確 Subject
- [x] 選擇兩個 Subject 後，真實產品圖／剪影、官方 Stat 與競技場分析同步更新
- [x] 採用第 3 個視覺方向的徑向比較、暖鐵競技場與陶土閱讀面
- [x] 移除概念圖中的 pill、裝飾線、過度邊框與制式 CTA
- [x] 微電流只在碰撞或操作回饋時短暫出現，不使用 glow 或粒子
- [x] reduced-motion 顯示資訊完整的靜態分析
- [x] 搜尋、結果選擇、導覽與語言切換可用鍵盤操作
- [x] 公開使用者旅程測試涵蓋搜尋、選擇與靜態 motion fallback

## Evidence

- `src/components/battle-search.test.tsx`: 3 public-component journey tests cover localized names, alias search, assembled Combo search, selection, stats, and Japanese query matching.
- `npm test -- --run`: 50 files, 259 tests passed.
- `npm run lint`, `npm run typecheck`, and `npm run build`: all passed; build generated 555 static pages.
- Local public-page verification covered English and Chinese names, Alias, Combo `Dran Sword 3-60F`, real product images, keyboard-selectable results, 390px no-horizontal-overflow, and reduced-motion static analysis.
