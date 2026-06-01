import React from "react";
import { Database, Terminal, Twitter, Github, Activity, LayoutGrid, Users, ExternalLink } from "lucide-react";

type PlatformMetric = {
  platform: string;
  identity_key: string;
  raw_payload: any;
  fetched_at: string;
};

type RetroPlatformDataProps = {
  metrics?: PlatformMetric[];
  links?: Array<{ platform: string; url: string; verification_level: number; verification_status: string }>;
};

function StatBadge({ label, value, bg = "var(--arcade-yellow)" }: { label: string, value: string | number, bg?: string }) {
  if (value === undefined || value === null) return null;
  return (
    <div style={{ 
      display: "inline-flex", 
      alignItems: "center", 
      border: "2px solid var(--arcade-ink)", 
      backgroundColor: bg,
      padding: "4px 8px",
      gap: "8px"
    }}>
      <span style={{ fontWeight: "bold", color: "var(--arcade-ink)", fontSize: "14px" }}>{label?.[0]?.toUpperCase() ?? "?"}</span>
      <span style={{ color: "var(--arcade-ink)", fontFamily: "'VT323', monospace", fontSize: "18px" }}>{value}</span>
    </div>
  );
}

// Generic component to render flat key-value pairs from an object
function GenericStats({ data }: { data: any }) {
  if (!data || typeof data !== "object") return null;
  
  const entries = Object.entries(data).filter(([k, v]) => 
    v !== null && v !== undefined && (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
  ).slice(0, 8);

  if (entries.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
      {entries.map(([k, v], i) => (
        <StatBadge key={k} label={k} value={String(v)} bg={i % 2 === 0 ? "var(--arcade-yellow)" : "var(--arcade-green)"} />
      ))}
    </div>
  );
}

// Custom Renderer for Twitter
function TwitterCard({ payload }: { payload: any }) {
  const profile = payload.profile || {};
  const tweets = payload.tweets || [];
  const noResults = tweets.length > 0 && tweets[0].noResults;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", flexGrow: 1 }}>
      {profile.description && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--arcade-ink)", lineHeight: 1.6, flexGrow: 1 }}>
          {profile.description}
        </p>
      )}
      
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <StatBadge label="Followers" value={profile.followers} bg="var(--arcade-yellow)" />
        <StatBadge label="Following" value={profile.following} bg="var(--arcade-green)" />
      </div>

      <div style={{ marginTop: "8px", paddingTop: "16px", borderTop: "2px solid var(--arcade-ink)" }}>
        <div style={{ color: "var(--arcade-ink)", fontSize: "12px", fontFamily: "'Press Start 2P', monospace", marginBottom: "16px", textTransform: "uppercase" }}>RECENT</div>
        {noResults || tweets.length === 0 ? (
          <div style={{ color: "var(--muted-2)", fontStyle: "italic", fontSize: "14px" }}>No recent transmissions.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {tweets.slice(0, 2).map((t: any, i: number) => t.text && (
              <div key={i} style={{ border: "2px solid var(--arcade-ink)", padding: "12px", backgroundColor: "white", boxShadow: "2px 2px 0 var(--arcade-ink)" }}>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--arcade-ink)", lineHeight: 1.5, wordBreak: "break-word" }}>{t.text}</p>
                <div style={{ display: "flex", gap: "16px", marginTop: "12px", color: "var(--arcade-ink)", fontSize: "14px", fontFamily: "'VT323', monospace" }}>
                  <span style={{ fontWeight: "bold" }}>H {t.likes || 0}</span>
                  <span style={{ fontWeight: "bold" }}>R {t.retweets || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Custom Renderer for GitHub
function GithubCard({ payload }: { payload: any }) {
  const profile = payload.profile || {};
  const repos = payload.contributions?.repositories?.nodes || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", flexGrow: 1 }}>
      {profile.bio && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--arcade-ink)", lineHeight: 1.6, flexGrow: 1 }}>
          {profile.bio}
        </p>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <StatBadge label="Repositories" value={repos.length} bg="var(--arcade-green)" />
      </div>

      <div style={{ marginTop: "8px", paddingTop: "16px", borderTop: "2px solid var(--arcade-ink)" }}>
        <div style={{ color: "var(--arcade-ink)", fontSize: "12px", fontFamily: "'Press Start 2P', monospace", marginBottom: "16px", textTransform: "uppercase" }}>REPOS</div>
        {repos.length === 0 ? (
          <div style={{ color: "var(--muted-2)", fontSize: "14px" }}>No repositories found.</div>
        ) : (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {repos.slice(0, 4).map((repo: any, i: number) => {
              const mainLang = repo.languages?.edges?.[0]?.node?.name || "Unknown";
              const RepoWrapper = repo.url ? "a" : "div";
              return (
                <RepoWrapper key={i} href={repo.url} target={repo.url ? "_blank" : undefined} rel={repo.url ? "noopener noreferrer" : undefined} style={{ padding: "8px 12px", border: "2px solid var(--arcade-ink)", backgroundColor: "white", boxShadow: "2px 2px 0 var(--arcade-ink)", textDecoration: "none", display: "block" }}>
                  <div style={{ fontWeight: "bold", color: "var(--arcade-ink)", fontSize: "14px", wordBreak: "break-all", display: "flex", alignItems: "center", gap: "8px" }}>
                    {repo.name}
                    {repo.url && <ExternalLink size={14} style={{ opacity: 0.5 }} />}
                  </div>
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--arcade-ink)", fontWeight: "bold" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--arcade-purple)", border: "1px solid var(--arcade-ink)" }} />
                    {mainLang}
                  </div>
                </RepoWrapper>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Custom Renderer for YouTube
function YoutubeCard({ payload }: { payload: any }) {
  const profile = payload.profile || {};
  const engagement = payload.engagement?.[0] || [];
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", flexGrow: 1 }}>
      {profile.description && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--arcade-ink)", lineHeight: 1.6, flexGrow: 1 }}>
          {profile.description}
        </p>
      )}
      
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <StatBadge label="Subscribers" value={profile.subscriberCount} bg="var(--arcade-red)" />
        <StatBadge label="Videos" value={profile.videoCount} bg="var(--arcade-yellow)" />
        <StatBadge label="Views" value={profile.viewCount} bg="var(--arcade-green)" />
      </div>
      
      {engagement.length > 0 && (
        <div style={{ marginTop: "8px", paddingTop: "16px", borderTop: "2px solid var(--arcade-ink)" }}>
          <div style={{ color: "var(--arcade-ink)", fontSize: "12px", fontFamily: "'Press Start 2P', monospace", marginBottom: "16px", textTransform: "uppercase" }}>ENGAGEMENT</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
             {engagement[0] !== undefined && <StatBadge label="Lifetime" value={engagement[0].toLocaleString()} bg="var(--arcade-purple)" />}
             {engagement[1] !== undefined && <StatBadge label="WatchTime" value={engagement[1].toLocaleString()} bg="var(--arcade-blue)" />}
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Renderer for Instagram
function InstagramCard({ payload }: { payload: any }) {
  const profile = payload.profile || {};
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", flexGrow: 1 }}>
      {profile.biography && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--arcade-ink)", lineHeight: 1.6, flexGrow: 1 }}>
          {profile.biography}
        </p>
      )}
      
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <StatBadge label="Followers" value={profile.followers_count} bg="var(--arcade-yellow)" />
        <StatBadge label="Posts" value={profile.media_count} bg="var(--arcade-green)" />
      </div>
      <GenericStats data={profile} />
    </div>
  );
}

// Custom Renderer for LinkedIn
function LinkedinCard({ payload }: { payload: any }) {
  const profile = payload.profile || {};
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", flexGrow: 1 }}>
      {profile.headline && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--arcade-ink)", lineHeight: 1.6, fontWeight: "bold" }}>
          {profile.headline}
        </p>
      )}
      {profile.summary && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--arcade-ink)", lineHeight: 1.6, flexGrow: 1 }}>
          {profile.summary}
        </p>
      )}
      
      <GenericStats data={profile} />
    </div>
  );
}

// Custom Renderer for Twitch
function TwitchCard({ payload }: { payload: any }) {
  const profile = payload.profile || {};
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", flexGrow: 1 }}>
      {profile.description && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--arcade-ink)", lineHeight: 1.6, flexGrow: 1 }}>
          {profile.description}
        </p>
      )}
      
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <StatBadge label="Views" value={profile.view_count} bg="var(--arcade-purple)" />
      </div>
      <GenericStats data={profile} />
    </div>
  );
}

// Custom Renderer for Website/Jina
function WebsiteCard({ payload }: { payload: any }) {
  const profile = payload.profile || {};
  const description = profile.description || "Website successfully scraped and analyzed.";
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", flexGrow: 1 }}>
      {profile.title && (
        <p style={{ margin: 0, fontSize: "16px", color: "var(--arcade-ink)", fontWeight: "bold", lineHeight: 1.4 }}>
          {profile.title}
        </p>
      )}
      <p style={{ margin: 0, fontSize: "14px", color: "var(--arcade-ink)", lineHeight: 1.6, flexGrow: 1 }}>
        {description}
      </p>
      
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <StatBadge label="Source" value={payload.source || "jina"} bg="var(--arcade-yellow)" />
        {payload.status && <StatBadge label="Status" value={payload.status} bg="var(--arcade-green)" />}
      </div>
    </div>
  );
}

export function RetroPlatformData({ metrics, links = [] }: RetroPlatformDataProps) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", width: "100%" }}>
      <h2 
        style={{ 
          fontFamily: "'Press Start 2P', monospace", 
          fontSize: "16px", 
          color: "var(--arcade-ink)",
          textTransform: "uppercase",
          display: "flex",
          gap: "16px",
          alignItems: "center"
        }}
      >
        <span style={{ color: "var(--arcade-red)" }}>04 .</span>
        <span>PLATFORM DOSSIERS</span>
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "32px" }}>
        {metrics.map((metric, idx) => {
          const p = metric.platform.toLowerCase();
          const isTwitter = p === "x" || p === "twitter";
          const isGithub = p === "github";
          const isYoutube = p === "youtube";
          const isInstagram = p === "instagram";
          const isLinkedin = p === "linkedin";
          const isTwitch = p === "twitch";
          const isWebsite = p === "website" || p === "blog" || p === "portfolio";
          
          let Icon = Terminal;
          if (isTwitter) Icon = Twitter;
          if (isGithub) Icon = Github;
          
          return (
            <div key={idx} style={{ 
              backgroundColor: "var(--arcade-cream-soft)", 
              padding: "24px", 
              border: "2px solid var(--arcade-ink)", 
              height: "100%", 
              boxShadow: "6px 6px 0 var(--arcade-ink)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}>
              
              <div style={{ marginBottom: "16px", borderBottom: "2px solid var(--arcade-ink)", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                {(() => {
                  const link = links.find(l => l.platform.toLowerCase() === p);
                  const HeaderWrapper = link?.url ? "a" : "div";
                  return (
                    <HeaderWrapper 
                      href={link?.url}
                      target={link?.url ? "_blank" : undefined}
                      rel={link?.url ? "noopener noreferrer" : undefined}
                      style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", cursor: link?.url ? "pointer" : "default" }}
                    >
                      <Icon size={24} style={{ color: "var(--arcade-ink)" }} />
                      <h3 style={{ margin: 0, fontFamily: "'Press Start 2P', monospace", fontSize: "20px", color: "var(--arcade-ink)", textTransform: "uppercase" }}>
                        {metric.platform}
                      </h3>
                      {link?.url && <ExternalLink size={20} style={{ color: "var(--arcade-ink)", opacity: 0.5 }} />}
                    </HeaderWrapper>
                  );
                })()}
                
                {(() => {
                  const link = links.find(l => l.platform.toLowerCase() === p);
                  if (!link) return null;
                  
                  let badgeText = "CLAIMED";
                  let bg = "var(--arcade-yellow)";
                  let color = "var(--arcade-ink)";
                  let anim = "none";
                  
                  if (link.verification_status === "oauth_verified") {
                    badgeText = "OAUTH VERIFIED";
                    bg = "var(--arcade-green)";
                  } else if (link.verification_status === "challenge_verified") {
                    badgeText = "CHALLENGE VERIFIED";
                    bg = "var(--arcade-green)";
                  }
                  // If verification fails or identity is inconsistent, degrade gracefully to CLAIMED 
                  // instead of aggressively rejecting it in the UI, as scrapers often fail on platforms like LinkedIn.

                  return (
                    <div style={{ 
                      backgroundColor: bg, 
                      color: color, 
                      padding: "4px 8px", 
                      border: `2px solid ${color}`,
                      fontFamily: "'VT323', monospace", 
                      fontSize: "14px", 
                      fontWeight: "bold",
                      animation: anim
                    }}>
                      {badgeText}
                    </div>
                  );
                })()}
              </div>

              {isTwitter ? (
                <TwitterCard payload={metric.raw_payload} />
              ) : isGithub ? (
                <GithubCard payload={metric.raw_payload} />
              ) : isYoutube ? (
                <YoutubeCard payload={metric.raw_payload} />
              ) : isInstagram ? (
                <InstagramCard payload={metric.raw_payload} />
              ) : isLinkedin ? (
                <LinkedinCard payload={metric.raw_payload} />
              ) : isTwitch ? (
                <TwitchCard payload={metric.raw_payload} />
              ) : isWebsite ? (
                <WebsiteCard payload={metric.raw_payload} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", flexGrow: 1 }}>
                  <GenericStats data={metric.raw_payload?.profile || metric.raw_payload} />
                  <div style={{ overflowX: "auto", maxWidth: "100%", marginTop: "8px", padding: "12px", border: "2px solid var(--arcade-ink)", backgroundColor: "white" }}>
                    <pre style={{ fontFamily: "'VT323', monospace", fontSize: "16px", color: "var(--arcade-ink)", margin: 0 }}>
                      {JSON.stringify(metric.raw_payload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
            </div>
          );
        })}
      </div>
    </div>
  );
}
