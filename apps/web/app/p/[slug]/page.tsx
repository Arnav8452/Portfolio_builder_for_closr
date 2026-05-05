import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { Github, Youtube, Code, Users, Activity, ExternalLink } from "lucide-react";

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
    return <ProfileView profile={demoProfile} />;
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
  const youtubeMetrics = profile.platform_metrics?.find((m) => m.platform === "youtube");
  const githubMetrics = profile.platform_metrics?.find((m) => m.platform === "github");

  return (
    <main className="premium-page fade-in">
      <header className="portfolio-header">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          {profile.owner_image ? (
            <div style={{ width: 88, height: 88, border: "3px solid var(--arcade-ink)", boxShadow: "4px 4px 0 0 var(--arcade-ink)", overflow: "hidden" }}>
              <img 
                src={profile.owner_image} 
                alt={profile.display_name} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : (
            <div style={{ width: 88, height: 88, background: "var(--arcade-cream-soft)", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid var(--arcade-ink)", fontFamily: "'Press Start 2P', monospace", fontSize: "24px", color: "var(--arcade-ink)", boxShadow: "4px 4px 0 0 var(--arcade-ink)" }}>
              {profile.display_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="eyebrow" style={{ marginBottom: "1rem", color: "var(--arcade-green)" }}>Verified Creator Identity</div>
        <h1>{profile.display_name}</h1>
        <p>{profile.bio_summary ?? "Verification is still processing."}</p>
        <div className="chips" style={{ justifyContent: "center", marginTop: "1.5rem", flexWrap: "wrap", gap: "10px" }}>
          <span className="premium-chip">{profile.primary_niche ?? "pending"}</span>
          <span className="premium-chip">{profile.audience_size_tier ?? "audience pending"}</span>
        </div>
      </header>

      <div className="portfolio-layout">
        <aside className="stack">
          <div className="glass-panel">
            <h2><Activity size={18} /> 01 · Identity Graph</h2>
            <div className="stack">
              <div>
                <span className="eyebrow" style={{ color: "var(--arcade-red)", fontFamily: "'Press Start 2P', monospace", fontSize: "8px" }}>Root Platform</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  {profile.root_platform === "youtube" ? <Youtube size={16} color="var(--arcade-red)" /> : <Github size={16} />}
                  <strong style={{ textTransform: "capitalize", fontFamily: "'VT323', monospace", fontSize: "22px" }}>{profile.root_platform}</strong>
                </div>
              </div>
              <hr style={{ borderColor: "var(--arcade-ink)" }} />
              <div>
                <span className="eyebrow" style={{ color: "var(--arcade-red)", fontFamily: "'Press Start 2P', monospace", fontSize: "8px" }}>Verified Links</span>
                <div className="stack" style={{ gap: "8px", marginTop: "8px" }}>
                  {profile.verified_links?.map((link) => (
                    <div key={`${link.platform}-${link.url}`} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", background: "var(--arcade-cream)", padding: "10px 14px", border: "2px solid var(--arcade-ink)", gap: "8px" }}>
                      <span style={{ fontSize: "14px", textTransform: "capitalize", wordBreak: "break-all" }}>{link.platform}</span>
                      <span className="badge" style={{ fontSize: "8px", whiteSpace: "nowrap" }}>Lvl {link.verification_level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <h2><Code size={18} /> 02 · Creator Traits</h2>
            <div style={{ marginBottom: "16px" }}>
              <span className="eyebrow" style={{ color: "var(--arcade-red)", fontFamily: "'Press Start 2P', monospace", fontSize: "8px" }}>Technical Skills</span>
              <div className="skills-tags" style={{ marginTop: "8px" }}>
                {profile.technical_skills?.map((skill) => (
                  <span className="chip" key={skill}>{skill}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="eyebrow" style={{ color: "var(--arcade-red)", fontFamily: "'Press Start 2P', monospace", fontSize: "8px" }}>Content Formats</span>
              <div className="skills-tags" style={{ marginTop: "8px" }}>
                {profile.content_format?.map((format) => (
                  <span className="chip" key={format}>{format}</span>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="stack">
          {youtubeMetrics && <YouTubeCard metrics={youtubeMetrics.raw_payload} />}
          {githubMetrics && <GitHubCard metrics={githubMetrics.raw_payload} />}
          
          {!youtubeMetrics && !githubMetrics && (
             <div className="glass-panel" style={{ textAlign: "center", padding: "48px 24px" }}>
               <Activity size={48} style={{ color: "var(--muted-2)", margin: "0 auto 16px" }} />
               <h2>Data Collection in Progress</h2>
               <p>The Oracle workers are currently parsing the external data platforms. Advanced analytics will appear here shortly.</p>
             </div>
          )}
        </section>
      </div>
    </main>
  );
}

function YouTubeCard({ metrics }: { metrics: any }) {
  const watchData = metrics?.engagement?.[0] || [];
  const views = watchData[0] ? watchData[0].toLocaleString() : "N/A";
  const watchTime = watchData[1] ? Math.floor(watchData[1] / 60).toLocaleString() : "N/A";

  const demoData = metrics?.demographics || [];
  const topDemo = demoData.length > 0 ? demoData[0] : null;

  return (
    <div className="glass-panel" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "var(--arcade-red)" }} />
      <h2><Youtube size={20} color="var(--arcade-red)" /> 03 · YouTube Analytics</h2>
      <p style={{ marginBottom: "24px", fontFamily: "'VT323', monospace", fontSize: "18px", color: "var(--muted)" }}>Cryptographically verified via NextAuth Oracle Worker.</p>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Verified Views</div>
          <div className="stat-value">{views}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Watch Time (Hrs)</div>
          <div className="stat-value">{watchTime}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Top Demographic</div>
          <div className="stat-value" style={{ fontSize: "20px", marginTop: "4px" }}>
            {topDemo ? `${topDemo[0]} / ${topDemo[1]} (${topDemo[2].toFixed(1)}%)` : "Pending"}
          </div>
        </div>
      </div>
    </div>
  );
}

function GitHubCard({ metrics }: { metrics: any }) {
  const profile = metrics?.profile || {};
  const repos = metrics?.repos || [];

  return (
    <div className="glass-panel" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "var(--arcade-ink)" }} />
      <h2><Github size={20} /> 04 · GitHub Telemetry</h2>
      
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-label">Public Repos</div>
          <div className="stat-value">{profile.public_repos || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Followers</div>
          <div className="stat-value">{profile.followers || 0}</div>
        </div>
      </div>

      <h3 style={{ color: "var(--arcade-yellow)", marginBottom: "12px" }}>Recent Activity</h3>
      <div className="stack" style={{ gap: "10px" }}>
        {repos.slice(0, 3).map((repo: any) => (
          <div key={repo.id} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "var(--arcade-cream)", border: "2px solid var(--arcade-ink)", gap: "10px" }}>
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: "var(--arcade-ink)", wordBreak: "break-word" }}>{repo.name}</div>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: "16px", color: "var(--muted)", marginTop: "4px" }}>{repo.language || "Mixed"}</div>
            </div>
            <a href={repo.html_url} target="_blank" rel="noreferrer" style={{ color: "var(--muted-2)", flexShrink: 0, padding: "4px" }}><ExternalLink size={18} /></a>
          </div>
        ))}
      </div>
    </div>
  );
}

const demoProfile: PublicProfile = {
  slug: "demo",
  display_name: "Demo Creator",
  root_platform: "youtube",
  root_handle: "demo_creator",
  primary_niche: "AI / Machine Learning",
  technical_skills: ["Python", "TensorFlow", "React", "Next.js"],
  brand_tone: ["educational", "technical", "engaging"],
  content_format: ["long-form tutorials", "code walkthroughs"],
  audience_size_tier: "Mid-Market (50k-250k)",
  past_topics: ["Local LLMs", "AI Agents", "React Server Components"],
  bio_summary: "A technical educator specializing in making complex AI concepts accessible to full-stack developers.",
  confidence: 0.98,
  owner_image: "https://github.com/shadcn.png",
  verified_links: [
    { platform: "youtube", url: "https://youtube.com/c/demo", verification_level: 3, verification_status: "oauth_verified" },
    { platform: "github", url: "https://github.com/demo", verification_level: 3, verification_status: "oauth_verified" },
  ],
  platform_metrics: [
    {
      platform: "youtube",
      identity_key: "default",
      fetched_at: new Date().toISOString(),
      raw_payload: {
        engagement: [[1250430, 8420000]],
        demographics: [
          ["age25-34", "male", 42.5],
          ["age18-24", "male", 31.2]
        ]
      }
    },
    {
      platform: "github",
      identity_key: "default",
      fetched_at: new Date().toISOString(),
      raw_payload: {
        profile: {
          public_repos: 42,
          followers: 1205
        },
        repos: [
          { id: 1, name: "ai-agent-framework", language: "TypeScript", html_url: "#" },
          { id: 2, name: "local-llm-tools", language: "Python", html_url: "#" },
          { id: 3, name: "nextjs-dashboard", language: "TypeScript", html_url: "#" }
        ]
      }
    }
  ]
};
