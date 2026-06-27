\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on

WITH params AS (
  SELECT
    :'kind'::text AS kind,
    :'slug'::text AS slug,
    NULLIF(:'actor', '')::text AS actor,
    :'reason'::text AS reason
),
target AS (
  SELECT item.id, item.status AS from_status, item.stage AS from_stage
  FROM agent_backlog.items item
  JOIN params ON item.kind = params.kind
    AND item.slug = params.slug
  FOR UPDATE OF item
),
updated AS (
  UPDATE agent_backlog.items item
  SET
    status = 'Blocked',
    blocked_reason = params.reason,
    claim_expires_at = NULL
  FROM params, target
  WHERE item.id = target.id
  RETURNING
    item.*,
    params.actor,
    params.reason,
    target.from_status,
    target.from_stage
),
event AS (
  INSERT INTO agent_backlog.item_events (
    item_id,
    kind,
    slug,
    event_type,
    from_status,
    to_status,
    from_stage,
    to_stage,
    actor,
    details
  )
  SELECT
    id,
    kind,
    slug,
    'blocked',
    from_status,
    status,
    from_stage,
    stage,
    actor,
    jsonb_build_object('reason', reason)
  FROM updated
)
SELECT COALESCE(
  (
    SELECT jsonb_pretty(
      jsonb_build_object(
        'ok', true,
        'item', jsonb_build_object(
          'kind', kind,
          'slug', slug,
          'status', status,
          'stage', stage,
          'blockedReason', blocked_reason
        )
      )
    )
    FROM updated
  ),
  jsonb_pretty(
    jsonb_build_object(
      'ok', false,
      'error', 'Item not found',
      'kind', :'kind',
      'slug', :'slug'
    )
  )
);
