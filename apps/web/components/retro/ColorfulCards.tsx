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
          const CardWrapper = item.url ? "a" : "div";
          const bgColor = BG_COLORS[index % BG_COLORS.length];
          
          return (
            <CardWrapper 
              key={index}
              href={item.url}
              target={item.url ? "_blank" : undefined}
              rel={item.url ? "noopener noreferrer" : undefined}
              className="pixel-border"
              style={{
                backgroundColor: bgColor,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                boxShadow: "6px 6px 0 rgba(0,0,0,1)",
                textDecoration: "none",
                cursor: item.url ? "pointer" : "default",
                transition: "transform 0.1s ease",
                border: "2px solid var(--arcade-ink)"
              }}
              onMouseEnter={(e: any) => { if(item.url) e.currentTarget.style.transform = "translate(-2px, -2px)"; }}
              onMouseLeave={(e: any) => { if(item.url) e.currentTarget.style.transform = "translate(0, 0)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "14px", color: "var(--arcade-ink)", lineHeight: "1.4" }}>
                  {item.title}
                </h3>
                {item.url && <ExternalLink size={16} color="var(--arcade-ink)" style={{ flexShrink: 0, opacity: 0.7 }} />}
              </div>
              
              {item.label && (
                <span style={{ 
                  display: "inline-block",
                  fontFamily: "'VT323', monospace", 
                  fontSize: "14px", 
                  backgroundColor: "rgba(0,0,0,0.1)",
                  padding: "2px 8px",
                  color: "var(--arcade-ink)",
                  alignSelf: "flex-start"
                }}>
                  {item.label}
                </span>
              )}
              
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "15px", lineHeight: "1.6", color: "var(--arcade-ink)", flexGrow: 1, fontWeight: 500 }}>
                {item.description}
              </p>
            </CardWrapper>
          );
        })}
      </div>
    </div>
  );
}
