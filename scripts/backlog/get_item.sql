\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on

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
          'clusterKeywords', cluster_keywords,
          'family', family,
          'volume', volume,
          'seoDifficulty', seo_difficulty,
          'cpc', cpc,
          'intent', intent,
          'opportunityScore', opportunity_score,
          'ideaType', idea_type,
          'notes', notes,
          'doneRef', done_ref,
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
          'decision', decision,
          'prUrl', pr_url,
          'claimBranch', claim_branch,
          'claimedBy', claimed_by,
          'claimExpiresAt', claim_expires_at,
          'blockedReason', blocked_reason
        )
      )
    )
    FROM agent_backlog.items
    WHERE kind = :'kind'
      AND slug = :'slug'
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
