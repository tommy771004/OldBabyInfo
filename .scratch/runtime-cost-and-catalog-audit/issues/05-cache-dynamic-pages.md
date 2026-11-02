# 05 — force-dynamic 頁面改 ISR

Status: done（2026-11-02，站方決定 N = 300 秒）

最大的槓桿，但會改變資料新鮮度，所以沒有直接動。

`/parts/[slug]` 共 191 Part × 3 語系，每次瀏覽、每個爬蟲請求都是一次完整渲染 + Neon 查詢（討論串 + 庫存）。`/` 每次都讀推廣版位。

**提案：** 把 `dynamic = "force-dynamic"` 換成 `revalidate = N`（例如 300 秒）：
- `/`：推廣版位最多晚 N 秒更新。
- `/parts/[slug]`：新討論串、庫存最多晚 N 秒出現。也可以把討論串改成發文後 `revalidatePath`。
- `/parts/[slug]/where-to-buy`：同上。
- `/login` 必須維持 dynamic（讀 cookie）。

`/parts`、`/events`、`/combo`、`/parts/compare` 是因為 `searchParams` 才 dynamic；要靜態化得把篩選搬到 client，是較大的改動，先不提。

**代價：** `/parts/[slug]` 已有 `generateStaticParams`，改 ISR 後 build 時會預渲染 570 頁、每頁打一次 Neon，所以 build 環境需要 `DATABASE_URL`，build 也會變慢。也可以讓 `generateStaticParams` 回空陣列，第一次請求時才生成並快取。

**要站方決定：** N 是多少、討論串是否接受延遲。

## 實作（2026-11-02）

- `/`、`/parts/[slug]`、`/parts/[slug]/where-to-buy`：`dynamic = "force-dynamic"` → `revalidate = 300`。
- `/login` 維持 `force-dynamic`（讀 cookie）。`/discussion` 不讀 cookie、技術上可以同樣改 `revalidate = 300`，但不在本 issue 原提案內，未動。
- 站內目前沒有發文的寫入路徑（沒有 server action / API 寫討論串），所以不需要 `revalidatePath`；從外部寫進 Neon 的討論串、庫存最多晚 300 秒出現。
- **where-to-buy 必須預建全部 slug × 語系。** 只加 `revalidate` 時它仍是 ƒ；`generateStaticParams` 回 `[]`（隨需 ISR）時 `/en/...` 會快取，但不帶前綴的 zh-TW 路徑（經 middleware 語系 rewrite 進來）在 `next start` 上一直是 `no-store`。改成回傳全部 Part × 語系後三語系都 HIT。
- **代價（已接受）：** build 時每個 Part 頁、每個 where-to-buy 頁各讀一次 Neon（有 `DATABASE_URL` 時）。build 環境若沒有 `DATABASE_URL`，where-to-buy 會先以「資料庫暫時無法讀取」的狀態快取，最多 300 秒後重新生成。

**未驗證：** 本機 build 沒有 `DATABASE_URL`（無 `.env.local`），所以「build 時讀 Neon」這條路徑沒跑過；部署後看 build 時間與 Vercel Observability。

**驗證：** 本機 `next start`，`/`、`/parts/accel`、`/parts/accel/where-to-buy`、`/ja/parts/accel/where-to-buy` 第二次請求皆 `x-nextjs-cache: HIT`、`Cache-Control: s-maxage=300, stale-while-revalidate=…`。
