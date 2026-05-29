-- Closr Tool 2: Verified Portfolio Builder
-- Supabase / PostgreSQL schema and queue RPCs.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- NextAuth Adapter Tables
CREATE SCHEMA IF NOT EXISTS next_auth;

CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid not null primary key default gen_random_uuid(),
  name text,
  email text,
  "emailVerified" timestamp with time zone,
  image text
);

CREATE TABLE IF NOT EXISTS next_auth.accounts (
  id uuid not null primary key default gen_random_uuid(),
  "userId" uuid not null references next_auth.users(id) on delete cascade,
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  oauth_token_secret text,
  oauth_token text,
  unique(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid not null primary key default gen_random_uuid(),
  expires timestamp with time zone not null,
  "sessionToken" text not null unique,
  "userId" uuid not null references next_auth.users(id) on delete cascade
);

CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text,
  token text,
  expires timestamp with time zone not null,
  primary key (identifier, token)
);

-- Strict RLS Lockdown for NextAuth tables
ALTER TABLE next_auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_auth.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_auth.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_auth.verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_accounts_user_provider ON next_auth.accounts ("userId", provider);

-- Note: The frontend NEVER reads these directly. NextAuth server uses SERVICE_ROLE.
-- The Oracle Worker also uses SERVICE_ROLE. So no public policies are created.

DO $$ BEGIN
    CREATE TYPE creator_platform AS ENUM (
        'youtube',
        'github',
        'twitch',
        'substack',
        'medium',
        'twitter',
        'x',
        'pinterest',
        'website',
        'instagram',
        'linkedin',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add 'linkedin' to existing enum if it was already created without it
DO $$ BEGIN
    ALTER TYPE creator_platform ADD VALUE IF NOT EXISTS 'linkedin';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE queue_status AS ENUM (
        'pending',
        'processing',
        'completed',
        'failed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE challenge_status AS ENUM (
        'pending',
        'verified',
        'expired',
        'failed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE creator_primary_niche AS ENUM (
        'ai_ml',
        'devtools',
        'software_engineering',
        'gaming',
        'creator_economy',
        'business_marketing',
        'finance',
        'education',
        'fitness_wellness',
        'beauty',
        'fashion',
        'food',
        'travel',
        'music',
        'photography_video',
        'lifestyle',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE audience_size_tier AS ENUM (
        'micro',
        'emerging',
        'mid_market',
        'large',
        'enterprise'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS creators (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id       TEXT NOT NULL,
    owner_email         TEXT,
    slug                TEXT UNIQUE NOT NULL,
    display_name        TEXT NOT NULL,
    root_platform       creator_platform NOT NULL,
    root_external_id    TEXT,
    root_handle         TEXT,
    root_oauth_subject  TEXT,
    onboarding_status   TEXT NOT NULL DEFAULT 'intake',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_links (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id             UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    platform               creator_platform NOT NULL,
    url                    TEXT NOT NULL,
    normalized_url         TEXT NOT NULL,
    submitted_handle       TEXT,
    verification_level     INT NOT NULL DEFAULT 1 CHECK (verification_level IN (1, 2, 3)),
    verification_status    TEXT NOT NULL DEFAULT 'claimed',
    verification_chain     JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_identity           JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_verified_at       TIMESTAMPTZ,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (creator_id, normalized_url)
);

CREATE TABLE IF NOT EXISTS platform_verifications (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id            UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    link_id               UUID REFERENCES creator_links(id) ON DELETE CASCADE,
    platform              creator_platform NOT NULL,
    level                 INT NOT NULL CHECK (level IN (1, 2, 3)),
    method                TEXT NOT NULL,
    score                 NUMERIC(5, 2) NOT NULL DEFAULT 0,
    verification_chain    JSONB NOT NULL DEFAULT '{}'::jsonb,
    root_evidence         JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_verified_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_data (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id      UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    link_id         UUID REFERENCES creator_links(id) ON DELETE SET NULL,
    platform        creator_platform NOT NULL,
    external_id     TEXT,
    handle          TEXT,
    identity_key    TEXT NOT NULL DEFAULT 'unknown',
    metrics         JSONB NOT NULL DEFAULT '{}'::jsonb,
    recent_items    JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
    verified_via    TEXT NOT NULL DEFAULT 'claimed',
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (creator_id, platform, identity_key)
);

CREATE TABLE IF NOT EXISTS creator_identities (
    creator_id            UUID PRIMARY KEY REFERENCES creators(id) ON DELETE CASCADE,
    primary_niche          creator_primary_niche NOT NULL DEFAULT 'other',
    technical_skills       TEXT[] NOT NULL DEFAULT '{}',
    brand_tone             TEXT[] NOT NULL DEFAULT '{}',
    content_format         TEXT[] NOT NULL DEFAULT '{}',
    audience_size_tier     audience_size_tier NOT NULL DEFAULT 'micro',
    past_topics            TEXT[] NOT NULL DEFAULT '{}',
    bio_summary            TEXT,
    extraction_confidence  NUMERIC(4, 3) NOT NULL DEFAULT 0,
    llm_provider           TEXT NOT NULL DEFAULT 'unknown',
    llm_model              TEXT NOT NULL DEFAULT 'unknown',
    prompt_version         TEXT NOT NULL DEFAULT 'unknown',
    prompt_hash            TEXT NOT NULL DEFAULT 'unknown',
    llm_request_id         TEXT,
    processing_duration_ms INT,
    input_tokens           INT,
    output_tokens          INT,
    estimated_cost_usd     NUMERIC(10, 6),
    raw_model_output       JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scraping_queue (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id     UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    link_id        UUID REFERENCES creator_links(id) ON DELETE CASCADE,
    platform       creator_platform NOT NULL,
    url            TEXT NOT NULL,
    priority       INT NOT NULL DEFAULT 0,
    status         queue_status NOT NULL DEFAULT 'pending',
    locked_at      TIMESTAMPTZ,
    locked_by      TEXT,
    attempts       INT NOT NULL DEFAULT 0,
    max_attempts   INT NOT NULL DEFAULT 3,
    error_log      JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_output     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS analysis_queue (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id       UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    scraping_job_id  UUID REFERENCES scraping_queue(id) ON DELETE SET NULL,
    raw_text         TEXT NOT NULL,
    payload          JSONB NOT NULL DEFAULT '{}'::jsonb,
    status           queue_status NOT NULL DEFAULT 'pending',
    locked_at        TIMESTAMPTZ,
    locked_by        TEXT,
    attempts         INT NOT NULL DEFAULT 0,
    max_attempts     INT NOT NULL DEFAULT 2,
    error_log        JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS verification_challenges (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id     UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    link_id        UUID REFERENCES creator_links(id) ON DELETE CASCADE,
    platform       creator_platform NOT NULL,
    code           TEXT NOT NULL,
    instructions   TEXT NOT NULL,
    expires_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    used_at        TIMESTAMPTZ,
    status         challenge_status NOT NULL DEFAULT 'pending',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_processing_events (
    id          BIGSERIAL PRIMARY KEY,
    creator_id  UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    event_type  TEXT NOT NULL,
    message     TEXT NOT NULL,
    payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE platform_data ADD COLUMN IF NOT EXISTS metrics JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE creator_identities ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC(4, 3) NOT NULL DEFAULT 0;
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'creator_identities'
          AND column_name = 'confidence'
    ) THEN
        EXECUTE 'UPDATE creator_identities SET extraction_confidence = confidence WHERE extraction_confidence = 0 AND confidence IS NOT NULL';
    END IF;
END;
$$;
ALTER TABLE creator_identities ADD COLUMN IF NOT EXISTS llm_provider TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE creator_identities ADD COLUMN IF NOT EXISTS llm_model TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE creator_identities ADD COLUMN IF NOT EXISTS prompt_version TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE creator_identities ADD COLUMN IF NOT EXISTS prompt_hash TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE creator_identities ADD COLUMN IF NOT EXISTS llm_request_id TEXT;
ALTER TABLE creator_identities ADD COLUMN IF NOT EXISTS processing_duration_ms INT;
ALTER TABLE creator_identities ADD COLUMN IF NOT EXISTS input_tokens INT;
ALTER TABLE creator_identities ADD COLUMN IF NOT EXISTS output_tokens INT;
ALTER TABLE creator_identities ADD COLUMN IF NOT EXISTS estimated_cost_usd NUMERIC(10, 6);

CREATE INDEX IF NOT EXISTS idx_creator_links_creator ON creator_links (creator_id);
CREATE INDEX IF NOT EXISTS idx_platform_data_creator ON platform_data (creator_id);
CREATE INDEX IF NOT EXISTS idx_scraping_queue_status ON scraping_queue (status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_queue_status ON analysis_queue (status, created_at);
CREATE INDEX IF NOT EXISTS idx_events_creator_created ON creator_processing_events (creator_id, created_at DESC);

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_creators_touch ON creators;
CREATE TRIGGER trg_creators_touch
BEFORE UPDATE ON creators
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_creator_links_touch ON creator_links;
CREATE TRIGGER trg_creator_links_touch
BEFORE UPDATE ON creator_links
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE FUNCTION claim_scraping_jobs(
    p_worker_id TEXT,
    p_batch_size INT DEFAULT 5,
    p_lock_timeout INTERVAL DEFAULT INTERVAL '10 minutes'
)
RETURNS SETOF scraping_queue
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH picked AS (
        SELECT id
        FROM scraping_queue
        WHERE
            status = 'pending'
            OR (
                status = 'processing'
                AND locked_at < NOW() - p_lock_timeout
                AND attempts < max_attempts
            )
        ORDER BY priority DESC, created_at ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    )
    UPDATE scraping_queue q
    SET
        status = 'processing',
        locked_at = NOW(),
        locked_by = p_worker_id,
        attempts = q.attempts + 1,
        updated_at = NOW()
    FROM picked
    WHERE q.id = picked.id
    RETURNING q.*;
END;
$$;

CREATE OR REPLACE FUNCTION claim_analysis_jobs(
    p_worker_id TEXT,
    p_batch_size INT DEFAULT 1,
    p_lock_timeout INTERVAL DEFAULT INTERVAL '20 minutes'
)
RETURNS SETOF analysis_queue
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH picked AS (
        SELECT id
        FROM analysis_queue
        WHERE
            status = 'pending'
            OR (
                status = 'processing'
                AND locked_at < NOW() - p_lock_timeout
                AND attempts < max_attempts
            )
        ORDER BY created_at ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    )
    UPDATE analysis_queue q
    SET
        status = 'processing',
        locked_at = NOW(),
        locked_by = p_worker_id,
        attempts = q.attempts + 1,
        updated_at = NOW()
    FROM picked
    WHERE q.id = picked.id
    RETURNING q.*;
END;
$$;

CREATE OR REPLACE VIEW public_creator_profiles AS
SELECT
    c.id,
    c.slug,
    c.display_name,
    c.root_platform,
    c.root_handle,
    ci.primary_niche,
    COALESCE(ci.technical_skills, '{}') AS technical_skills,
    COALESCE(ci.brand_tone, '{}') AS brand_tone,
    COALESCE(ci.content_format, '{}') AS content_format,
    ci.audience_size_tier,
    COALESCE(ci.past_topics, '{}') AS past_topics,
    ci.bio_summary,
    ci.raw_model_output AS extra_analysis,
    ci.extraction_confidence AS confidence,
    u.image AS owner_image,
    (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'platform', cl.platform,
                'url', cl.normalized_url,
                'verification_level', cl.verification_level,
                'verification_status', cl.verification_status,
                'last_verified_at', cl.last_verified_at
            )
            ORDER BY cl.verification_level DESC, cl.platform
        ), '[]'::jsonb)
        FROM creator_links cl
        WHERE cl.creator_id = c.id
    ) AS verified_links,
    (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'platform', pd.platform,
                'identity_key', pd.identity_key,
                'raw_payload', pd.raw_payload,
                'fetched_at', pd.fetched_at
            )
            ORDER BY pd.fetched_at DESC
        ), '[]'::jsonb)
        FROM platform_data pd
        WHERE pd.creator_id = c.id
    ) AS platform_metrics
FROM creators c
LEFT JOIN creator_identities ci ON ci.creator_id = c.id
LEFT JOIN next_auth.users u ON u.id::text = c.owner_user_id
WHERE c.onboarding_status IN ('completed', 'analysis_completed', 'intake');

CREATE TABLE IF NOT EXISTS external_api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    access_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(creator_id, provider)
);

CREATE TABLE IF NOT EXISTS social_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    handle TEXT,
    profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    recent_media JSONB NOT NULL DEFAULT '[]'::jsonb,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(creator_id, platform)
);

-- Strict RLS Lockdown for core tables
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_processing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_cache ENABLE ROW LEVEL SECURITY;

-- Note: All frontend interactions with the DB happen through Next.js server actions (using Service Role)
-- or through the Worker (using Service Role). If public user policies are ever needed, they should
-- be tightly scoped using auth.uid().
