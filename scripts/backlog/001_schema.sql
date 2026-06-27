\set ON_ERROR_STOP on

CREATE SCHEMA IF NOT EXISTS agent_backlog;

CREATE TABLE IF NOT EXISTS agent_backlog.items (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('tool', 'calculator')),
  "rank" INTEGER NOT NULL CHECK ("rank" > 0),
  status TEXT NOT NULL CHECK (
    status IN (
      'Backlog',
      'Ready',
      'In Progress',
      'Done',
      'Blocked',
      'Rejected',
      'Existing',
      'Merged'
    )
  ),
  stage TEXT CHECK (
    stage IS NULL
    OR stage IN ('planning', 'implementation', 'review', 'testing', 'verified', 'pr')
  ),
  slug TEXT NOT NULL,
  primary_keyword TEXT NOT NULL,
  cluster_keywords TEXT,
  opportunity_score INTEGER,
  idea_type TEXT NOT NULL,
  notes TEXT,
  done_ref TEXT,
  family TEXT,
  volume INTEGER,
  seo_difficulty INTEGER,
  cpc TEXT,
  intent TEXT,
  plan_path TEXT,
  target_route TEXT,
  decision TEXT CHECK (
    decision IS NULL
    OR decision IN ('new', 'enhancement', 'merge', 'reject', 'blocked')
  ),
  pr_url TEXT,
  claimed_by TEXT,
  claim_branch TEXT,
  claimed_at TIMESTAMPTZ,
  claim_expires_at TIMESTAMPTZ,
  blocked_reason TEXT,
  source_file TEXT,
  source_generated_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kind, slug),
  UNIQUE (kind, "rank")
);

CREATE TABLE IF NOT EXISTS agent_backlog.item_events (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT NOT NULL REFERENCES agent_backlog.items(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  slug TEXT NOT NULL,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  from_stage TEXT,
  to_stage TEXT,
  actor TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_backlog_items_selection_idx
  ON agent_backlog.items (kind, status, idea_type, "rank");

CREATE INDEX IF NOT EXISTS agent_backlog_items_claim_idx
  ON agent_backlog.items (kind, status, claim_expires_at);

CREATE INDEX IF NOT EXISTS agent_backlog_item_events_item_idx
  ON agent_backlog.item_events (item_id, created_at);

CREATE OR REPLACE FUNCTION agent_backlog.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_agent_backlog_items_updated_at ON agent_backlog.items;
CREATE TRIGGER set_agent_backlog_items_updated_at
BEFORE UPDATE ON agent_backlog.items
FOR EACH ROW
EXECUTE FUNCTION agent_backlog.set_updated_at();
