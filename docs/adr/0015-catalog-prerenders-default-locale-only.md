# Catalog 記錄頁只預繪預設語系，其餘語系首次請求時產生

站方決定（2026-10-22）：`/parts/catalog/[id]` 只在建置期預繪 zh-TW；ja 與 en 的同一頁在第一次被請求時渲染，之後由 Next.js 快取（ISR，不設 revalidate，整個部署期間有效）。

這條 ADR 收窄 [ADR-0001](0001-part-data-is-static-not-in-the-database.md) 的「在建置期產生靜態頁面」與 [ADR-0012](0012-anti-scraping-is-friction-not-a-wall.md) 的「本站幾乎整站預繪」，只針對 Catalog 記錄頁的非預設語系。資料來源不變：仍是 repo 內的 JSON，渲染時不碰資料庫。

## 為什麼

Vercel 的部署儲存空間累積到 3.31 GB。量測（2026-10-22，本機 `next build`）：

- 一次部署預繪 6,382 頁，HTML + RSC 約 530 MB；其中 6,357 頁是 Catalog 記錄頁（約 2,119 筆 × 3 語系）。
- 每頁還帶著整份翻譯字典（約 10 KB，RSC 一份、HTML 內嵌一份），因為 `NextIntlClientProvider` 沒指定 `messages` 時會序列化全部 namespace。

同一輪一併處理了字典：瀏覽器端只拿得到 `src/i18n/client-messages.ts` 列出的 namespace。兩者合計後，一次部署的預繪輸出降到約 111 MB（2,144 頁），單一 Catalog 頁從約 75 KB 降到約 47 KB。

zh-TW 是主要客群，維持預繪；ja / en Catalog 頁流量小，把它們的成本從「每次部署都付」移到「有人看才付」。

## Consequences

- ja / en Catalog 頁的第一位訪客要等一次 serverless function 渲染（含冷啟動）。ADR-0001 擔心的是 Neon 冷啟動的數秒等待；這裡只讀 JSON，代價是一次 function 啟動，不是資料庫。
- `dynamicParams` 改為 `true`，不存在的 id 由頁面內的 `notFound()` 回 404，而不是由 Next.js 直接拒絕。每個這種請求都會跑一次 function；限流仍由 ADR-0012 的 Catalog 預算負責。
- 新增 Catalog 記錄後，ja / en 頁不需要重新建置才會出現，但仍要部署——資料在 repo 裡，這點與 ADR-0001 相同。
- `src/i18n/client-messages.test.ts` 會走過 import graph，任何 client component 讀了沒列在 `CLIENT_MESSAGE_NAMESPACES` 的 namespace 就失敗。新增使用翻譯的 client component 時，要把 namespace 加到 shell 或該路由的清單，並在該路由放 `<ClientMessagesProvider route=…>`。
- 若之後要讓其他大量頁面（例如 `/parts/[slug]`）也這樣做，沿用這條 ADR 的理由，但要重新量測，不要直接套用。
