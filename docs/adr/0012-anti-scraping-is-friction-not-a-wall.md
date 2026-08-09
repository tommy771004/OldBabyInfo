# 反爬蟲是摩擦力，不是牆

OldBabyInfo 最難被複製的資產是 Alias 與逐筆標注來源的 Assessment（見 CONTEXT.md 與 ADR-0009），而站台本身必須對搜尋引擎完全公開，否則沒有人找得到。這兩件事無法同時滿足「擋掉所有機器」的目標，所以本站不追求擋掉爬蟲，只追求讓整站級的批次抓取變慢、變吵、變得需要刻意繞過。實作分成三層，全部放在 `src/middleware.ts` 與 `src/lib/security/`：誠實自報的用戶端（商業 SEO 採集器、HTTP 函式庫、掃描工具）直接 403；其餘來源依路徑分類做滑動視窗流量限制，Catalog 頁面的預算比首頁緊；`robots.txt` 禁止的誘餌路徑一旦被請求，該來源位址在所有分類上停權 15 分鐘。

搜尋引擎與 AI 問答引擎維持開放，這是 `src/app/robots.ts` 既有的決定，本 ADR 不推翻它——被 Google 與 AI 回答找到，是一個沒有預算的興趣站唯一的流量來源。被拒絕的是「抓取後轉售」那一層。

## Consequences

- 流量限制狀態存在單一 serverless instance 的記憶體裡，冷啟動即歸零，分散式抓取也看得到較寬鬆的實際上限。這是刻意接受的成本：它是摩擦力，不是授權邊界；任何真的必須被強制的規則要寫在資料層，不是中介層。
- User-Agent 是自報的，所以宣稱是 Googlebot 只換到四倍預算，不是無限通行。反過來說，偽造成瀏覽器的抓取工具仍受一般預算限制，靠的是速率而不是身分。
- 誘餌路徑同時寫在 `robots.txt`（禁止）與版面原始碼（`hidden` 連結，不進可及性樹也不進鍵盤順序）。它只會抓到兩種用戶端：讀了 robots.txt 再去踩禁止項的，以及解析原始 HTML 跟著每個 `href` 走的。誤傷的代價是 15 分鐘，不是永久封鎖。
- Headless 瀏覽器特徵不列入判斷。本 repo 自己的 `smoke:public-journey` 就是 Playwright Chromium，預覽與截圖服務也是；這個訊號的誤判率高於它的價值。
- CSP 採靜態策略而非 per-request nonce。nonce 必須透過 request header 注入，會讓每一頁退出靜態預繪；本站幾乎整站預繪，且核心體驗是手機上開得快，所以以 `script-src 'self' 'unsafe-inline'` 換取靜態化——第三方來源的注入仍被擋下，React 自己的 inline flight payload 才是 `'unsafe-inline'` 的用途。
- `form-action` 必須列出 `accounts.google.com` 與 `access.line.me`。Chrome 會用 `form-action` 檢查表單送出後的重新導向目標，漏掉任一個，對應的登入按鈕就會以 CSP 違規失敗。
- 外部連結一律經過 `safeExternalUrl`。zod 的 `z.url()` 接受 `javascript:`，所以 schema 不是這道檢查；擋下來的位置在 render 當下，值變成屬性的最後一刻。無法安全呈現的來源退化為純文字，仍然看得見，不靜默丟棄。
- 中介層現在同時負責 locale 路由與請求守門，兩者的路徑集合不同：守門涵蓋 API、sitemaps 與 llms.txt，locale 只涵蓋原本的頁面集合。新增路由時要記得這條界線由 `shouldLocalizePath` 維持。
