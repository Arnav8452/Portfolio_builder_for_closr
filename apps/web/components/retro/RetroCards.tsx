import React from "react";
import { ExternalLink } from "lucide-react";

type Achievement = {
  title: string;
  description: string;
};

type RetroCardsProps = {
  achievements?: Achievement[];
};

const BG_COLORS = [
  "var(--arcade-red)",
  "var(--arcade-yellow)",
  "var(--arcade-blue)",
  "var(--arcade-purple)",
  "var(--arcade-green)",
];

export function RetroCards({ achievements }: RetroCardsProps) {
  if (!achievements || achievements.length === 0) return null;

  return (
    <div style={{ padding: "48px 24px", backgroundColor: "var(--arcade-cream)" }}>
      <h2 
        style={{ 
          fontFamily: "'Press Start 2P', monospace", 
          fontSize: "12px", 
          color: "var(--arcade-red)",
          textTransform: "uppercase",
          marginBottom: "32px",
          display: "flex",
          gap: "16px"
        }}
      >
        <span>01</span>
        <span>.</span>
        <span>ACHIEVEMENTS</span>
      </h2>

      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", 
          gap: "16px" 
        }}
      >
        {achievements.map((item, index) => (
          <div 
            key={index}
            className="pixel-border"
            style={{
              backgroundColor: BG_COLORS[index % BG_COLORS.length],
              padding: "24px",
              color: index % BG_COLORS.length === 1 || index % BG_COLORS.length === 4 ? "var(--arcade-ink)" : "white",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "12px", margin: 0, textTransform: "uppercase", lineHeight: 1.5 }}>
              {item.title}
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
              {item.description}
            </p>
          </div>
        ))}

        {/* Zoral Plug Card */}
        <div 
          className="pixel-border"
          style={{
            backgroundColor: "var(--arcade-dark)",
            padding: "24px",
            color: "var(--arcade-cream)",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 32, height: 32, backgroundColor: "white", color: "black", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Press Start 2P', monospace", fontSize: "16px", borderRadius: "4px" }}>
              Z
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "10px", color: "var(--muted-2)", fontFamily: "'Press Start 2P', monospace", marginBottom: "4px" }}>BUILT USING</div>
              <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>Zoral</div>
            </div>
            <ExternalLink size={16} color="var(--muted-2)" />
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", margin: 0, lineHeight: 1.5, color: "#ccc" }}>
            Shadows <span style={{ textDecoration: "underline" }}>one worker</span> for a week, then takes over their job with <span style={{ color: "var(--arcade-purple)" }}>zero extra setup</span>. Behaves exactly like the original.
          </p>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "10px", color: "var(--muted-2)" }}>zoral.ai</div>
        </div>
      </div>
    </div>
  );
}
