import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Activity } from "lucide-react";
import { RetroHeader } from "@/components/retro/RetroHeader";
import { RetroCards } from "@/components/retro/RetroCards";
import { RetroRadar } from "@/components/retro/RetroRadar";
import { RetroStats } from "@/components/retro/RetroStats";
import { RetroNumbers } from "@/components/retro/RetroNumbers";
import { RetroPlatformData } from "@/components/retro/RetroPlatformData";
import { AutoRefresh } from "@/components/AutoRefresh";

type PlatformMetric = {
  platform: string;
  identity_key: string;
  raw_payload: any;
  fetched_at: string;
};

type PublicProfile = {
  slug: string;
  display_name: string;
  root_platform: string;
  root_handle: string | null;
  primary_niche: string | null;
  technical_skills: string[] | null;
  brand_tone: string[] | null;
  content_format: string[] | null;
  audience_size_tier: string | null;
  past_topics: string[] | null;
  bio_summary: string | null;
  confidence: number | null;
  extra_analysis?: {
    achievements?: { title: string; description: string }[];
    radar_scores?: {
      impact: number;
      consistency: number;
      quality: number;
      depth: number;
      breadth: number;
      community: number;
    };
    timeline_events?: { date: string; title: string; description: string }[];
  };
  verified_links: Array<{
    platform: string;
    url: string;
    verification_level: number;
    verification_status: string;
  }>;
  platform_metrics?: PlatformMetric[];
  owner_image?: string | null;
};

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === "demo") {
    // Ignore demo for now, or just redirect
    notFound();
  }

  const { data, error } = await getSupabaseAdmin()
    .from("public_creator_profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    const { data: creator } = await getSupabaseAdmin()
      .from("creators")
      .select("id, slug, onboarding_status")
      .eq("slug", slug)
      .single();

    if (creator && (creator.onboarding_status === "queued" || creator.onboarding_status === "processing")) {
      return (
        <main style={{ minHeight: "100vh", backgroundColor: "var(--arcade-cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="pixel-border" style={{ textAlign: "center", padding: "clamp(32px, 5vw, 48px) clamp(16px, 5vw, 24px)", margin: "0 16px", backgroundColor: "var(--arcade-cream-soft)" }}>
            <Activity size={48} style={{ color: "var(--arcade-ink)", margin: "0 auto 16px" }} />
            <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "16px", color: "var(--arcade-ink)" }}>DATA COLLECTION IN PROGRESS</h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", marginTop: "16px", color: "var(--muted-2)" }}>The Oracle workers are currently parsing the external data platforms.</p>
          </div>
          <AutoRefresh />
        </main>
      );
    }
    notFound();
  }

  // The production DB view 'public_creator_profiles' is currently missing the 'extra_analysis' column.
  // We manually fetch it from 'creator_identities' to ensure data cards render.
  if (!data.extra_analysis) {
    const { data: ciData } = await getSupabaseAdmin()
      .from("creator_identities")
      .select("raw_model_output")
      .eq("creator_id", data.id)
      .single();
      
    if (ciData?.raw_model_output) {
      data.extra_analysis = ciData.raw_model_output;
    }
  }

  return <ProfileView profile={data as PublicProfile} />;
}

function ProfileView({ profile }: { profile: PublicProfile }) {
  const githubMetrics = profile.platform_metrics?.find((m) => m.platform === "github");
  const twitchMetrics = profile.platform_metrics?.find((m) => m.platform === "twitch");
  const youtubeMetrics = profile.platform_metrics?.find((m) => m.platform === "youtube");
  const linkedinMetrics = profile.platform_metrics?.find((m) => m.platform === "linkedin");
  const instagramMetrics = profile.platform_metrics?.find((m) => m.platform === "instagram");

  const displayImage = 
    (profile.root_platform === "github" ? githubMetrics?.raw_payload?.profile?.avatar_url : null) ||
    (profile.root_platform === "twitch" ? twitchMetrics?.raw_payload?.profile?.profile_image_url : null) ||
    (profile.root_platform === "youtube" ? youtubeMetrics?.raw_payload?.profile?.snippet?.thumbnails?.high?.url : null) ||
    (profile.root_platform === "instagram" ? instagramMetrics?.raw_payload?.profile?.profile_picture_url : null) ||
    githubMetrics?.raw_payload?.profile?.avatar_url ||
    youtubeMetrics?.raw_payload?.profile?.snippet?.thumbnails?.high?.url ||
    instagramMetrics?.raw_payload?.profile?.profile_picture_url ||
    twitchMetrics?.raw_payload?.profile?.profile_image_url ||
    profile.owner_image || 
    null;

  // Compute Overall Score based on confidence or radar
  const radar = profile.extra_analysis?.radar_scores;
  let baseScore = profile.confidence ? profile.confidence * 100 : 50;
  if (radar) {
    baseScore = (radar.impact + radar.consistency + radar.quality + radar.depth + radar.breadth + radar.community) / 6;
  }

  // Gather stats about links for trust scoring
  const verifiedLinks = profile.verified_links || [];
  const rootNodes = verifiedLinks.filter(l => l.verification_level === 3 && l.verification_status === "oauth_verified").length;
  const challengeVerified = verifiedLinks.filter(l => l.verification_status === "challenge_verified").length;
  const claimed = verifiedLinks.filter(l => l.verification_status === "claimed").length;
  const inconsistent = verifiedLinks.filter(l => l.verification_status === "inconsistent_identity").length;

  let bonus = (rootNodes > 1 ? (rootNodes - 1) * 10 : 0) + (challengeVerified * 5);
  let penalty = (claimed * 10) + (inconsistent * 50);

  const overallScore = Math.max(0, Math.min(100, Math.round(baseScore + bonus - penalty)));
  const isTrustworthy = overallScore >= 40 && inconsistent === 0;

  // Parse GitHub Languages for Pie Chart — ONLY if GitHub data actually exists with repos
  let languages: { name: string; value: number }[] = [];
  let statsNumbers: { label: string; subLabel: string; value: string | number }[] = [];
  
  if (githubMetrics?.raw_payload?.contributions?.repositories?.nodes) {
    const nodes = githubMetrics.raw_payload.contributions.repositories.nodes;
    const byLang = new Map<string, number>();
    for (const r of nodes) {
      for (const e of r?.languages?.edges || []) {
        byLang.set(e.node.name, (byLang.get(e.node.name) ?? 0) + e.size);
      }
    }
    const totalBytes = Array.from(byLang.values()).reduce((a, b) => a + b, 0);
    if (totalBytes > 0) {
      languages = Array.from(byLang.entries())
        .map(([name, bytes]) => ({
          name,
          value: Math.round((bytes / totalBytes) * 100),
        }))
        .filter((l) => l.value > 0)
        .sort((a, b) => b.value - a.value);
    }

    const ghProfile = githubMetrics?.raw_payload?.profile;
    // Only show GitHub numbers if there's actual profile data with non-zero values
    if (ghProfile && (ghProfile.public_repos > 0 || ghProfile.followers > 0)) {
      statsNumbers.push(
        { label: "OWNED REPOS", subLabel: "GITHUB", value: ghProfile.public_repos || 0 },
        { label: "COMMITS", subLabel: "LAST 12 MONTHS", value: githubMetrics.raw_payload?.contributions?.contributionsCollection?.totalCommitContributions || 0 },
        { label: "FOLLOWERS", subLabel: "GITHUB", value: ghProfile.followers || 0 }
      );
    }
  } 
  
  if (youtubeMetrics?.raw_payload?.engagement) {
    const watchData = youtubeMetrics.raw_payload.engagement[0] || [];
    if (watchData.length > 0) {
      statsNumbers.push(
        { label: "YT VIEWS", subLabel: "LIFETIME", value: watchData[0] ? watchData[0].toLocaleString() : 0 },
        { label: "YT WATCH", subLabel: "MINUTES", value: watchData[1] ? watchData[1].toLocaleString() : 0 }
      );
    }
  }
  
  if (twitchMetrics?.raw_payload?.profile) {
    const twitchProfile = twitchMetrics.raw_payload.profile;
    statsNumbers.push(
      { label: "TWITCH VIEWS", subLabel: "TOTAL", value: twitchProfile.view_count ? twitchProfile.view_count.toLocaleString() : 0 }
    );
  }
  
  if (instagramMetrics?.raw_payload?.profile) {
    const igProfile = instagramMetrics.raw_payload.profile;
    if (igProfile.followers_count !== undefined) {
      statsNumbers.push(
        { label: "IG FOLLOWERS", subLabel: "COMMUNITY", value: igProfile.followers_count ? igProfile.followers_count.toLocaleString() : 0 },
        { label: "IG POSTS", subLabel: "MEDIA", value: igProfile.media_count ? igProfile.media_count.toLocaleString() : 0 }
      );
    }
  }

  // Wait for Data Fallback — show loading only if we have NO data at all
  const hasAnyMetrics = profile.platform_metrics && profile.platform_metrics.length > 0;
  if (!hasAnyMetrics && !profile.extra_analysis) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "var(--arcade-cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="pixel-border" style={{ textAlign: "center", padding: "clamp(32px, 5vw, 48px) clamp(16px, 5vw, 24px)", margin: "0 16px", backgroundColor: "var(--arcade-cream-soft)" }}>
          <Activity size={48} style={{ color: "var(--arcade-ink)", margin: "0 auto 16px" }} />
          <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "16px", color: "var(--arcade-ink)" }}>DATA COLLECTION IN PROGRESS</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", marginTop: "16px", color: "var(--muted-2)" }}>The Oracle workers are currently parsing the external data platforms.</p>
        </div>
        <AutoRefresh />
      </main>
    );
  }

  return (
    <main style={{ 
      minHeight: "100vh", 
      backgroundColor: "var(--arcade-cream)",
      "--arcade-red": "#E8333A",
      "--arcade-blue": "#3B82F6",
      "--arcade-green": "#7FFF00",
      "--arcade-yellow": "#F5A623",
      "--arcade-purple": "#9B59B6",
    } as React.CSSProperties}>
      <div className="bento-grid">
        {/* 1. Main Header */}
        <div style={{ gridColumn: "1 / -1" }}>
          <RetroHeader 
            profile={profile} 
            displayImage={displayImage} 
            overallScore={overallScore}
            isTrustworthy={isTrustworthy}
          />
        </div>

        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "64px" }}>
          {/* 3. Category Breakdown (Radar Chart) */}
          <RetroRadar scores={profile.extra_analysis?.radar_scores} />

          {/* 4. Stats (Heatmap & Pie) */}
          {languages.length > 0 && <RetroStats languages={languages} />}

          {/* 5. Numbers */}
          {statsNumbers.length > 0 && <RetroNumbers stats={statsNumbers} />}
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "64px" }}>
          {/* 2. Roasts / Achievements Cards */}
          <RetroCards achievements={profile.extra_analysis?.achievements} />
        </div>

        {/* 6. Platform Data Dumps */}
        {profile.platform_metrics && profile.platform_metrics.length > 0 && (
          <div style={{ gridColumn: "1 / -1" }}>
            <RetroPlatformData metrics={profile.platform_metrics} links={profile.verified_links} />
          </div>
        )}
      </div>
      
      {/* Footer Padding */}
      <div style={{ height: "64px", backgroundColor: "var(--arcade-cream)" }} />
    </main>
  );
}

