import React from "react";
import { Database, Terminal, Twitter, Github, Activity, LayoutGrid, Users } from "lucide-react";

type PlatformMetric = {
  platform: string;
  identity_key: string;
  raw_payload: any;
  fetched_at: string;
};

type RetroPlatformDataProps = {
  metrics?: PlatformMetric[];
};

// Generic component to render flat key-value pairs from an object
function GenericStats({ data }: { data: any }) {
  if (!data || typeof data !== "object") return null;
  
  const entries = Object.entries(data).filter(([k, v]) => 
    v !== null && v !== undefined && (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
  ).slice(0, 10);

  if (entries.length === 0) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ padding: "12px", border: "1px dashed var(--muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "10px", color: "var(--muted-2)", textTransform: "uppercase" }}>{k.replace(/_/g, " ")}</span>
          <span style={{ fontSize: "14px", color: "var(--arcade-cream)", fontWeight: 600 }}>{String(v)}</span>
        </div>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {profile.description && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--arcade-cream)", lineHeight: 1.6, borderLeft: "4px solid var(--arcade-blue)", paddingLeft: "12px" }}>
          {profile.description}
        </p>
      )}
      
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {profile.followers !== undefined && (
          <div style={{ border: "2px solid var(--arcade-blue)", padding: "12px", minWidth: "120px" }}>
            <div style={{ fontSize: "10px", color: "var(--arcade-blue)", marginBottom: "4px" }}>FOLLOWERS</div>
            <div style={{ fontSize: "20px", color: "white", fontFamily: "'Press Start 2P', monospace" }}>{profile.followers}</div>
          </div>
        )}
        {profile.following !== undefined && (
          <div style={{ border: "2px solid var(--arcade-blue)", padding: "12px", minWidth: "120px" }}>
            <div style={{ fontSize: "10px", color: "var(--arcade-blue)", marginBottom: "4px" }}>FOLLOWING</div>
            <div style={{ fontSize: "20px", color: "white", fontFamily: "'Press Start 2P', monospace" }}>{profile.following}</div>
          </div>
        )}
      </div>

      <div>
        <h4 style={{ color: "var(--arcade-blue)", fontSize: "12px", fontFamily: "'Press Start 2P', monospace", marginBottom: "16px" }}>RECENT TRANSMISSIONS</h4>
        {noResults || tweets.length === 0 ? (
          <div style={{ color: "var(--muted)", fontStyle: "italic", fontSize: "14px" }}>No recent tweets found or timeline is private.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {tweets.slice(0, 4).map((t: any, i: number) => t.text && (
              <div key={i} style={{ padding: "16px", backgroundColor: "rgba(59, 107, 181, 0.1)", border: "1px solid var(--arcade-blue)", borderRadius: "4px" }}>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--arcade-cream)", lineHeight: 1.5 }}>{t.text}</p>
                <div style={{ display: "flex", gap: "16px", marginTop: "12px", color: "var(--muted)", fontSize: "12px" }}>
                  <span>❤️ {t.likes || 0}</span>
                  <span>🔄 {t.retweets || 0}</span>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {profile.bio && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--arcade-cream)", lineHeight: 1.6, borderLeft: "4px solid var(--arcade-cream)", paddingLeft: "12px" }}>
          {profile.bio}
        </p>
      )}

      <div>
        <h4 style={{ color: "var(--arcade-cream)", fontSize: "12px", fontFamily: "'Press Start 2P', monospace", marginBottom: "16px" }}>TOP REPOSITORIES</h4>
        {repos.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: "14px" }}>No repositories found.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
            {repos.slice(0, 6).map((repo: any, i: number) => {
              const mainLang = repo.languages?.edges?.[0]?.node?.name || "Unknown";
              return (
                <div key={i} style={{ padding: "16px", border: "1px solid var(--muted-2)" }}>
                  <div style={{ fontWeight: "bold", color: "white", marginBottom: "8px", fontSize: "14px", wordBreak: "break-all" }}>{repo.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--muted)" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--arcade-green)" }} />
                    {mainLang}
                  </div>
                </div>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {engagement[0] !== undefined && (
          <div style={{ border: "2px solid var(--arcade-red)", padding: "12px", minWidth: "120px" }}>
            <div style={{ fontSize: "10px", color: "var(--arcade-red)", marginBottom: "4px" }}>LIFETIME VIEWS</div>
            <div style={{ fontSize: "20px", color: "white", fontFamily: "'Press Start 2P', monospace" }}>{engagement[0].toLocaleString()}</div>
          </div>
        )}
        {engagement[1] !== undefined && (
          <div style={{ border: "2px solid var(--arcade-red)", padding: "12px", minWidth: "120px" }}>
            <div style={{ fontSize: "10px", color: "var(--arcade-red)", marginBottom: "4px" }}>WATCH MINUTES</div>
            <div style={{ fontSize: "20px", color: "white", fontFamily: "'Press Start 2P', monospace" }}>{engagement[1].toLocaleString()}</div>
          </div>
        )}
      </div>
      <GenericStats data={profile} />
    </div>
  );
}

// Custom Renderer for Instagram
function InstagramCard({ payload }: { payload: any }) {
  const profile = payload.profile || {};
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {profile.biography && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--arcade-cream)", lineHeight: 1.6, borderLeft: "4px solid #E4405F", paddingLeft: "12px" }}>
          {profile.biography}
        </p>
      )}
      
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {profile.followers_count !== undefined && (
          <div style={{ border: "2px solid #E4405F", padding: "12px", minWidth: "120px" }}>
            <div style={{ fontSize: "10px", color: "#E4405F", marginBottom: "4px" }}>FOLLOWERS</div>
            <div style={{ fontSize: "20px", color: "white", fontFamily: "'Press Start 2P', monospace" }}>{profile.followers_count.toLocaleString()}</div>
          </div>
        )}
        {profile.media_count !== undefined && (
          <div style={{ border: "2px solid #E4405F", padding: "12px", minWidth: "120px" }}>
            <div style={{ fontSize: "10px", color: "#E4405F", marginBottom: "4px" }}>POSTS</div>
            <div style={{ fontSize: "20px", color: "white", fontFamily: "'Press Start 2P', monospace" }}>{profile.media_count.toLocaleString()}</div>
          </div>
        )}
      </div>
      <GenericStats data={profile} />
    </div>
  );
}

// Custom Renderer for LinkedIn
function LinkedinCard({ payload }: { payload: any }) {
  const profile = payload.profile || {};
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {profile.headline && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--arcade-cream)", lineHeight: 1.6, borderLeft: "4px solid #0077B5", paddingLeft: "12px", fontWeight: "bold" }}>
          {profile.headline}
        </p>
      )}
      {profile.summary && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", lineHeight: 1.6 }}>
          {profile.summary}
        </p>
      )}
      
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {profile.connections !== undefined && (
          <div style={{ border: "2px solid #0077B5", padding: "12px", minWidth: "120px" }}>
            <div style={{ fontSize: "10px", color: "#0077B5", marginBottom: "4px" }}>CONNECTIONS</div>
            <div style={{ fontSize: "20px", color: "white", fontFamily: "'Press Start 2P', monospace" }}>{profile.connections}</div>
          </div>
        )}
      </div>
      <GenericStats data={profile} />
    </div>
  );
}

// Custom Renderer for Twitch
function TwitchCard({ payload }: { payload: any }) {
  const profile = payload.profile || {};
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {profile.description && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--arcade-cream)", lineHeight: 1.6, borderLeft: "4px solid var(--arcade-purple)", paddingLeft: "12px" }}>
          {profile.description}
        </p>
      )}
      
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {profile.view_count !== undefined && (
          <div style={{ border: "2px solid var(--arcade-purple)", padding: "12px", minWidth: "120px" }}>
            <div style={{ fontSize: "10px", color: "var(--arcade-purple)", marginBottom: "4px" }}>TOTAL VIEWS</div>
            <div style={{ fontSize: "20px", color: "white", fontFamily: "'Press Start 2P', monospace" }}>{profile.view_count.toLocaleString()}</div>
          </div>
        )}
      </div>
      <GenericStats data={profile} />
    </div>
  );
}

export function RetroPlatformData({ metrics }: RetroPlatformDataProps) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div style={{ padding: "48px 24px", backgroundColor: "var(--arcade-cream)", borderTop: "2px solid var(--arcade-ink)" }}>
      <h2 
        style={{ 
          fontFamily: "'Press Start 2P', monospace", 
          fontSize: "16px", 
          color: "var(--arcade-ink)",
          textTransform: "uppercase",
          marginBottom: "32px",
          display: "flex",
          gap: "16px",
          alignItems: "center"
        }}
      >
        <span>PLATFORM DOSSIERS</span>
        <LayoutGrid size={20} />
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {metrics.map((metric, idx) => {
          const p = metric.platform.toLowerCase();
          const isTwitter = p === "x" || p === "twitter";
          const isGithub = p === "github";
          const isYoutube = p === "youtube";
          const isInstagram = p === "instagram";
          const isLinkedin = p === "linkedin";
          const isTwitch = p === "twitch";
          
          let Icon = Terminal;
          let color = "var(--arcade-green)";
          if (isTwitter) { Icon = Twitter; color = "var(--arcade-blue)"; }
          if (isGithub) { Icon = Github; color = "white"; }
          if (isYoutube) { color = "var(--arcade-red)"; }
          if (isInstagram) { color = "#E4405F"; }
          if (isLinkedin) { color = "#0077B5"; }
          if (isTwitch) { color = "var(--arcade-purple)"; }

          return (
            <div key={idx} className="pixel-border" style={{ backgroundColor: "var(--arcade-dark)", padding: "32px", border: `2px solid ${color}` }}>
              
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", borderBottom: `1px solid ${color}40`, paddingBottom: "16px" }}>
                <Icon size={24} color={color} />
                <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "16px", color: color, margin: 0, textTransform: "uppercase" }}>
                  {metric.platform}
                </h3>
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
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <GenericStats data={metric.raw_payload?.profile || metric.raw_payload} />
                  {/* Fallback to JSON if generic stats found nothing */}
                  <div style={{ overflowX: "auto", maxWidth: "100%", marginTop: "16px", padding: "16px", backgroundColor: "rgba(0,0,0,0.2)" }}>
                    <pre style={{ fontFamily: "'VT323', monospace", fontSize: "16px", color: "var(--muted)", margin: 0 }}>
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
