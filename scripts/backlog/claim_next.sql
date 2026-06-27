\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on

WITH params AS (
  SELECT
    :'kind'::text AS kind,
    NULLIF(:'actor', '')::text AS actor,
    GREATEST(:'ttl_hours'::int, 1) AS ttl_hours
),
candidate AS (
  SELECT
    item.id,
    item.status AS from_status,
    item.stage AS from_stage,
    item.claimed_by AS previous_claimed_by,
    item.claim_branch AS previous_claim_branch,
    item.claim_expires_at AS previous_claim_expires_at,
    item.status = 'In Progress' AS was_expired
  FROM agent_backlog.items item
  JOIN params ON params.kind = item.kind
  WHERE item.status IN ('Ready', 'Backlog')
    OR (
      item.status = 'In Progress'
      AND item.claim_expires_at IS NOT NULL
      AND item.claim_expires_at < now()
    )
  ORDER BY
    CASE WHEN item.idea_type = 'New' THEN 0 ELSE 1 END,
    item."rank",
    item.id
  FOR UPDATE OF item SKIP LOCKED
  LIMIT 1
),
claimed AS (
  UPDATE agent_backlog.items item
  SET
    status = 'In Progress',
    stage = 'planning',
    claimed_by = params.actor,
    claim_branch = 'codex/' || item.slug || CASE item.kind WHEN 'calculator' THEN '-calculator' ELSE '-tool' END,
    claimed_at = now(),
    claim_expires_at = now() + make_interval(hours => params.ttl_hours),
    blocked_reason = NULL
  FROM candidate
  JOIN params ON true
  WHERE item.id = candidate.id
  RETURNING
    item.*,
    params.actor,
    candidate.from_status,
    candidate.from_stage,
    candidate.previous_claimed_by,
    candidate.previous_claim_branch,
    candidate.previous_claim_expires_at,
    candidate.was_expired
),
claim_event AS (
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
    CASE WHEN was_expired THEN 'claim_reclaimed' ELSE 'claimed' END,
    from_status,
    status,
    from_stage,
    stage,
    actor,
    jsonb_build_object(
      'claim_branch', claim_branch,
      'claim_expires_at', claim_expires_at,
      'previous_claimed_by', previous_claimed_by,
      'previous_claim_branch', previous_claim_branch,
      'previous_claim_expires_at', previous_claim_expires_at
    )
  FROM claimed
)
SELECT COALESCE(
  (
    SELECT jsonb_pretty(
      jsonb_build_object(
        'ok', true,
        'item',
        jsonb_build_object(
          'kind', kind,
          'rank', "rank",
          'status', status,
          'stage', stage,
          'slug', slug,
          'primaryKeyword', primary_keyword,
          'family', family,
          'ideaType', idea_type,
          'planPath', COALESCE(
            plan_path,
            CASE kind
              WHEN 'calculator' THEN 'docs/calculator-plans/' || slug || '.md'
              ELSE 'docs/tool-plans/' || slug || '.md'
            END
          ),
          'targetRoute', COALESCE(
            target_route,
            CASE kind
              WHEN 'calculator' THEN '/calculadoras/' || slug
              ELSE '/' || family || '/' || slug
            END
          ),
          'branch', claim_branch,
          'claimedBy', claimed_by,
          'claimExpiresAt', claim_expires_at
        )
      )
    )
    FROM claimed
  ),
  jsonb_pretty(
    jsonb_build_object(
      'ok', false,
      'error', 'No eligible Ready/Backlog item found for kind ' || :'kind'
    )
  )
);
