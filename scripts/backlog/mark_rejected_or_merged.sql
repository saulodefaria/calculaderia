\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on

WITH params AS (
  SELECT
    :'kind'::text AS kind,
    :'slug'::text AS slug,
    NULLIF(:'actor', '')::text AS actor,
    :'status'::text AS status,
    :'reason'::text AS reason,
    NULLIF(:'target_route', '')::text AS target_route,
    NULLIF(:'plan_path', '')::text AS plan_path
),
target AS (
  SELECT item.id, item.status AS from_status, item.stage AS from_stage
  FROM agent_backlog.items item
  JOIN params ON item.kind = params.kind
    AND item.slug = params.slug
  WHERE params.status IN ('Rejected', 'Merged')
  FOR UPDATE OF item
),
updated AS (
  UPDATE agent_backlog.items item
  SET
    status = params.status,
    stage = NULL,
    decision = CASE params.status WHEN 'Merged' THEN 'merge' ELSE 'reject' END,
    blocked_reason = params.reason,
    target_route = COALESCE(params.target_route, item.target_route),
    plan_path = COALESCE(params.plan_path, item.plan_path),
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
    lower(status),
    from_status,
    status,
    from_stage,
    stage,
    actor,
    jsonb_build_object(
      'reason', reason,
      'target_route', target_route,
      'plan_path', plan_path
    )
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
          'decision', decision,
          'reason', blocked_reason,
          'targetRoute', target_route,
          'planPath', plan_path
        )
      )
    )
    FROM updated
  ),
  jsonb_pretty(
    jsonb_build_object(
      'ok', false,
      'error', 'No item updated. Expected status Rejected or Merged.',
      'kind', :'kind',
      'slug', :'slug',
      'status', :'status'
    )
  )
);
