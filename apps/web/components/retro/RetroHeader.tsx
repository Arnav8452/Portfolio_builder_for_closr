import React from "react";
import { ExternalLink, Github, Twitter, Youtube, Twitch, Linkedin, Instagram, Link as LinkIcon } from "lucide-react";
import { RefreshButton } from "./RefreshButton";

type RetroHeaderProps = {
  profile: {
    display_name: string;
    root_platform: string;
    primary_niche: string | null;
    confidence: number | null;
    owner_image?: string | null;
    bio_summary?: string | null;
    verified_links?: Array<{ platform: string; url: string }>;
    slug: string;
  };
  displayImage: string | null;
  overallScore: number;
  isTrustworthy?: boolean;
};

export function RetroHeader({ profile, displayImage, overallScore, isTrustworthy = true }: RetroHeaderProps) {
  // Map confidence or score to a funny grade string like "GETTING THERE"
  let gradeText = "NEEDS WORK";
  if (overallScore >= 80) gradeText = "ELITE TIER";
  else if (overallScore >= 60) gradeText = "SOLID";
  else if (overallScore >= 40) gradeText = "AVERAGE";

  return (
    <div className="pixel-border" 
      style={{
        backgroundColor: "var(--arcade-dark)",
        padding: "clamp(24px, 5vw, 48px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "32px",
        height: "100%"
      }}
    >
      {/* Left Profile */}
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flex: "1 1 300px", maxWidth: "500px" }}>
        {displayImage && (
          <div className="pixel-border" style={{ width: 120, height: 120, backgroundColor: "var(--arcade-cream)", flexShrink: 0 }}>
            <img src={displayImage} alt={profile.display_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ color: "var(--arcade-cream)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
            <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "28px", color: "var(--arcade-cream)", margin: 0, textTransform: "uppercase" }}>
              {profile.display_name}
            </h1>
            {!isTrustworthy && (
              <span className="pixel-border" style={{ 
                backgroundColor: "var(--arcade-red)", 
                color: "white", 
                padding: "4px 12px", 
                fontFamily: "'VT323', monospace", 
                fontSize: "16px",
                fontWeight: "bold",
                animation: "pulse 2s infinite"
              }}>
                NOT TRULY VERIFIED
              </span>
            )}
          </div>
          <p style={{ color: "var(--arcade-cream)", fontFamily: "'Inter', sans-serif", fontSize: "14px", margin: 0, opacity: 0.9, lineHeight: 1.6 }}>
            {profile.bio_summary || "No summary was produced for this creator."}
          </p>
        </div>
      </div>

      {/* Center Player Stats */}
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "12px", 
        padding: "clamp(16px, 4vw, 24px)",
        backgroundColor: "var(--arcade-ink)", 
        border: "2px solid var(--arcade-cream)",
        minWidth: "280px",
        flex: "1 1 300px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--arcade-cream)", paddingBottom: "8px" }}>
          <span style={{ color: "var(--arcade-cream)", fontFamily: "'VT323', monospace", fontSize: "20px" }}>ROOT PLATFORM</span>
          <span style={{ color: "var(--arcade-yellow)", fontFamily: "'VT323', monospace", fontSize: "20px", fontWeight: "bold", textTransform: "uppercase" }}>{profile.root_platform}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--arcade-cream)", paddingBottom: "8px" }}>
          <span style={{ color: "var(--arcade-cream)", fontFamily: "'VT323', monospace", fontSize: "20px" }}>PRIMARY NICHE</span>
          <span style={{ color: "var(--arcade-green)", fontFamily: "'VT323', monospace", fontSize: "20px", fontWeight: "bold", textTransform: "uppercase" }}>{profile.primary_niche?.replace('_', ' ') || "UNKNOWN"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--arcade-cream)", paddingBottom: "8px" }}>
          <span style={{ color: "var(--arcade-cream)", fontFamily: "'VT323', monospace", fontSize: "20px" }}>CONFIDENCE</span>
          <span style={{ color: "var(--arcade-blue)", fontFamily: "'VT323', monospace", fontSize: "20px", fontWeight: "bold" }}>{profile.confidence ? `${(profile.confidence * 100).toFixed(0)}%` : "N/A"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--arcade-cream)", paddingBottom: "8px" }}>
          <span style={{ color: "var(--arcade-cream)", fontFamily: "'VT323', monospace", fontSize: "20px" }}>OVERALL SCORE</span>
          <span style={{ color: "var(--arcade-red)", fontFamily: "'VT323', monospace", fontSize: "20px", fontWeight: "bold" }}>{overallScore} / 100</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--arcade-cream)", fontFamily: "'VT323', monospace", fontSize: "20px" }}>PLAYER RANK</span>
          <span style={{ color: "var(--arcade-purple)", fontFamily: "'VT323', monospace", fontSize: "20px", fontWeight: "bold", textTransform: "uppercase" }}>{gradeText}</span>
        </div>
      </div>

      {/* Right Social Links */}
      {profile.verified_links && profile.verified_links.length > 0 && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: "1 1 200px", justifyContent: "flex-end", alignContent: "flex-start" }}>
          {profile.verified_links.map((link, idx) => {
            let Icon = LinkIcon;
            const p = link.platform.toLowerCase();
            if (p.includes("github")) Icon = Github;
            if (p === "x" || p.includes("twitter")) Icon = Twitter;
            if (p.includes("youtube")) Icon = Youtube;
            if (p.includes("twitch")) Icon = Twitch;
            if (p.includes("linkedin")) Icon = Linkedin;
            if (p.includes("instagram")) Icon = Instagram;
            
            return (
              <a 
                key={idx} 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="pixel-border hover-lift"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "56px",
                  backgroundColor: "var(--arcade-ink)",
                  color: "var(--arcade-cream)",
                }}
                title={`View on ${link.platform}`}
              >
                <Icon size={28} />
              </a>
            );
          })}
          <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
            <RefreshButton slug={profile.slug} />
          </div>
        </div>
      )}
    </div>
  );
}
