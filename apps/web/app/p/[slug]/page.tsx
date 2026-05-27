import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";

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
  const githubMetrics = profile.platform_metrics?.find((m) => m.platform === "github");
  const twitchMetrics = profile.platform_metrics?.find((m) => m.platform === "twitch");

  const displayImage = 
    profile.owner_image || 
    githubMetrics?.raw_payload?.profile?.avatar_url ||
    twitchMetrics?.raw_payload?.profile?.profile_image_url ||
    null;

  return (
    <main className="fade-in">
      {/* 1. Hero Banner */}
      <header className="rmg-banner">
        <div className="rmg-banner-inner">
          <div className="rmg-profile-section">
            <div className="rmg-avatar-container">
              {displayImage ? (
                <img src={displayImage} alt={profile.display_name} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '48px', fontFamily: "'Press Start 2P', monospace", color: 'var(--arcade-cream)' }}>
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div className="rmg-rank-text">#212 — TOP 81.7%</div>
              <h1 className="rmg-username">{profile.root_handle || profile.display_name}</h1>
              <p className="rmg-realname">{profile.display_name}</p>
              <p className="rmg-bio">{profile.bio_summary ?? "Verification is still processing. No data extracted yet."}</p>
            </div>
          </div>
          <div className="rmg-score-section">
            <div className="rmg-score-label">OVERALL</div>
            <div className="rmg-score-value">
              {((profile.confidence ?? 0.608) * 100).toFixed(1)}
            </div>
            <div className="rmg-score-max">/ 100</div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
        {/* 2. ROASTS GRID */}
        <section style={{ marginBottom: '64px' }}>
          <div className="rmg-section-header">
            01 · ROASTS
          </div>
          
          <div className="rmg-roast-grid">
            {profile.primary_niche ? (
              <div className="rmg-roast-card red">
                <div className="rmg-roast-title">NICHE OVERLORD</div>
                <div className="rmg-roast-desc">{profile.primary_niche}. We get it, you're deeply specialized.</div>
              </div>
            ) : (
              <div className="rmg-roast-card red">
                <div className="rmg-roast-title">BURST CODER, NOT A BUILDER (YET)</div>
                <div className="rmg-roast-desc">Your git history reads like a series of hackathon submissions that never got a second day.</div>
              </div>
            )}
            
            {profile.technical_skills && profile.technical_skills.length > 0 ? (
              <div className="rmg-roast-card yellow">
                <div className="rmg-roast-title">TECH STACK BINGO</div>
                <div className="rmg-roast-desc">
                  {profile.technical_skills.slice(0, 5).join(', ')}. Collecting languages like infinity stones.
                </div>
              </div>
            ) : (
              <div className="rmg-roast-card yellow">
                <div className="rmg-roast-title">ZERO FORKS IN THE PORTFOLIO</div>
                <div className="rmg-roast-desc">Lots of repos, zero forks. Ships fast, lands quietly.</div>
              </div>
            )}
            
            {profile.past_topics && profile.past_topics.length > 0 ? (
              <div className="rmg-roast-card blue">
                <div className="rmg-roast-title">BROKEN RECORD</div>
                <div className="rmg-roast-desc">
                  Constantly yapping about: {profile.past_topics.slice(0, 3).join(', ')}. Get a new script.
                </div>
              </div>
            ) : (
              <div className="rmg-roast-card blue">
                <div className="rmg-roast-title">THE RESUME REPO HAS A STAR</div>
                <div className="rmg-roast-desc">Your .docx resume host has the same star count as your actual AI gateway. The market has spoken.</div>
              </div>
            )}
            
            {profile.content_format && profile.content_format.length > 0 ? (
              <div className="rmg-roast-card purple">
                <div className="rmg-roast-title">FORMAT JUNKIE</div>
                <div className="rmg-roast-desc">
                  Known for {profile.content_format.join(' and ')}.
                </div>
              </div>
            ) : (
              <div className="rmg-roast-card purple">
                <div className="rmg-roast-title">TESTING IS A SPECTATOR SPORT</div>
                <div className="rmg-roast-desc">Five repos have HAS_TESTS=no. You clearly know what a test is — you just don't write them.</div>
              </div>
            )}

            {profile.brand_tone && profile.brand_tone.length > 0 ? (
              <div className="rmg-roast-card green">
                <div className="rmg-roast-title">THE VIBE CHECK</div>
                <div className="rmg-roast-desc">
                  Tone: {profile.brand_tone.join(', ')}. At least you're consistent.
                </div>
              </div>
            ) : (
              <div className="rmg-roast-card green">
                <div className="rmg-roast-title">100% SOLO, 3 FOLLOWERS</div>
                <div className="rmg-roast-desc">No collaborators, no review process. Three followers, two of whom are probably bots.</div>
              </div>
            )}
            
            <div className="rmg-roast-card black">
              <div className="rmg-roast-title">BUILT USING ZORAL</div>
              <div className="rmg-roast-desc" style={{ opacity: 0.8 }}>
                Shadows one worker for a week, then takes over their job with zero extra setup. Behaves exactly like the original.
              </div>
            </div>
          </div>
        </section>

        {/* 3. TIMELINE */}
        <section>
          <div className="rmg-section-header">
            06 · TIMELINE
          </div>
          
          <div className="rmg-timeline">
            {githubMetrics?.raw_payload?.repos?.slice(0, 6).map((repo: any) => {
              const date = repo.created_at ? new Date(repo.created_at) : new Date();
              const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
              
              return (
                <div className="rmg-timeline-item" key={repo.id || repo.name}>
                  <div className="rmg-timeline-date">{formattedDate}</div>
                  <div className="rmg-timeline-node"></div>
                  <div className="rmg-timeline-content">
                    Created <strong>{repo.name}</strong> {repo.description ? `— ${repo.description}` : ''}
                  </div>
                </div>
              );
            })}
            {!githubMetrics && (
              <div className="rmg-timeline-item">
                <div className="rmg-timeline-date">TODAY</div>
                <div className="rmg-timeline-node"></div>
                <div className="rmg-timeline-content">
                  Waiting for Oracle workers to fetch GitHub telemetry...
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const demoProfile: PublicProfile = {
  slug: "demo",
  display_name: "Demo Creator",
  root_platform: "github",
  root_handle: "demo_coder",
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
    { platform: "github", url: "https://github.com/demo", verification_level: 3, verification_status: "oauth_verified" },
  ],
  platform_metrics: [
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
          { id: 1, name: "ai-agent-framework", language: "TypeScript", created_at: "2024-01-15T12:00:00Z", html_url: "#" },
          { id: 2, name: "local-llm-tools", language: "Python", created_at: "2023-11-20T12:00:00Z", html_url: "#" },
          { id: 3, name: "nextjs-dashboard", language: "TypeScript", created_at: "2023-08-05T12:00:00Z", html_url: "#" }
        ]
      }
    }
  ]
};
