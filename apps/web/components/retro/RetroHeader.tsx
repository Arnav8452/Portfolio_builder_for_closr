import React from "react";
import { ExternalLink, Github, Twitter, Youtube, Twitch, Linkedin, Instagram, Link as LinkIcon } from "lucide-react";

type RetroHeaderProps = {
  profile: {
    display_name: string;
    root_platform: string;
    primary_niche: string | null;
    confidence: number | null;
    owner_image?: string | null;
    bio_summary?: string | null;
    verified_links?: Array<{ platform: string; url: string }>;
  };
  displayImage: string | null;
  overallScore: number;
};

export function RetroHeader({ profile, displayImage, overallScore }: RetroHeaderProps) {
  // Map confidence or score to a funny grade string like "GETTING THERE"
  let gradeText = "NEEDS WORK";
  if (overallScore >= 80) gradeText = "ELITE TIER";
  else if (overallScore >= 60) gradeText = "GETTING THERE";
  else if (overallScore >= 40) gradeText = "AVERAGE";

  return (
    <div style={{ width: "100%" }}>

      {/* Main Hero */}
      <div 
        style={{
          backgroundColor: "var(--arcade-cream-soft)",
          borderBottom: "2px solid var(--arcade-ink)",
          padding: "48px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px"
        }}
      >
        {/* Left Profile */}
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          {displayImage && (
            <div className="pixel-border" style={{ width: 120, height: 120, backgroundColor: "var(--arcade-ink)" }}>
              <img src={displayImage} alt={profile.display_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ color: "var(--arcade-ink)", maxWidth: "400px" }}>
            <h1 style={{ color: "var(--arcade-ink)", fontFamily: "'Press Start 2P', monospace", fontSize: "28px", margin: "0 0 16px 0", textTransform: "uppercase" }}>
              {profile.display_name}
            </h1>
            <p style={{ color: "var(--arcade-ink)", fontFamily: "'Inter', sans-serif", fontSize: "14px", margin: "0 0 8px 0", fontWeight: 600 }}>
              {profile.primary_niche ? `Niche: ${profile.primary_niche.replace('_', ' ')}` : "Uncategorized Creator"}
            </p>
            <p style={{ color: "var(--arcade-ink)", fontFamily: "'Inter', sans-serif", fontSize: "14px", margin: 0, opacity: 0.9, lineHeight: 1.6 }}>
              {profile.bio_summary || "No summary was produced for this creator."}
            </p>
          </div>
        </div>

        {/* Right Social Links */}
        {profile.verified_links && profile.verified_links.length > 0 && (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", maxWidth: "400px", justifyContent: "flex-end" }}>
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
                  className="pixel-border"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "48px",
                    height: "48px",
                    backgroundColor: "var(--arcade-ink)",
                    color: "var(--arcade-cream)",
                    transition: "transform 0.1s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  title={`View on ${link.platform}`}
                >
                  <Icon size={24} />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
