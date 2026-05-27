import React from "react";
import { ExternalLink } from "lucide-react";

type RetroHeaderProps = {
  profile: {
    display_name: string;
    root_platform: string;
    primary_niche: string | null;
    confidence: number | null;
    owner_image?: string | null;
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
      {/* Subheader */}
      <div 
        style={{
          backgroundColor: "var(--arcade-cream)",
          borderBottom: "2px solid var(--arcade-ink)",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontFamily: "'Press Start 2P', monospace", fontSize: "14px", textTransform: "uppercase" }}>
          <span>&larr;</span>
          <span>RATE MY {profile.root_platform.toUpperCase()}</span>
        </div>
        <button 
          className="pixel-btn"
          style={{
            backgroundColor: "var(--arcade-blue)",
            color: "var(--arcade-cream)",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          SHARE ON X <ExternalLink size={12} />
        </button>
      </div>

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
            <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "28px", margin: "0 0 16px 0", textTransform: "uppercase" }}>
              {profile.display_name}
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", margin: "0 0 8px 0", fontWeight: 600 }}>
              {profile.primary_niche ? `Niche: ${profile.primary_niche.replace('_', ' ')}` : "Uncategorized Creator"}
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", margin: 0, opacity: 0.9, lineHeight: 1.6 }}>
              {/* @ts-ignore - bio_summary exists on the profile object but might not be in the exact type def */}
              {profile.bio_summary || "No summary was produced for this creator."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
