"use client";

import React from "react";
import { ExternalLink, Star } from "lucide-react";

type CardItem = {
  title: string;
  description: string;
  url?: string;
  label?: string;
};

type ColorfulCardsProps = {
  items?: CardItem[];
  title?: string;
  icon?: React.ReactNode;
};

const BG_COLORS = [
  "var(--arcade-purple)",
  "var(--arcade-yellow)",
  "var(--arcade-blue)",
  "var(--arcade-red)",
  "var(--arcade-green)",
];

export function ColorfulCards({ items, title = "HIGHLIGHTS", icon = <Star size={16} /> }: ColorfulCardsProps) {
  if (!items || !Array.isArray(items) || items.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h2 
        style={{ 
          fontFamily: "'Press Start 2P', monospace", 
          fontSize: "12px", 
          color: "var(--arcade-ink)",
          textTransform: "uppercase",
          marginBottom: "32px",
          display: "flex",
          gap: "12px",
          alignItems: "center"
        }}
      >
        <span style={{ color: "var(--arcade-purple)" }}>{icon}</span>
        <span>{title}</span>
      </h2>

      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
          gap: "24px" 
        }}
      >
        {items.map((item, index) => {
          const CardContent = (
            <div 
              className="pixel-border hover-lift"
              style={{
                backgroundColor: BG_COLORS[index % BG_COLORS.length],
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                height: "100%",
                border: "2px solid var(--arcade-ink)",
                cursor: item.url ? "pointer" : "default"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "14px", color: "var(--arcade-ink)", lineHeight: "1.4" }}>
                  {item.title}
                </h3>
                {item.url && <ExternalLink size={16} color="var(--arcade-ink)" style={{ flexShrink: 0, opacity: 0.7 }} />}
              </div>
              
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "15px", lineHeight: "1.6", color: "var(--arcade-ink)", flexGrow: 1, fontWeight: 500 }}>
                {item.description}
              </p>
            </div>
          );

          if (item.url) {
            return (
              <a 
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", display: "block", height: "100%" }}
              >
                {CardContent}
              </a>
            );
          }

          return <div key={index} style={{ height: "100%" }}>{CardContent}</div>;
        })}
      </div>
    </div>
  );
}
