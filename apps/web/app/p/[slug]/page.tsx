import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { Activity } from "lucide-react";
import { RetroHeader } from "@/components/retro/RetroHeader";
import { RetroCards } from "@/components/retro/RetroCards";
import { RetroRadar } from "@/components/retro/RetroRadar";
import { RetroStats } from "@/components/retro/RetroStats";
import { RetroNumbers } from "@/components/retro/RetroNumbers";

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

  if (error || !data) notFound();
  return <ProfileView profile={data as PublicProfile} />;
}

function ProfileView({ profile }: { profile: PublicProfile }) {
  const githubMetrics = profile.platform_metrics?.find((m) => m.platform === "github");
  const twitchMetrics = profile.platform_metrics?.find((m) => m.platform === "twitch");
  const youtubeMetrics = profile.platform_metrics?.find((m) => m.platform === "youtube");

  const displayImage = 
    (profile.root_platform === "github" ? githubMetrics?.raw_payload?.profile?.avatar_url : null) ||
    (profile.root_platform === "twitch" ? twitchMetrics?.raw_payload?.profile?.profile_image_url : null) ||
    githubMetrics?.raw_payload?.profile?.avatar_url ||
    twitchMetrics?.raw_payload?.profile?.profile_image_url ||
    profile.owner_image || 
    null;

  // Compute Overall Score based on confidence or radar
  const radar = profile.extra_analysis?.radar_scores;
  let overallScore = profile.confidence ? profile.confidence * 100 : 50;
  if (radar) {
    overallScore = (radar.impact + radar.consistency + radar.quality + radar.depth + radar.breadth + radar.community) / 6;
  }

  // Parse GitHub Languages for Pie Chart
  let languages: { name: string; value: number }[] = [];
  let statsNumbers: { label: string; subLabel: string; value: string | number }[] = [];
  
  if (githubMetrics) {
    const nodes = githubMetrics.raw_payload?.contributions?.repositories?.nodes || [];
    const byLang = new Map<string, number>();
    for (const r of nodes) {
      for (const e of r?.languages?.edges || []) {
        byLang.set(e.node.name, (byLang.get(e.node.name) ?? 0) + e.size);
      }
    }
    const totalBytes = Array.from(byLang.values()).reduce((a, b) => a + b, 0);
    languages = Array.from(byLang.entries())
      .map(([name, bytes]) => ({
        name,
        value: Math.round((bytes / totalBytes) * 100),
      }))
      .filter((l) => l.value > 0)
      .sort((a, b) => b.value - a.value);

    const ghProfile = githubMetrics.raw_payload?.profile || {};
    statsNumbers = [
      { label: "OWNED REPOS", subLabel: "NON-FORK", value: ghProfile.public_repos || 0 },
      { label: "COMMITS", subLabel: "LAST 12 MONTHS", value: githubMetrics.raw_payload?.contributions?.contributionsCollection?.totalCommitContributions || 0 },
      { label: "FOLLOWERS", subLabel: "COMMUNITY", value: ghProfile.followers || 0 },
      { label: "JOINED GITHUB", subLabel: "ACCOUNT CREATED", value: ghProfile.created_at ? new Date(ghProfile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : "N/A" }
    ];
  } else if (youtubeMetrics) {
    const watchData = youtubeMetrics.raw_payload?.engagement?.[0] || [];
    statsNumbers = [
      { label: "VIEWS", subLabel: "TOTAL LIFETIME", value: watchData[0] ? watchData[0].toLocaleString() : 0 },
      { label: "WATCH TIME", subLabel: "MINUTES", value: watchData[1] ? watchData[1].toLocaleString() : 0 },
      { label: "AVG DURATION", subLabel: "SECONDS", value: watchData[2] ? watchData[2].toLocaleString() : 0 }
    ];
  }

  // Wait for Data Fallback
  if (!githubMetrics && !youtubeMetrics && !profile.extra_analysis) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "var(--arcade-cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="pixel-border" style={{ textAlign: "center", padding: "48px 24px", backgroundColor: "var(--arcade-cream-soft)" }}>
          <Activity size={48} style={{ color: "var(--arcade-ink)", margin: "0 auto 16px" }} />
          <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "16px", color: "var(--arcade-ink)" }}>DATA COLLECTION IN PROGRESS</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", marginTop: "16px", color: "var(--muted-2)" }}>The Oracle workers are currently parsing the external data platforms.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--arcade-cream)" }}>
      {/* 1. Main Header */}
      <RetroHeader 
        profile={profile} 
        displayImage={displayImage} 
        overallScore={overallScore} 
      />

      {/* 2. Roasts / Achievements Cards */}
      <RetroCards achievements={profile.extra_analysis?.achievements} />

      {/* 3. Category Breakdown (Radar Chart) */}
      <RetroRadar scores={profile.extra_analysis?.radar_scores} />

      {/* 4. Stats (Heatmap & Pie) */}
      <RetroStats languages={languages} />

      {/* 5. Numbers */}
      <RetroNumbers stats={statsNumbers} />
      
      {/* Footer Padding */}
      <div style={{ height: "64px", backgroundColor: "var(--arcade-cream)" }} />
    </main>
  );
}
