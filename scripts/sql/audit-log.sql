-- Behaviour audit log for this site.
--
-- Lives in this site's own database (DATABASE_URL), not in the shared
-- affiliate database (SUP_DATABASE_URL). The cross-system spec is explicit
-- that promotion *content* is shared while each site keeps its own log —
-- one site's traffic is not another site's business.
--
-- Deliberately not keyed to a person: no user id, no IP, no user agent. The
-- questions this table has to answer are per-offer and per-placement (see
-- the CTR query in the spec's §7.3), and none of them need to know who.
--
-- `target` holds `affiliates.id`, which is stable by contract — an offer is
-- retired with `enabled = FALSE`, never renamed and never deleted — so rows
-- here stay comparable across a campaign's whole life.

CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  action text NOT NULL,
  target text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The reporting query filters on action and groups by project, so both live
-- in the index rather than forcing a scan of every event ever recorded.
CREATE INDEX IF NOT EXISTS audit_log_action_created_idx
  ON audit_log (action, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_target_idx
  ON audit_log (target, action);

-- Impressions and clicks per offer, with CTR. Spec §7.3, kept here so the
-- shape the table is indexed for is written down next to the table.
--
--   SELECT
--     metadata->>'project_name' AS project_name,
--     target AS offer_id,
--     count(*) FILTER (WHERE action = 'affiliate_impression') AS impressions,
--     count(*) FILTER (WHERE action = 'affiliate_click') AS clicks,
--     ROUND(
--       100.0 * count(*) FILTER (WHERE action = 'affiliate_click') /
--       NULLIF(count(*) FILTER (WHERE action = 'affiliate_impression'), 0),
--       2
--     ) AS ctr_pct
--   FROM audit_log
--   WHERE action IN ('affiliate_impression', 'affiliate_click')
--   GROUP BY metadata->>'project_name', target
--   ORDER BY clicks DESC;
