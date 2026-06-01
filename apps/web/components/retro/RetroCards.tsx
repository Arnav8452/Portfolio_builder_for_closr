import React from "react";
import { ExternalLink } from "lucide-react";

type Achievement = {
  title: string;
  description: string;
  url?: string;
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
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
          gap: "16px" 
        }}
      >
        {achievements.map((item: any, index) => {
          const CardWrapper = item.url ? "a" : "div";
          return (
          <CardWrapper 
            key={index}
            href={item.url}
            target={item.url ? "_blank" : undefined}
            rel={item.url ? "noopener noreferrer" : undefined}
            className="pixel-border"
            style={{
              backgroundColor: BG_COLORS[index % BG_COLORS.length],
              padding: "24px",
              color: index % BG_COLORS.length === 1 || index % BG_COLORS.length === 4 ? "var(--arcade-ink)" : "white",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              textDecoration: "none",
              cursor: item.url ? "pointer" : "default",
              transition: "transform 0.1s ease",
            }}
            onMouseOver={(e: any) => item.url && (e.currentTarget.style.transform = "translate(-2px, -2px)")}
            onMouseOut={(e: any) => item.url && (e.currentTarget.style.transform = "translate(0, 0)")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "12px", margin: 0, textTransform: "uppercase", lineHeight: 1.5, flex: 1 }}>
                {item.title}
              </h3>
              {item.url && <ExternalLink size={16} style={{ marginLeft: "8px", flexShrink: 0 }} />}
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", margin: 0, lineHeight: 1.5, fontWeight: 500, color: "inherit" }}>
              {item.description}
            </p>
          </CardWrapper>
        )})}

      </div>
    </div>
  );
}
