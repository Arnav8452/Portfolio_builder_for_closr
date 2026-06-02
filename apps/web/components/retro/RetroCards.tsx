"use client";

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
  "var(--arcade-purple)",
  "var(--arcade-yellow)",
  "var(--arcade-blue)",
  "var(--arcade-red)",
  "var(--arcade-green)",
];

export function RetroCards({ achievements }: RetroCardsProps) {
  if (!achievements || !Array.isArray(achievements) || achievements.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h2 
        style={{ 
          fontFamily: "'Press Start 2P', monospace", 
          fontSize: "12px", 
          color: "var(--arcade-purple)",
          textTransform: "uppercase",
          marginBottom: "32px",
          display: "flex",
          gap: "16px"
        }}
      >
        <span>02</span>
        <span>.</span>
        <span>PROJECTS</span>
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
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "4px 4px 0 rgba(0,0,0,1)",
              textDecoration: "none",
              cursor: item.url ? "pointer" : "default"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "14px", color: "var(--arcade-ink)", lineHeight: "1.4" }}>
                {item.title}
              </h3>
              {item.url && <ExternalLink size={16} color="var(--arcade-ink)" style={{ flexShrink: 0, opacity: 0.5 }} />}
            </div>
            
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "16px", lineHeight: "1.6", color: "var(--arcade-ink)", flexGrow: 1 }}>
              {item.description}
            </p>
          </CardWrapper>
        )})}
      </div>
    </div>
  );
}
