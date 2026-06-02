import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Activity } from "lucide-react";
import { RetroHeader } from "@/components/retro/RetroHeader";
import { RetroRadar } from "@/components/retro/RetroRadar";
import { RetroStats } from "@/components/retro/RetroStats";
import { RetroNumbers } from "@/components/retro/RetroNumbers";
import { RetroPlatformData } from "@/components/retro/RetroPlatformData";
import { AutoRefresh } from "@/components/AutoRefresh";
import { BuildingBanner } from "@/components/retro/BuildingBanner";
import { MatchmakingCard } from "@/components/retro/MatchmakingCard";
import { LiveResume } from "@/components/retro/LiveResume";
import { ColorfulCards } from "@/components/retro/ColorfulCards";

type PlatformMetric = {
  platform: string;
  identity_key: string;
  raw_payload: any;
  fetched_at: string;
};

type PublicProfile = {
  slug: string;
  onboarding_status: string;
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
    experience?: { company: string; role: string; timeframe: string; description: string }[];
    projects?: { name: string; description: string; url?: string }[];
    achievements?: { title: string; description: string; url?: string }[];
    timeline_events?: { date: string; title: string; description: string }[];
    radar_scores?: {
      impact: number;
      consistency: number;
      quality: number;
      depth: number;
      breadth: number;
      community: number;
    };
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

import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  if (slug === "demo") return { title: "Demo Profile | Closr" };

  const { data } = await getSupabaseAdmin()
    .from("creators")
    .select("display_name, creator_identities(bio_summary), owner_user_id")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "Profile Not Found | Closr" };

  const displayName = data.display_name;
  
  const ciRaw = data.creator_identities as any;
  const ci = Array.isArray(ciRaw) ? (ciRaw[0] || {}) : (ciRaw || {});
  const bio = ci.bio_summary && ci.bio_summary !== "Pending summary." 
    ? ci.bio_summary 
    : `Explore the verified developer portfolio of ${displayName}.`;

  let imageUrl = undefined;
  if (data.owner_user_id) {
    const { data: user } = await getSupabaseAdmin()
      .schema("next_auth")
      .from("users")
      .select("image")
      .eq("id", data.owner_user_id)
      .single();
    if (user?.image) imageUrl = user.image;
  }

  return {
    title: `${displayName} | Verified Portfolio`,
    description: bio,
    openGraph: {
      title: `${displayName} | Verified Portfolio`,
      description: bio,
      type: "profile",
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} | Verified Portfolio`,
      description: bio,
      images: imageUrl ? [imageUrl] : [],
    }
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === "demo") {
    // Ignore demo for now, or just redirect
    notFound();
  }

  let data = null;
  const { data: viewData, error: viewError } = await getSupabaseAdmin()
    .from("public_creator_profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!viewError && viewData) {
    data = viewData;
  } else {
    // The view might be missing the 'live' status or have schema drift.
    // Manually reconstruct the profile from the core tables.
    const { data: creator } = await getSupabaseAdmin()
      .from("creators")
      .select(`
        id, slug, display_name, root_platform, root_handle, onboarding_status, owner_user_id,
        creator_identities ( primary_niche, technical_skills, brand_tone, content_format, audience_size_tier, past_topics, bio_summary, raw_model_output, extraction_confidence ),
        creator_links ( platform, normalized_url, verification_level, verification_status, last_verified_at ),
        platform_data ( platform, identity_key, raw_payload, fetched_at )
      `)
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

    if (creator && ['completed', 'analysis_completed', 'intake', 'live'].includes(creator.onboarding_status)) {
       const ciRaw = creator.creator_identities as any;
       const ci = Array.isArray(ciRaw) ? (ciRaw[0] || {}) : (ciRaw || {});
       
       let owner_image = null;
       if (creator.owner_user_id) {
           const { data: user } = await getSupabaseAdmin().schema("next_auth").from("users").select("image").eq("id", creator.owner_user_id).single();
           owner_image = user?.image;
       }

       data = {
         id: creator.id,
         slug: creator.slug,
         onboarding_status: creator.onboarding_status,
         display_name: creator.display_name,
         root_platform: creator.root_platform,
         root_handle: creator.root_handle,
         primary_niche: typeof ci.primary_niche === "string" ? ci.primary_niche : 'other',
         technical_skills: Array.isArray(ci.technical_skills) ? ci.technical_skills : [],
         brand_tone: Array.isArray(ci.brand_tone) ? ci.brand_tone : [],
         content_format: Array.isArray(ci.content_format) ? ci.content_format : [],
         audience_size_tier: typeof ci.audience_size_tier === "string" ? ci.audience_size_tier : null,
         past_topics: Array.isArray(ci.past_topics) ? ci.past_topics : [],
         bio_summary: typeof ci.bio_summary === "string" ? ci.bio_summary : null,
         extra_analysis: typeof ci.raw_model_output === "object" ? ci.raw_model_output : null,
         confidence: ci.extraction_confidence,
         owner_image: owner_image,
         verified_links: Array.isArray(creator.creator_links) ? creator.creator_links.map((cl: any) => ({ ...cl, url: cl.normalized_url })).sort((a: any, b: any) => b.verification_level - a.verification_level) : [],
         platform_metrics: Array.isArray(creator.platform_data) ? creator.platform_data.sort((a: any, b: any) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime()) : []
       };
    } else {
       notFound();
    }
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

  // The production DB view is ALSO missing 'platform_metrics'. We must fetch it manually from 'platform_data'.
  if (!data.platform_metrics) {
    const { data: pdData } = await getSupabaseAdmin()
      .from("platform_data")
      .select("platform, identity_key, raw_payload, fetched_at")
      .eq("creator_id", data.id)
      .order("fetched_at", { ascending: false });

    if (pdData && pdData.length > 0) {
      data.platform_metrics = pdData;
    } else {
      data.platform_metrics = [];
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
    baseScore = ((radar.impact || 0) + (radar.consistency || 0) + (radar.quality || 0) + (radar.depth || 0) + (radar.breadth || 0) + (radar.community || 0)) / 6;
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
  
  if (githubMetrics?.raw_payload?.contributions?.repositories?.nodes && Array.isArray(githubMetrics.raw_payload.contributions.repositories.nodes)) {
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.display_name,
    description: profile.bio_summary || `Verified developer portfolio of ${profile.display_name}`,
    url: `https://closr.to/p/${profile.slug}`,
    sameAs: profile.verified_links.map(l => l.url),
    knowsAbout: [
      ...(profile.primary_niche ? [profile.primary_niche] : []),
      ...(profile.technical_skills || []),
      ...(profile.past_topics || [])
    ]
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {(!profile.confidence || profile.onboarding_status === "analysis_completed" || profile.bio_summary === "Pending summary." || !profile.extra_analysis || Object.keys(profile.extra_analysis).length === 0) && (
        <BuildingBanner />
      )}

      <div className="bento-grid" style={{ paddingTop: (!profile.confidence || profile.bio_summary === "Pending summary.") ? 0 : undefined }}>
        {/* Matchmaking Lead Gen Card */}
        <div id="matchmaking-tool" style={{ gridColumn: "1 / -1", scrollMarginTop: "32px" }}>
          <MatchmakingCard slug={profile.slug} />
        </div>

        {/* 1. Main Header */}
        <div style={{ gridColumn: "1 / -1" }}>
          <RetroHeader 
            profile={profile} 
            displayImage={displayImage} 
            overallScore={overallScore}
            isTrustworthy={isTrustworthy}
          />
        </div>

        {/* --- LEFT COLUMN --- */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", minWidth: 0, overflow: "hidden" }}>
          {/* Category Breakdown (Radar Chart) */}
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <RetroRadar scores={profile.extra_analysis?.radar_scores} />
          </div>

          {/* Stats (Heatmap & Pie) */}
          {languages.length > 0 && (
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <RetroStats languages={languages} />
            </div>
          )}

          {/* Numbers */}
          {statsNumbers.length > 0 && (
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <RetroNumbers stats={statsNumbers} />
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div style={{ display: "flex", flexDirection: "column", gap: "64px", minWidth: 0, overflow: "hidden" }}>
          {/* Live Resume (Experience only now) */}
          <div id="cv-upload-tool" style={{ scrollMarginTop: "32px" }}>
            <LiveResume experience={
              profile.extra_analysis?.experience || 
              profile.extra_analysis?.timeline_events?.map(t => ({
                role: t.title,
                company: "Milestone",
                timeframe: t.date,
                description: t.description
              }))
            } />
          </div>
          
          {/* Colorful Data Cards (Projects + Legacy Achievements) */}
          <ColorfulCards 
            items={[
              ...(profile.extra_analysis?.projects || []).slice(0, 4).map(p => ({ title: p.name, description: p.description, url: p.url })),
              ...(profile.extra_analysis?.achievements || []).slice(0, 4).map(a => ({ title: a.title, description: a.description, url: a.url }))
            ].slice(0, 6)}
          />
        </div>
        
        {/* Full Width Footer Data */}
        <div style={{ gridColumn: "1 / -1", marginTop: "32px" }}>
          {profile.platform_metrics && profile.platform_metrics.length > 0 && (
            <RetroPlatformData metrics={profile.platform_metrics} links={profile.verified_links} />
          )}
        </div>
      </div>
      
      {/* Footer Padding */}
      <div style={{ height: "64px", backgroundColor: "var(--arcade-cream)" }} />
    </main>
  );
}

