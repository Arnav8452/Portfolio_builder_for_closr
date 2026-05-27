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
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
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
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", margin: 0, lineHeight: 1.5, fontWeight: 500, color: "inherit" }}>
              {item.description}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
}
