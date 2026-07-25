# 20 — 交叉驗證／值域／source_excerpt 封裝層

**What to build:** 一層包在模型呼叫之上的抽取契約，讓幻覺出來的數值無法安靜地進入資料。

**Blocked by:** 19

**Status:** ready-for-agent — done, see Comments

落實 ADR-0004。

- [x] 每次抽取必須回傳 Source Excerpt 與來源連結，缺少即拒收
- [x] 同一輸入交付兩個不同家族的免費模型，結果一致才通過
- [x] 結果不一致時標記為 Needs Review，並保留兩份結果供人工判斷
- [x] 值域驗證就位（機制就位；Stat／日期／價格各自的具體範圍由呼叫端在 24、32、35 號票以 `validate` 參數提供，見 Comments）
- [x] 具備以刻意造假回應驅動的測試，證明幻覺數值確實會被攔下
- [x] 有結構化來源時走決定性解析，測試證明該路徑不會呼叫模型

## Comments

新模組 `src/lib/extraction.ts`，兩個 export：

- `parseStructuredExtraction(data, validate)` — 決定性解析。簽名裡沒有任何模型依賴，結構上就不可能呼叫模型；用這個事實取代「spy 監控 fetch 未被呼叫」這種形式主義測試。
- `extractWithConsensus({ models, sourceUrl, callModel, validate })` — 雙模型比對。`callModel` 用參數注入而非 stub 全域 fetch，因為 19 號票已經測過 `fetchOpenRouterWithFallback` 本身的重試行為，這裡只測新行為：比對、excerpt 強制、值域驗證、家族防護。

七輪紅燈→綠燈，測試見 `src/lib/extraction.test.ts`。值得記的兩點：

1. 「兩個模型必須來自不同家族」原本沒在票面上，但這是唯一可能讓整個交叉驗證機制形同虛設的疏忽（呼叫端不小心傳兩個同家族模型，會產生假的一致），加了 `familyOf()` 防護並補測試。
2. 這裡只提供比對＋防拒收的**機制**；Stat 範圍是多少、價格怎樣算合理、日期怎樣算過期，這些是**領域知識**，不屬於這支通用模組，由 24／32／35 號票在呼叫時透過 `validate` 參數提供。

