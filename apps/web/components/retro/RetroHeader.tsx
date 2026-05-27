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
      {/* Top Black Bar */}
      <div 
        style={{
          backgroundColor: "var(--arcade-ink)",
          color: "var(--arcade-green)",
          padding: "8px 24px",
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "8px",
          letterSpacing: "1px",
          textTransform: "uppercase"
        }}
      >
        <span>THIS TOOL WAS BUILT BY AN AI AGENT FROM ZORAL</span>
        <span style={{ color: "var(--arcade-cream)" }}>REPLACE ANY WORKER WITH AI &rarr;</span>
      </div>

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

      {/* Main Hero (Green) */}
      <div 
        style={{
          backgroundColor: "var(--arcade-green)",
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
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "10px", marginBottom: "8px" }}>
              #{(Math.random() * 1000).toFixed(0)} - TOP {(Math.random() * 5).toFixed(1)}%
            </div>
            <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "28px", margin: "0 0 8px 0", textTransform: "uppercase" }}>
              {profile.display_name}
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "14px", margin: "0 0 4px 0" }}>
              {profile.display_name}
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", margin: 0, opacity: 0.8 }}>
              {profile.primary_niche ? `Niche: ${profile.primary_niche.replace('_', ' ')}` : "Uncategorized Creator"}
            </p>
          </div>
        </div>

        {/* Center Grade */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div 
            className="pixel-border"
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "24px",
              color: "var(--arcade-ink)"
            }}
          >
            {overallScore >= 80 ? 'A' : overallScore >= 60 ? 'B' : overallScore >= 40 ? 'C' : 'D'}
          </div>
          <div style={{ textAlign: "center", fontFamily: "'Press Start 2P', monospace", color: "var(--arcade-ink)" }}>
            <div style={{ fontSize: "12px", marginBottom: "4px" }}>{gradeText}</div>
            <div style={{ fontSize: "8px", opacity: 0.7 }}>GREEN ROOM</div>
          </div>
        </div>

        {/* Right Score */}
        <div style={{ textAlign: "right", fontFamily: "'Press Start 2P', monospace", color: "var(--arcade-ink)" }}>
          <div style={{ fontSize: "10px", marginBottom: "8px" }}>OVERALL</div>
          <div style={{ fontSize: "48px", display: "flex", alignItems: "baseline", gap: "12px" }}>
            {overallScore.toFixed(1)}
            <span style={{ fontSize: "14px" }}>/ 100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
