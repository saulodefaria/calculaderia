\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on

WITH params AS (
  SELECT
    :'kind'::text AS kind,
    :'slug'::text AS slug,
    NULLIF(:'actor', '')::text AS actor,
    NULLIF(:'plan_path', '')::text AS plan_path,
    NULLIF(:'target_route', '')::text AS target_route,
    :'decision'::text AS decision
),
target AS (
  SELECT item.id, item.status AS from_status, item.stage AS from_stage
  FROM agent_backlog.items item
  JOIN params ON item.kind = params.kind
    AND item.slug = params.slug
  WHERE params.decision IN ('new', 'enhancement')
  FOR UPDATE OF item
),
updated AS (
  UPDATE agent_backlog.items item
  SET
    status = 'In Progress',
    stage = 'implementation',
    plan_path = COALESCE(params.plan_path, item.plan_path),
    target_route = COALESCE(params.target_route, item.target_route),
    decision = params.decision,
    blocked_reason = NULL
  FROM params, target
  WHERE item.id = target.id
  RETURNING
    item.*,
    params.actor,
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
    'planned',
    from_status,
    status,
    from_stage,
    stage,
    actor,
    jsonb_build_object(
      'plan_path', plan_path,
      'target_route', target_route,
      'decision', decision
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
          'stage', stage,
          'planPath', plan_path,
          'targetRoute', target_route,
          'decision', decision
        )
      )
    )
    FROM updated
  ),
  jsonb_pretty(
    jsonb_build_object(
      'ok', false,
      'error', 'No item updated. Expected decision new or enhancement.',
      'kind', :'kind',
      'slug', :'slug'
    )
  )
);
