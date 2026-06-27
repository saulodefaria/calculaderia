\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on

WITH params AS (
  SELECT
    :'kind'::text AS kind,
    :'slug'::text AS slug,
    NULLIF(:'actor', '')::text AS actor,
    :'stage'::text AS stage
),
target AS (
  SELECT item.id, item.status AS from_status, item.stage AS from_stage
  FROM agent_backlog.items item
  JOIN params ON item.kind = params.kind
    AND item.slug = params.slug
  WHERE item.status = 'In Progress'
    AND params.stage IN ('planning', 'implementation', 'review', 'testing', 'verified', 'pr')
  FOR UPDATE OF item
),
updated AS (
  UPDATE agent_backlog.items item
  SET stage = params.stage
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
    'stage_changed',
    from_status,
    status,
    from_stage,
    stage,
    actor,
    '{}'::jsonb
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
          'stage', stage
        )
      )
    )
    FROM updated
  ),
  jsonb_pretty(
    jsonb_build_object(
      'ok', false,
      'error', 'No in-progress item updated for requested stage.',
      'kind', :'kind',
      'slug', :'slug',
      'stage', :'stage'
    )
  )
);
