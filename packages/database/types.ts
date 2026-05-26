export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export const platforms = [
  "youtube",
  "github",
  "twitch",
  "substack",
  "medium",
  "twitter",
  "x",
  "pinterest",
  "website",
  "instagram",
  "other",
] as const;

export type CreatorPlatform = (typeof platforms)[number];

export type QueueStatus = "pending" | "processing" | "completed" | "failed";
export type ChallengeStatus = "pending" | "verified" | "expired" | "failed";
export type CreatorPrimaryNiche =
  | "ai_ml"
  | "devtools"
  | "software_engineering"
  | "gaming"
  | "creator_economy"
  | "business_marketing"
  | "finance"
  | "education"
  | "fitness_wellness"
  | "beauty"
  | "fashion"
  | "food"
  | "travel"
  | "music"
  | "photography_video"
  | "lifestyle"
  | "other";
export type AudienceSizeTier = "micro" | "emerging" | "mid_market" | "large" | "enterprise";

export type Database = {
  public: {
    Tables: {
      creators: {
        Row: {
          id: string;
          owner_user_id: string;
          owner_email: string | null;
          slug: string;
          display_name: string;
          root_platform: CreatorPlatform;
          root_external_id: string | null;
          root_handle: string | null;
          root_oauth_subject: string | null;
          onboarding_status: string;
          created_at: string;
          updated_at: string;
        };
      };
      creator_links: {
        Row: {
          id: string;
          creator_id: string;
          platform: CreatorPlatform;
          url: string;
          normalized_url: string;
          submitted_handle: string | null;
          verification_level: 1 | 2 | 3;
          verification_status: string;
          verification_chain: Json;
          raw_identity: Json;
          last_verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      scraping_queue: {
        Row: {
          id: string;
          creator_id: string;
          link_id: string | null;
          platform: CreatorPlatform;
          url: string;
          priority: number;
          status: QueueStatus;
          locked_at: string | null;
          locked_by: string | null;
          attempts: number;
          max_attempts: number;
          error_log: Json;
          raw_output: Json;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
      };
      analysis_queue: {
        Row: {
          id: string;
          creator_id: string;
          scraping_job_id: string | null;
          raw_text: string;
          payload: Json;
          status: QueueStatus;
          locked_at: string | null;
          locked_by: string | null;
          attempts: number;
          max_attempts: number;
          error_log: Json;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
      };
      creator_identities: {
        Row: {
          creator_id: string;
          primary_niche: CreatorPrimaryNiche;
          technical_skills: string[];
          brand_tone: string[];
          content_format: string[];
          audience_size_tier: AudienceSizeTier;
          past_topics: string[];
          bio_summary: string | null;
          extraction_confidence: number;
          llm_provider: string;
          llm_model: string;
          prompt_version: string;
          prompt_hash: string;
          llm_request_id: string | null;
          processing_duration_ms: number | null;
          input_tokens: number | null;
          output_tokens: number | null;
          estimated_cost_usd: number | null;
          raw_model_output: Json;
          updated_at: string;
        };
      };
      platform_data: {
        Row: {
          id: string;
          creator_id: string;
          link_id: string | null;
          platform: CreatorPlatform;
          external_id: string | null;
          handle: string | null;
          identity_key: string;
          metrics: Json;
          recent_items: Json;
          raw_payload: Json;
          verified_via: string;
          fetched_at: string;
          created_at: string;
        };
      };
      creator_processing_events: {
        Row: {
          id: number;
          creator_id: string;
          event_type: string;
          message: string;
          payload: Json;
          created_at: string;
        };
      };
      external_api_tokens: {
        Row: {
          id: string;
          creator_id: string;
          provider: string;
          access_token: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      social_cache: {
        Row: {
          id: string;
          creator_id: string;
          platform: string;
          handle: string | null;
          profile_data: Json;
          recent_media: Json;
          synced_at: string;
        };
      };
    };
    Functions: {
      claim_scraping_jobs: {
        Args: {
          p_worker_id: string;
          p_batch_size?: number;
          p_lock_timeout?: string;
        };
        Returns: Database["public"]["Tables"]["scraping_queue"]["Row"][];
      };
      claim_analysis_jobs: {
        Args: {
          p_worker_id: string;
          p_batch_size?: number;
          p_lock_timeout?: string;
        };
        Returns: Database["public"]["Tables"]["analysis_queue"]["Row"][];
      };
    };
  };
};
