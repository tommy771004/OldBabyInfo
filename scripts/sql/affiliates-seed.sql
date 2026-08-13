-- OldBabyInfo 的 affiliates 資料列。
-- ---------------------------------------------------------------------------
-- 執行對象：SUP_DATABASE_URL 指向的「共用」資料庫，不是本站的 DATABASE_URL。
-- 表本身由 TW_veggieprice 的 db/affiliates.sql 建立，本檔只寫入本專案分區。
--
-- 這個檔案不建表、不刪表、不做整批覆寫。共用表裡還有其他專案的資料列，
-- 規格 §5.2 明文禁止無條件 DELETE 或 replace 式同步。
--
-- 本站的 project_name 是 'old-baby-info'，必須與 AFFILIATE_PROJECT_NAME
-- 完全一致；不一致時版位會安靜地空掉，不會報錯。
--
-- 欄位取捨：本站的版位只讀 sponsored / title / url / partner / priority。
-- description、cta_label 是表的 NOT NULL 欄位，仍必須給值，只是不會顯示。
-- categories、crops、icon 是農產品站的作物版位概念，本站沒有作物脈絡，
-- categories 一律給 ARRAY['all']，crops 與 icon 留 NULL。
--
-- 重要：title / partner / url 都不可含 {crop}。本站不填任何作物脈絡，
-- 帶著 {crop} 的資料列會被讀取端當成壞資料整列跳過（見 src/lib/affiliates/schema.ts）。
--
-- 第 3、4、5 節整段是註解的，這是刻意的：那些是你填好內容後才逐段執行的動作。
-- 整份檔案直接跑，只會做第 1 節的煙霧測試與第 6 節的驗收查詢，不會寫入垃圾資料。


-- ── 1. 煙霧測試：確認整條線通了 ─────────────────────────────────────────────
-- 指向本站自己的揭露頁，不是任何合作對象，驗完請執行第 2 節刪掉。
-- 跑完這段後重新整理首頁，「下一場，就在附近」上方應出現「合作推廣」一列跑馬燈。

INSERT INTO affiliates (
  project_name, id, enabled, sponsored,
  title, description, cta_label, url,
  icon, categories, crops, priority, partner
)
VALUES (
  'old-baby-info',
  'smoke-test',
  TRUE,
  FALSE,
  '版位煙霧測試',
  '確認 old-baby-info 讀得到共用表的資料列；驗證後即刪除。',
  '查看',
  'https://old-baby-info.vercel.app/terms#disclosure',
  NULL,
  ARRAY['all']::TEXT[],
  NULL,
  0,
  '煙霧測試'
)
ON CONFLICT (project_name, id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  updated_at = now();


-- ── 2. 移除煙霧測試 ────────────────────────────────────────────────────────
-- 這是唯一可以真的 DELETE 的資料列，因為它是測試資料、沒有統計價值。
-- 真正的檔位一律用第 4 節停用，不要刪。
--
-- DELETE FROM affiliates
-- WHERE project_name = 'old-baby-info'
--   AND id = 'smoke-test';


-- ── 3. 真實檔位：把下面整段取消註解，填好值再跑 ────────────────────────────
-- 每加一個合作對象，複製一次 VALUES 區塊並改值。上線前請對照規格 §8：
--
--   * id 一旦上線就永久不變，換活動就開新 id、舊的停用。
--     統計是以 id 為 key 記在 audit_log.target，改 id 等於把歷史數據斷掉。
--   * sponsored 必須反映真實商業關係。付費推廣寫 TRUE（顯示「贊助」），
--     一般合作寫 FALSE（顯示「合作推薦」）。用 FALSE 隱藏付費推廣是規格
--     明文禁止的。
--   * url 只能是 http/https，且必須人工點過，確認不是過期或與文案不符的頁面。
--   * priority 數字大的排前面。留意別給某一檔位超大值壟斷整個版位。
--   * partner 是版位上實際顯示的字（本站顯示 partner，沒有才退回 title）。
--
-- enabled 先給 FALSE，內容檢查過再用第 4 節開啟——沒檢查過的檔位不該直接見人。
--
-- ON CONFLICT 讓這段可以重複執行：第二次跑是更新，不是報錯，也不會動到
-- 其他專案的資料列。
--
-- INSERT INTO affiliates (
--   project_name, id, enabled, sponsored,
--   title, description, cta_label, url,
--   icon, categories, crops, priority, partner, updated_at
-- )
-- VALUES
--   (
--     'old-baby-info',
--     'funbox-x-2026',            -- id：穩定、永久不變
--     FALSE,                      -- enabled：檢查過再開
--     FALSE,                      -- sponsored：付費推廣改 TRUE
--     'Funbox 戰鬥陀螺專區',       -- title（partner 為 NULL 時才會顯示這個）
--     '零件、發射器與競技場。',     -- description（本站版位不顯示）
--     '前往選購',                  -- cta_label（本站版位不顯示）
--     'https://example.com/',     -- url：換成真正的合作連結
--     NULL,                       -- icon（本站不使用）
--     ARRAY['all']::TEXT[],       -- categories
--     NULL,                       -- crops（本站不使用）
--     10,                         -- priority：大的排前面
--     'Funbox',                   -- partner：版位上實際顯示的字
--     now()
--   )
-- ON CONFLICT (project_name, id) DO UPDATE SET
--   enabled     = EXCLUDED.enabled,
--   sponsored   = EXCLUDED.sponsored,
--   title       = EXCLUDED.title,
--   description = EXCLUDED.description,
--   cta_label   = EXCLUDED.cta_label,
--   url         = EXCLUDED.url,
--   icon        = EXCLUDED.icon,
--   categories  = EXCLUDED.categories,
--   crops       = EXCLUDED.crops,
--   priority    = EXCLUDED.priority,
--   partner     = EXCLUDED.partner,
--   updated_at  = now();


-- ── 4. 上架、下架與復原（§5.3）─────────────────────────────────────────────
-- 保留資料列，統計與 id 穩定性才不會斷。
--
-- UPDATE affiliates
-- SET enabled = TRUE, updated_at = now()
-- WHERE project_name = 'old-baby-info'
--   AND id = 'funbox-x-2026';
--
-- UPDATE affiliates
-- SET enabled = FALSE, updated_at = now()
-- WHERE project_name = 'old-baby-info'
--   AND id = 'funbox-x-2026';


-- ── 5. 成效（需要本站 DATABASE_URL 的 audit_log，不是這個資料庫）───────────
-- 放在這裡只是方便對照；這段要在「本站」的資料庫執行，不是共用資料庫。
--
-- SELECT
--   metadata->>'project_name' AS project_name,
--   metadata->>'placement'    AS placement,
--   target                    AS offer_id,
--   count(*) FILTER (WHERE action = 'affiliate_impression') AS impressions,
--   count(*) FILTER (WHERE action = 'affiliate_click')      AS clicks,
--   ROUND(
--     100.0 * count(*) FILTER (WHERE action = 'affiliate_click') /
--     NULLIF(count(*) FILTER (WHERE action = 'affiliate_impression'), 0),
--     2
--   ) AS ctr_pct
-- FROM audit_log
-- WHERE action IN ('affiliate_impression', 'affiliate_click')
-- GROUP BY 1, 2, 3
-- ORDER BY clicks DESC;


-- ── 6. 驗收（§10）─────────────────────────────────────────────────────────

-- 讀取端實際跑的查詢（§6.2）。第 1 節跑完後，這裡應看得到 smoke-test。
SELECT project_name, id, sponsored, title, url, partner, priority
FROM affiliates
WHERE project_name = 'old-baby-info'
  AND enabled = TRUE
ORDER BY priority DESC, id ASC;

-- 本專案目前啟用中的檔位數。
SELECT count(*) AS enabled_count
FROM affiliates
WHERE project_name = 'old-baby-info'
  AND enabled = TRUE;

-- 所有 URL 都必須是 http/https；應回 0 列。
SELECT project_name, id, url
FROM affiliates
WHERE project_name = 'old-baby-info'
  AND url !~* '^https?://';

-- 本站不填作物脈絡，帶 {crop} 的資料列會被整列跳過；應回 0 列。
SELECT project_name, id
FROM affiliates
WHERE project_name = 'old-baby-info'
  AND (
    title LIKE '%{crop}%'
    OR url LIKE '%{crop}%'
    OR coalesce(partner, '') LIKE '%{crop}%'
  );

-- 同一專案內 id 不得重複。主鍵已擋，這是確認用；應回 0 列。
SELECT id, count(*)
FROM affiliates
WHERE project_name = 'old-baby-info'
GROUP BY id
HAVING count(*) > 1;
